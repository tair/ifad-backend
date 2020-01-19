import {GeneMap, IAnnotation} from "../utils/ingest";
import {IFilterParam} from "../services/v1_service/service";

/**
 * Whether to match genes and annotations when:
 *   At least on filter matches that gene or annotation (union)
 *   All filters match that gene or annotation (intersection)
 */
export type Strategy = "union" | "intersection";

export type QueryGetAll = { tag: "QueryGetAll" };
export type QueryWith = {
  tag: "QueryWith",
  strategy: Strategy,
  filters: IFilterParam[],
};
export type QueryOption = QueryGetAll | QueryWith;

/**
 * Given a selector over Annotated genes, return a subset of genes and a
 * subset of annotations which match the criteria.
 *
 * @param annotations The list of annotations over which to perform the query.
 * @param geneMap The map of unique genes which annotations may refer to.
 * @param query
 */
export const queryAnnotated = (
  annotations: IAnnotation[],
  geneMap: GeneMap,
  query: QueryOption,
): [GeneMap, IAnnotation[]] => {

  switch (query.tag) {
    // When no filters are provided, we return info on all annotations.
    case "QueryGetAll": {
      // Construct a list of all gene names in all annotations.
      const geneNamesInAnnotations = new Set(
        annotations.flatMap(a => [a.UniqueGeneName, ...a.AlternativeGeneName])
      );

      // Group all of the genes that appear in the annotations list.
      const queriedGenes = Object.entries(geneMap)
        .filter(([geneId, _]) => geneNamesInAnnotations.has(geneId))
        .reduce((acc, [geneId, gene]) => {
          acc[geneId] = gene;
          return acc;
        }, {});

      return [queriedGenes, annotations];
    }

    case "QueryWith": {
      const filters = query.filters;

      switch (query.strategy) {
        // Apply all of the given filters as a union, including any gene or annotations
        // which matched any of the filters in the result.
        case "union": {
          const queriedAnnotations = annotations.filter((item: IAnnotation) => {
            return filters.some(filter =>
              filter.aspect === item.Aspect &&
              filter.annotation_status === item.AnnotationStatus
            );
          });

          const geneNamesInAnnotations = new Set(
            queriedAnnotations.flatMap(a => [a.UniqueGeneName, ...a.AlternativeGeneName])
          );

          const queriedGenes = Object.entries(geneMap)
            .filter(([geneId, _]) => geneNamesInAnnotations.has(geneId))
            .reduce((acc, [geneId, gene]) => {
              acc[geneId] = gene;
              return acc;
            }, {});

          return [queriedGenes, queriedAnnotations];
        }

        // Apply all of the given filters as an intersection. This will always return zero
        // annotations, and will only include genes which appear in annotations represented
        // by ALL of the given filters.
        case "intersection": {
          const queriedGeneMap = Object.entries(geneMap)
            .filter(([_, { annotations }]) => {

              const gene_annotations = [...annotations];

              // We keep a GeneMap entry if for EVERY query filter given, there is
              // at least ONE annotation for this gene that matches it.
              const every_filter_result = query.filters.every(filter => {
                const some_annotation_result = gene_annotations.some(annotation =>
                  filter.aspect === annotation.Aspect &&
                  filter.annotation_status === annotation.AnnotationStatus);
                return some_annotation_result;
              });

              return every_filter_result;
            })
            .reduce((acc, [geneId, value]) => {
              acc[geneId] = value;
              return acc;
            }, {});

          return [queriedGeneMap, []];
        }
      }
    }
  }
};

/**
 * Given a selector over Unannotated genes, return a subset of genes which
 * match the filter criteria of the selector.
 *
 * @param annotations The list of annotations over which to perform the query.
 * @param geneMap The map of unique genes which annotations may refer to.
 * @param filter
 */
export const queryUnannotated = (
  annotations: IAnnotation[],
  geneMap: GeneMap,
  filter: QueryOption,
): GeneMap => {

  switch (filter.tag) {
    case "QueryGetAll":
      const geneNamesInAnnotations = new Set(
        annotations.flatMap(a => [...a.AlternativeGeneName, a.UniqueGeneName])
      );
      const queriedGenes = Object.entries(geneMap)
        .filter(([geneId, _]) => geneNamesInAnnotations.has(geneId))
        .reduce((acc, [geneId, gene]) => {
          acc[geneId] = gene;
          return acc;
        }, {});
      return queriedGenes;
    default:
  }

  return {};

  // const queriedAnnotations = annotations.filter((item: IAnnotation) =>
  //   selector(({aspect}: IFilterParam) => item.Aspect === aspect)
  // );
  //
  // const annotatedGeneNames = new Set(
  //   queriedAnnotations
  //     .flatMap(annotation => annotation.AlternativeGeneName)
  // );
  //
  // return Object.entries(geneMap)
  //   // Take only the gene entries which don't exist in the annotatedGeneNames
  //   .filter(([geneId, _]) => !annotatedGeneNames.has(geneId))
  //   // Reassemble the (geneId, gene) array into an object
  //   .reduce((acc, [geneId, gene]) => {
  //     acc[geneId] = gene;
  //     return acc;
  //   }, {});
};

