import {
  AnnotationStatus,
  Aspect,
  GeneIndex,
  Annotation,
  StructuredData,
} from "../utils/ingest";

/**
 * A Segment describes exactly one Aspect and one AnnotationStatus.
 * These two pieces together represent exactly one pie slice which
 * is available to select from IFAD's frontend. Segments may be
 * used as components to queries over the entire Genome dataset,
 * describing which genes and annotations to include or exclude
 * from the final result.
 */
export type Segment = {
  aspect: Aspect,
  annotationStatus: AnnotationStatus,
};

/**
 * The Strategy of a query describes whether to include a gene or
 * annotation in a result when that item belongs to _at least one_
 * segment in the query (union) or when that item belongs to
 * _all of_ the segments in the query (intersection).
 */
export type Strategy = "union" | "intersection";

/**
 * A QueryOption describes the strategy and parameters of the query
 * to perform for `queryAnnotated`. A value of type QueryOption may
 * be exactly one of the variants given, and each variant may have
 * additional data bundled with it that further describes the nature
 * of the query to perform.
 */
export type QueryOption = QueryGetAll | QueryWith;
export type QueryGetAll = { tag: "QueryGetAll" };
export type QueryWith = {
  tag: "QueryWith",
  strategy: Strategy,
  segments: Segment[],
};

export type QueryResult = {
  genes: GeneIndex,
  annotations: Annotation[],
};

/**
 * Given the full set of Annotations and Genes and given a QueryOption,
 * return the subset of Genes and Annotations represented by the query.
 */
export const queryAnnotated = (
  dataset: StructuredData,
  query: QueryOption,
): QueryResult => {

  switch (query.tag) {
    // When no segments are provided in the query, we simply return all annotations
    // and all of the genes that those annotations reference.
    case "QueryGetAll": {
      return queryAll(dataset);
    }

    case "QueryWith": {

      switch (query.strategy) {
        // Find the union of all of the segments given in the query options. This will
        // include all genes or annotations which match _any_ of the given segments.
        case "union": {
          return queryWithUnion(dataset, query.segments);
        }

        // Find the intersection of all of the segments given in the query options.
        // This will include only those genes which match _all_ of the given segments.
        // Annotations can never belong to more than one segment.
        // TODO the intersection of ONE segment should still return annotations
        case "intersection": {
          return queryWithIntersection(dataset, query.segments);
        }
      }
    }
  }
};

/**
 * Returns all of the annotations from the given dataset as well as
 * all of the genes which are referenced by any of those annotations.
 *
 * Note that if there are any genes in the dataset which are never
 * referenced by any annotations, they will not be returned.
 *
 * @param dataset The active dataset to query results from.
 */
const queryAll = (dataset: StructuredData): QueryResult => {
  const annotations = dataset.annotations.records;

  // Construct a list of all gene names in all annotations.
  const geneNamesInAnnotations = new Set(
    annotations.flatMap(a => [a.UniqueGeneName, ...a.AlternativeGeneName])
  );

  // Group all of the genes that appear in the annotations list.
  const queriedGenes = Object.entries(dataset.genes.index)
    .filter(([geneId, _]) => geneNamesInAnnotations.has(geneId))
    .reduce((acc, [geneId, gene]) => {
      acc[geneId] = gene;
      return acc;
    }, {});

  return {
    genes: queriedGenes,
    annotations,
  };
};

const querySegment = (
  dataset: StructuredData,
  segment: Segment,
): QueryResult => {
  const aspect = dataset.annotations.index[segment.aspect];

  // Collect all gene IDs that match this segment.
  const geneIds = new Set<string>();
  switch (segment.annotationStatus) {
    case "KNOWN_EXP":
      aspect.known.exp.forEach(gene => geneIds.add(gene));
      break;
    case "KNOWN_OTHER":
      aspect.known.other.forEach(gene => geneIds.add(gene));
      break;
    case "UNKNOWN":
      aspect.unknown.forEach(gene => geneIds.add(gene));
      break;
    case "UNANNOTATED":
      aspect.unannotated.forEach(gene => geneIds.add(gene));
      break;
  }

  const geneIdsArray: string[] = [...geneIds];
  const genes: GeneIndex = geneIdsArray
    .map(geneId => dataset.genes.index[geneId])
    .reduce((acc, { gene, annotations }) => {
      acc[gene.GeneID] = { gene, annotations };
      return acc;
    }, {});

  const annotations: Annotation[] = geneIdsArray
    .map(geneId => dataset.genes.index[geneId].annotations)
    .flatMap(annotations => [...annotations])
    .filter(annotation => {
      return annotation.Aspect === segment.aspect &&
        annotation.AnnotationStatus === segment.annotationStatus;
    });

  return { genes, annotations };
};

/**
 * Returns all of the annotations from the given dataset which belong
 * to at least one of the given segments, as well as all of the genes
 * referenced by those annotations.
 *
 * @param dataset The active dataset to query results from.
 * @param segments A list of segments given by the user in order to find
 * all genes that belong to the union of those segments.
 */
const queryWithUnion = (
  dataset: StructuredData,
  segments: Segment[],
): QueryResult => {
  let queriedGenes: GeneIndex = {};
  let queriedAnnotations: Annotation[] = [];

  for (const segment of segments) {
    const { annotations, genes } = querySegment(dataset, segment);

    // Insert genes from this segment into the queriedGenes
    Object.entries(genes)
      .forEach(([geneId, gene]) =>
        queriedGenes[geneId] = gene);

    annotations.forEach(annotation => queriedAnnotations.push(annotation));
  }

  return {
    genes: queriedGenes,
    annotations: queriedAnnotations,
  };
};

/**
 * Returns all of the genes from the given dataset which have at least
 * one annotation in _all_ of the given segments.
 *
 * @param dataset The active dataset to query results from.
 * @param segments A list of segments given by the user in order to find
 * all genes that belong to the intersection of those segments.
 */
const queryWithIntersection = (
  dataset: StructuredData,
  segments: Segment[],
): QueryResult => {
  const queriedGeneMap = Object.entries(dataset.genes.index)
    .filter(([_, { annotations }]) => {

      const gene_annotations = [...annotations];

      // We keep a GeneMap entry if for EVERY query filter given, there is
      // at least ONE annotation for this gene that matches it.
      const every_filter_result = segments.every(filter => {
        const some_annotation_result = gene_annotations.some(annotation =>
          filter.aspect === annotation.Aspect &&
          filter.annotationStatus === annotation.AnnotationStatus);
        return some_annotation_result;
      });

      return every_filter_result;
    })
    .reduce((acc, [geneId, value]) => {
      acc[geneId] = value;
      return acc;
    }, {});

  return {
    genes: queriedGeneMap,
    annotations: [],
  };
};
