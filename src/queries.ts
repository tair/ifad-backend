import {OrderedSet, Set} from "immutable";
import {
  Aspect,
  AnnotationStatus,
  Gene,
  GeneIndex,
  Annotation,
  AnnotationIndexElement,
  indexAnnotations,
  StructuredData,
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

      switch (query.strategy) {
        // Find the union of all of the segments given in the query options. This will
        // include all genes or annotations which match _any_ of the given segments.
        case "union": {

          return query.segments
            .map(segment => querySegment(dataset, segment))
            .reduce(union);

          // return queryWithUnion(dataset, query.segments);
        }

        // Find the intersection of all of the segments given in the query options.
        // This will include only those genes which match _all_ of the given segments.
        // Annotations can never belong to more than one segment.
        // TODO the intersection of ONE segment should still return annotations
        case "intersection": {

          return query.segments
            .map(segment => querySegment(dataset, segment))
            .reduce(intersect);
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
  const geneNamesInAnnotations = annotations.flatMap((anno) =>
    anno.get("AlternativeGeneName").concat(anno.get("UniqueGeneName")));

  // Group all of the genes that appear in the annotations list.
  const geneIndex: GeneIndex = dataset.genes.index
    .filter((_, geneId) => geneNamesInAnnotations.has(geneId))
    .toMap();

  const { annotationIndex } = indexAnnotations(geneIndex, annotations);

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

/**
 * Queries the genes and annotations for one segment.
 *
 * @param dataset The dataset to query from.
 * @param segment The segment of genes and annotations to find.
 */
export const querySegment = (
  dataset: StructuredData,
  segment: Segment,
): QueryResult => {
  const aspect: AnnotationIndexElement = dataset.annotations.index.get(segment.aspect);

  const keyPaths = {
    KNOWN_EXP: "knownExp",
    KNOWN_OTHER: "knownOther",
    UNKNOWN: "unknown",
    UNANNOTATED: "unannotated",
  };
  const keyPath = keyPaths[segment.annotationStatus];

  // Collect all gene IDs that match this segment.
  const genes: Set<Gene> = aspect.getIn([keyPath]);
  const geneIndex: GeneIndex = genes.toKeyedSeq()
    .mapKeys(gene => gene.get("GeneID"))
    .map((_, geneId) => dataset.genes.index.get(geneId))
    .flatMap((maybeGene, geneId) => {
      if (maybeGene === undefined) return [];
      return [[geneId, maybeGene]];
    })
    .toMap();
  const geneRecords = genes.toOrderedSet();

  const queriedAnnotations: OrderedSet<Annotation> = geneIndex.keySeq()
    .map(geneId => dataset.genes.index.get(geneId))
    .flatMap<Annotation>(maybeGeneIndex => {
      if (maybeGeneIndex === undefined) return [];
      return maybeGeneIndex.get("annotations");
    })
    .filter(annotation => {
      return annotation.get("Aspect") === segment.aspect &&
        annotation.get("AnnotationStatus") === segment.annotationStatus;
    })
    .toOrderedSet();

  const { annotationIndex } = indexAnnotations(geneIndex, queriedAnnotations);

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
 * Returns all of the annotations which belong to at least one of the given segments,
 * as well as all of the genes referenced by those annotations.
 *
 * @param one The dataset from the first segment
 * @param two The datset from the second segment
 */
const union = (one: StructuredData, two: StructuredData): QueryResult => {

  // Union Gene Index
  const geneIndexUnion: GeneIndex = one.genes.index.concat(two.genes.index);
  const geneRecordsUnion: OrderedSet<Gene> = geneIndexUnion.valueSeq()
    .map(value => value.get("gene"))
    .toOrderedSet();

  // Union Annotations
  const annotationRecordUnion: OrderedSet<Annotation> =
    one.annotations.records.concat(two.annotations.records);
  const { annotationIndex: annotationIndexUnion } =
    indexAnnotations(geneIndexUnion, annotationRecordUnion);

  return {
    raw: one.raw,
    genes: {
      metadata: one.genes.metadata,
      header: one.genes.header,
      records: geneRecordsUnion,
      index: geneIndexUnion,
    },
    annotations: {
      metadata: one.annotations.metadata,
      header: one.annotations.header,
      records: annotationRecordUnion,
      index: annotationIndexUnion,
    },
  };
};

/**
 * Returns all of the genes which have at least
 * one annotation in both of the given segments.
 *
 * @param one The dataset of the first segment
 * @param two The dataset of the second segment
 */
const intersect = (one: StructuredData, two: StructuredData): QueryResult => {

  // Take the intersection of genes
  const geneIndexIntersection = one.genes.index
    .filter((_, geneId) => two.genes.index.has(geneId));
  const geneRecordsIntersection = one.genes.records
    .filter(gene => geneIndexIntersection.has(gene.get("GeneID")));

  // Take the union of the annotations
  const annotationRecordUnion: OrderedSet<Annotation> =
    one.annotations.records.concat(two.annotations.records);

  // Keep only the annotations with genes in the intersection
  const annotationRecordIntersection: OrderedSet<Annotation> = annotationRecordUnion
    .filter(item => item.get("GeneNames")
      .some(name => geneIndexIntersection.has(name)));

  const { annotationIndex: annotationIndexIntersection } =
    indexAnnotations(geneIndexIntersection, annotationRecordIntersection);

  return {
    raw: one.raw,
    genes: {
      metadata: one.genes.metadata,
      header: one.genes.header,
      records: geneRecordsIntersection,
      index: geneIndexIntersection,
    },
    annotations: {
      metadata: one.annotations.metadata,
      header: one.annotations.header,
      records: annotationRecordIntersection,
      index: annotationIndexIntersection,
    },
  };
};
