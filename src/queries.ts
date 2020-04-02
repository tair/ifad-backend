import {
  AnnotationStatus,
  Aspect,
  GeneIndex,
  Annotation,
  StructuredData,
  indexAnnotations,
} from "./ingest";

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

export type Filter = "all" | "include_protein" | "exclude_pseudogene";

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
  filter: Filter,
  strategy: Strategy,
  segments: Segment[],
};

export type QueryResult = StructuredData;

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

      let predicate: (productType: string) => boolean;
      switch (query.filter) {
        case "all": {
          predicate = (_: string) => true;
          break;
        }
        case "include_protein": {
          predicate = (productType => productType === "protein_coding");
          break;
        }
        case "exclude_pseudogene": {
          predicate = (productType => productType !== "pseudogene");
          break;
        }
      }

      switch (query.strategy) {
        // Find the union of all of the segments given in the query options. This will
        // include all genes or annotations which match _any_ of the given segments.
        case "union": {
          const result = query.segments
            .map(segment => querySegment(dataset, segment))
            .reduce(union);
          return filterProductType(result, predicate);
        }

        // Find the intersection of all of the segments given in the query options.
        // This will include only those genes which match _all_ of the given segments.
        // Annotations can never belong to more than one segment.
        // TODO the intersection of ONE segment should still return annotations
        case "intersection": {
          const result = query.segments
            .map(segment => querySegment(dataset, segment))
            .reduce(intersect);
          return filterProductType(result, predicate);
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
  const geneIndex = Object.entries(dataset.genes.index)
    .filter(([geneId, _]) => geneNamesInAnnotations.has(geneId))
    .reduce((acc, [geneId, gene]) => {
      acc[geneId] = gene;
      return acc;
    }, {});

  const annotationIndex = indexAnnotations(geneIndex, annotations);

  return {
    raw: dataset.raw,
    genes: {
      metadata: dataset.genes.metadata,
      header: dataset.genes.header,
      records: dataset.genes.records,
      index: geneIndex,
    },
    annotations: {
      metadata: dataset.annotations.metadata,
      header: dataset.annotations.header,
      records: dataset.annotations.records,
      index: annotationIndex,
    },
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
  const geneIndex: GeneIndex = geneIdsArray
    .map(geneId => dataset.genes.index[geneId])
    .reduce((acc, { gene, annotations }) => {
      acc[gene.GeneID] = { gene, annotations };
      return acc;
    }, {});

  const geneRecords = Object.values(geneIndex)
    .map(({ gene }) => gene);

  const queriedAnnotations: Annotation[] = geneIdsArray
    .map(geneId => dataset.genes.index[geneId].annotations)
    .flatMap(annotations => [...annotations])
    .filter(annotation => {
      return annotation.Aspect === segment.aspect &&
        annotation.AnnotationStatus === segment.annotationStatus;
    });

  const annotationIndex = indexAnnotations(geneIndex, queriedAnnotations);

  return {
    raw: dataset.raw,
    genes: {
      metadata: dataset.genes.metadata,
      header: dataset.genes.header,
      records: geneRecords,
      index: geneIndex,
    },
    annotations: {
      metadata: dataset.annotations.metadata,
      header: dataset.annotations.header,
      records: queriedAnnotations,
      index: annotationIndex,
    },
  };
};

/**
 * Given two datasets, return all genes from both datasets as well
 * as all of the annotations for those genes.
 *
 * @param one The first dataset
 * @param two The second dataset
 */
const union = (one: StructuredData, two: StructuredData): QueryResult => {
  const geneIndex: GeneIndex = [
    ...Object.entries(one.genes.index),
    ...Object.entries(two.genes.index),
  ].reduce((acc, [geneId, geneElement]) => {
    acc[geneId] = geneElement;
    return acc;
  }, {});

  const geneRecords = Object.values(geneIndex)
    .map(geneElement => geneElement.gene);

  const unionAnnotations = new Set([
    ...one.annotations.records,
    ...two.annotations.records,
  ]);

  const annotationRecords = Array.from(unionAnnotations);
  const annotationIndex = indexAnnotations(geneIndex, annotationRecords);

  return {
    raw: one.raw,
    genes: {
      metadata: one.genes.metadata,
      header: one.genes.header,
      index: geneIndex,
      records: geneRecords,
    },
    annotations: {
      metadata: one.annotations.metadata,
      header: one.annotations.header,
      index: annotationIndex,
      records: annotationRecords,
    },
  };
};

/**
 * Given two datasets, returns the genes that belong to both datasets
 * as well as all of the annotations for those genes.
 *
 * @param one The first dataset
 * @param two The second dataset
 */
const intersect = (one: StructuredData, two: StructuredData): QueryResult => {
  // Take the intersection of genes
  const geneIndex: GeneIndex = Object.entries(one.genes.index)
    .filter(([geneId, _]) => two.genes.index.hasOwnProperty(geneId))
    .reduce<GeneIndex>((acc, [geneId, geneElement]) => {
      acc[geneId] = geneElement;
      return acc;
    }, {});

  const geneRecords = Object.values(geneIndex)
    .map(geneElement => geneElement.gene);

  // Take the union of annotations
  const unionAnnotations = new Set([
    ...one.annotations.records,
    ...two.annotations.records,
  ]);

  const annotationRecords = Array.from(unionAnnotations)
    .filter(annotation => annotation.GeneNames.some(name => geneIndex.hasOwnProperty(name)));

  const annotationIndex = indexAnnotations(geneIndex, annotationRecords);

  return {
    raw: one.raw,
    genes: {
      metadata: one.genes.metadata,
      header: one.genes.header,
      index: geneIndex,
      records: geneRecords,
    },
    annotations: {
      metadata: one.annotations.metadata,
      header: one.annotations.header,
      index: annotationIndex,
      records: annotationRecords,
    },
  };
};

/**
 * Given a queried dataset, apply a filter to the Gene Product Type of
 * the results.
 *
 * @param dataset The dataset to apply a filter to.
 * @param predicate Given the Gene Product Type, determines whether
 *                  to keep Genes with that product type.
 */
const filterProductType = (dataset: StructuredData, predicate: (productType: string) => boolean): QueryResult => {
  const geneIndex: GeneIndex = Object.entries(dataset.genes.index)
    .filter(([_, geneElement]) => predicate(geneElement.gene.GeneProductType))
    .reduce((acc, [geneId, geneElement]) => {
      acc[geneId] = geneElement;
      return acc;
    }, {});
  const geneRecords = Object.values(geneIndex).map(geneElement => geneElement.gene);

  const annotationRecords = dataset.annotations.records.filter(annotation =>
    annotation.GeneNames.some(name => geneIndex.hasOwnProperty(name)));
  const annotationIndex = indexAnnotations(geneIndex, annotationRecords);

  return {
    raw: dataset.raw,
    genes: {
      metadata: dataset.genes.metadata,
      header: dataset.genes.header,
      index: geneIndex,
      records: geneRecords,
    },
    annotations: {
      metadata: dataset.annotations.metadata,
      header: dataset.annotations.header,
      index: annotationIndex,
      records: annotationRecords,
    },
  };
};
