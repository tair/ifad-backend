import {OrderedSet, Set} from "immutable";
import {
  AnnotationStatus,
  Aspect,
  GeneIndex,
  Annotation,
  StructuredData,
  indexAnnotations,
  Gene,
  AnnotationIndex, GeneIndexElement,
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
const emptyQuery = (dataset: StructuredData): QueryResult => ({
  raw: dataset.raw,
  genes: {
    metadata: dataset.genes.metadata,
    header: dataset.genes.header,
    records: OrderedSet(),
    index: GeneIndex(),
  },
  annotations: {
    metadata: dataset.annotations.metadata,
    header: dataset.annotations.header,
    records: OrderedSet(),
    index: AnnotationIndex(() => Set())(),
  }
});

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

          // return queryWithIntersection(dataset, query.segments);
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
  const aspect = dataset.annotations.index.get(segment.aspect);

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
    .map((gene, geneId) => dataset.genes.index.get(geneId))
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
  let geneIndex: GeneIndex = GeneIndex();
  let annotationRecords: OrderedSet<Annotation> = OrderedSet();

  for (const segment of segments) {
    const segmentQueryResults = querySegment(dataset, segment);

    // Insert genes from this segment into the queriedGenes
    segmentQueryResults.genes.index
      .forEach((geneElement, geneId) => {
        geneIndex = geneIndex.set(geneId, geneElement);
      });

    // Add all annotations from this segment into the queriedAnnotations
    segmentQueryResults.annotations.records
      .forEach(annotation => annotationRecords = annotationRecords.add(annotation));
  }

  const geneRecords = geneIndex.valueSeq()
    .map(value => value.get("gene"))
    .toOrderedSet();

  const annotationIndex = indexAnnotations(geneIndex, annotationRecords);

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
      records: annotationRecords,
      index: annotationIndex,
    },
  };
};

const union = (one: StructuredData, two: StructuredData): QueryResult => {

  // Union Gene Index
  const geneIndexUnion: GeneIndex = one.genes.index.concat(two.genes.index);
  const geneRecordsUnion: OrderedSet<Gene> = geneIndexUnion.valueSeq()
    .map(value => value.get("gene"))
    .toOrderedSet();

  // Union Annotations
  const annotationRecordUnion: OrderedSet<Annotation> =
    one.annotations.records.concat(two.annotations.records);
  const annotationIndexUnion: AnnotationIndex =
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
  if (segments.length === 0) return emptyQuery(dataset);
  if (segments.length === 1) return querySegment(dataset, segments[0]);

  let geneIndex: GeneIndex = GeneIndex();
  let annotationUnion: OrderedSet<Annotation> = OrderedSet();

  for (const segment of segments) {
    const segmentResult = querySegment(dataset, segment);
    const segmentGenes = segmentResult.genes.index;
    const segmentAnnotations = segmentResult.annotations.records;

    // Take the intersection with genes from other segments
    if (geneIndex.isEmpty()) {
      geneIndex = segmentGenes;
    } else {
      geneIndex = geneIndex.filter((_, geneId) =>
        segmentGenes.has(geneId))
    }

    // Take the union with annotations from other segments
    annotationUnion = annotationUnion.union(segmentAnnotations);
  }

  // Filter out annotations whose genes don't belong to the intersection
  const annotationRecords = annotationUnion
    .filter((annotation) => annotation.get("GeneNames")
      .some(name => geneIndex.has(name)));

  const geneRecords = geneIndex.valueSeq()
    .map((indexElement) => indexElement.get("gene"))
    .toOrderedSet();
  const annotationIndex = indexAnnotations(geneIndex, annotationRecords);

  // const maybeHead = segments.shift();
  // if (!maybeHead) return emptyQuery(dataset);
  // const head: Segment = maybeHead;
  // const headResults = querySegment(dataset, head);
  //
  // let genes: Set<Gene> = new Set([...headResults.genes.records]);
  // let annotations: Set<Annotation> = new Set([...headResults.annotations.records]);
  //
  // for (const segment of segments) {
  //   const result = querySegment(dataset, segment);
  //
  //   // Take the intersection with genes from other segments
  //   genes = new Set(Array.from(genes).filter(gene => result.genes.records.includes(gene)));
  //
  //   // Take the union with annotations from other segments
  //   result.annotations.records.forEach(record => annotations.add(record));
  // }

  // const geneRecords = Array.from(genes);
  // const geneRecordNames = geneRecords.map(gene => gene.GeneID);
  //
  // // Filter out annotations whose genes don't belong to the intersection
  // const annotationRecords = Array.from(annotations).filter(anno => {
  //   const names = [anno.UniqueGeneName, ...anno.AlternativeGeneName];
  //   return names.some(name => geneRecordNames.includes(name));
  // });
  //
  // const geneIndex = indexGenes(geneRecords, annotationRecords);
  // const annotationIndex = indexAnnotations(geneIndex, annotationRecords);

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
      records: annotationUnion,
      index: annotationIndex,
    },
  };
};

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

  const annotationIndexIntersection: AnnotationIndex =
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
