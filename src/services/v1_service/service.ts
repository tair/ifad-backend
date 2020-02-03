import {readFileSync} from "fs";
import {resolve} from "path";
import {Errors, GET, Path, QueryParam} from "typescript-rest";
import {
  AnnotationStatus,
  Aspect,
  ingestData,
  makeAnnotationIndex, StructuredData,
  UnstructuredText
} from "../../utils/ingest";
import {queryAnnotated, QueryOption, Segment, Strategy} from "../../queries/queries";

// TODO use data fetcher rather than files.
console.log("Begin reading data");
const genesText = readFileSync(resolve("src/assets/gene-types.txt")).toString();
const annotationsText = readFileSync(resolve("src/assets/gene_association.tair")).toString();
const unstructuredText: UnstructuredText = { genesText, annotationsText };
const maybeDataset = ingestData(unstructuredText);
if (!maybeDataset) throw new Error("failed to parse data");
const dataset: StructuredData = maybeDataset;
console.log("Finished parsing data");

@Path("/api/v1")
export class V1Service {

    @Path("/genes")
    @GET
    genes(
        /**
         * ?filter[]
         * This query is used to generate a selection of genes and annotations
         * according to which Aspect and Annotation Status they belong to.
         */
        @QueryParam("filter") maybeFilters: string[],
        /**
         * ?strategy
         * This query parameter is used to choose whether genes and annotations
         * are selected using a "union" strategy (where at least one filter must
         * match) or using an "intersection" strategy (where all filters must
         * match). The default value is "union".
         */
        @QueryParam("strategy") maybeStrategy: string = "union",
    ) {
        // Validate all of the filter query params. This throws a 400 if any are formatted incorrectly.
        const segments: Segment[] = (maybeFilters || []).map(validateSegments);

        let query: QueryOption;
        if (segments.length === 0) {
            query = { tag: "QueryGetAll" };
        } else {

            // Validates the strategy query param string, which must be exactly "union" or "intersection".
            const strategy: Strategy = validateStrategy(maybeStrategy);
            query = { tag: "QueryWith", strategy, segments };
        }

        // TODO include unannotated genes
        const [queriedGenes, queriedAnnotations] = queryAnnotated(dataset, query);

        return {annotatedGenes: queriedGenes, annotations: queriedAnnotations, unannotatedGenes: []};
    }

    @Path("/wgs_segments")
    @GET
    get_wgs() {
      const totalGeneCount = Object.keys(dataset.geneIndex).length;

      const result = Object.entries(dataset.annotations.index)
        .reduce((acc, [aspect, {all, known: {all: known_all, exp, other }, unknown}]) => {
          acc[aspect].all = all.size;
          acc[aspect].known.all = known_all.size;
          acc[aspect].known.exp = exp.size;
          acc[aspect].known.other = other.size;
          acc[aspect].unknown = unknown.size;
          acc[aspect].unannotated = totalGeneCount - all.size;
          return acc;
      }, makeAnnotationIndex(() => 0));

      result["totalGenes"] = totalGeneCount;
      return result;
    }
}

/**
 * Validates a query string as an Aspect, which may be exactly "F", "C", or "P",
 * @param maybeAspect The aspect query string being checked.
 */
function validateAspect(maybeAspect: string): maybeAspect is Aspect {
    return maybeAspect === "F" || maybeAspect === "C" || maybeAspect === "P";
}

/**
 * Validates a query string as an Annotation Status, which must be exactly
 * "EXP", "OTHER", "UNKNOWN", or "UNANNOTATED".
 *
 * @param maybeStatus
 */
function validateAnnotationStatus(maybeStatus: string): maybeStatus is AnnotationStatus {
    return maybeStatus === "EXP" ||
        maybeStatus === "OTHER" ||
        maybeStatus === "UNKNOWN" ||
        maybeStatus === "UNANNOTATED";
}

/**
 * Validates that a filter string is properly formatted.
 *
 * The proper format for a filter is ASPECT,ANNOTATION_STATUS
 * where ASPECT is exactly "P", "C", or "F", and
 * where ANNOTATION_STATUS is exactly "EXP", "OTHER", "UNKNOWN", or "UNANNOTATED".
 *
 * This function throws a 400 if the filter is ill-formatted, or an
 * IFilter object with the filter parts if the validation succeeded.
 *
 * @param maybeFilter The string which we are checking is a valid filter.
 */
function validateSegments(maybeFilter: string): Segment {
    const parts = maybeFilter.split(",");
    if (parts.length !== 2) {
        throw new Errors.BadRequestError("each filter must have exactly two parts, an Aspect and an Annotation Status, separated by a comma");
    }

    const [aspect, annotationStatus] = parts;
    if (!validateAspect(aspect)) {
        throw new Errors.BadRequestError("the Aspect given in a filter must be exactly 'P', 'C', or 'F'");
    }
    if (!validateAnnotationStatus(annotationStatus)) {
        throw new Errors.BadRequestError("the Annotation Status given in a filter must be exactly 'EXP', 'OTHER', 'UNKNOWN', or 'UNANNOTATED'");
    }

    return {aspect, annotationStatus};
}

/**
 * Validates that a query string is a proper strategy, either
 * "union" or "intersection".
 *
 * Throws a 400 if the query is ill-formatted.
 *
 * @param maybeStrategy "union" | "intersection"
 */
function validateStrategy(maybeStrategy: string): Strategy {
    if (maybeStrategy !== "union" && maybeStrategy !== "intersection") {
        throw new Errors.BadRequestError("strategy must be either 'union' or 'intersection'");
    }
    return maybeStrategy;
}
