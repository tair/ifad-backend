import {Errors, GET, Path, QueryParam, Return, ContextResponse} from "typescript-rest";
import {AnnotationStatus, Aspect, makeAnnotationIndex} from "../ingest";
import {QueryOption, Segment, Strategy} from "../queries";
import {annotationsToGAF, genesToCSV, buildGenesMetadata, buildAnnotationMetadata} from '../export';
import { getDataset } from '../data_fetcher';
import express from "express";

type Format = "gaf" | "gene-csv" | "json";

type QueryStatus = "EXP" | "OTHER" | "UNKNOWN" | "UNANNOTATED";

@Path("/api/v1")
export class V1Service {

  @Path("/genes")
  @GET
  genes(
    /**
     * ?segments[]
     * This query is used to generate a selection of genes and annotations
     * according to which Segment (Aspect and Annotation Status) they belong to.
     */
    @QueryParam("segments") maybeSegments: string[],
    /**
     * ?filter=""
     * This filter describes which subset of Genes will be used for querying.
     * The option for filter are "all" | "include_protein" | "exclude_pseudogene".
     */
    @QueryParam("filter") maybeFilter: string = "all",
    /**
     * ?strategy
     * This query parameter is used to choose whether genes and annotations
     * are selected using a "union" strategy (where at least one segment must
     * match) or using an "intersection" strategy (where all segments must
     * match). The default value is "union".
     */
    @QueryParam("strategy") maybeStrategy: string = "union",
    /**
     * ?format
     * This query parameter is used to choose the file format which the
     * selected data is returned in. This is JSON by default, but may also
     * be set to "gaf" for annotation data, or "gene-csv" for gene data.
     */
    @QueryParam("format") maybeFormat: string = "json",
    @ContextResponse response: express.Response
  ) {
    // Validate all of the segment query params. This throws a 400 if any are formatted incorrectly.
    const segments: Segment[] = (maybeSegments || []).map(validateSegments);
    const filter: GeneProductTypeFilter = validateFilter(maybeFilter);
    const format = validateFormat(maybeFormat);

    let segments_meta: {[key: string]: string} = {filter};

    let option: QueryOption;
    if (segments.length === 0) {
      option = {tag: "QueryGetAll"};
    } else {

      // Validates the strategy query param string, which must be exactly "union" or "intersection".
      const strategy: Strategy = validateStrategy(maybeStrategy);
      option = {tag: "QueryWith", strategy, segments};
      segments_meta.segments = segments.map(s=>`${s.aspect}-${s.annotationStatus}`).join(", ");
      segments_meta.strategy = strategy;
    }

    const dataset = getDataset();

    // TODO include unannotated genes
    const queriedDataset = queryAnnotated(dataset, query);

    // TODO include unannotated genes
    const format = validateFormat(maybeFormat);

    const filters_meta = {filters: segments.map(f=>`${f.aspect}-${f.annotationStatus}`).join(", ")};

    switch (format) {
      case "gaf":
        const gafFileStream = annotationsToGAF(queriedDataset, segments_meta);
        response.status(200);
        response.setHeader("Content-Type", "application/csv");
        response.setHeader("Content-disposition", "attachment;filename=gene-association.gaf");
        gafFileStream.pipe(response);
        return Return.NoResponse;
      case "gene-csv":
        const csvFileStream = genesToCSV(queriedDataset, segments_meta);
        response.status(200);
        response.setHeader("Content-Type", "application/csv");
        response.setHeader("Content-disposition", "attachment;filename=gene-types.csv");
        csvFileStream.pipe(response);
        return Return.NoResponse;
      case "json":
        return {
          gene_count: queriedDataset.genes.records.length,
          annotation_count: queriedDataset.annotations.records.length,
          gene_metadata: buildGenesMetadata(queriedDataset, segments_meta),
          annotation_metadata: buildAnnotationMetadata(queriedDataset, segments_meta)
        };
    }
  }

  @Path("/wgs_segments")
  @GET
  get_wgs() {
    const dataset = getDataset();
    const totalGeneCount = Object.keys(dataset.genes.index).length;

    const totalGeneCount = Object.keys(queryResult.genes.index).length;
    const result = Object.entries(queryResult.annotations.index)
      .reduce((acc, [aspect, {all, known: {all: known_all, exp, other}, unknown}]) => {
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
function validateQueryStatus(maybeStatus: string): maybeStatus is QueryStatus {
  return maybeStatus === "EXP" ||
    maybeStatus === "OTHER" ||
    maybeStatus === "UNKNOWN" ||
    maybeStatus === "UNANNOTATED";
}

/**
 * In order to prevent API compatibility with the frontend, we continue to
 * use ("EXP" | "OTHER" | "UNKNOWN" | "UNANNOTATED") as the valid options
 * for the query, but here we transform those into the inner-used
 * ("KNOWN_EXP" | "KNOWN_OTHER" | "UNKNOWN" | "UNANNOTATED").
 *
 * @param queryStatus The Annotation status read from the API query.
 */
function intoAnnotationStatus(queryStatus: QueryStatus): AnnotationStatus {
  switch (queryStatus) {
    case "EXP":
      return "KNOWN_EXP";
    case "OTHER":
      return "KNOWN_OTHER";
    case "UNKNOWN":
      return "UNKNOWN";
    case "UNANNOTATED":
      return "UNANNOTATED";
  }
}

/**
 * Validates that a segment string is properly formatted.
 *
 * The proper format for a segment is ASPECT,ANNOTATION_STATUS
 * where ASPECT is exactly "P", "C", or "F", and
 * where ANNOTATION_STATUS is exactly "EXP", "OTHER", "UNKNOWN", or "UNANNOTATED".
 *
 * This function throws a 400 if the filter is ill-formatted, or a
 * Segment object with the segment parts if the validation succeeded.
 *
 * @param maybeSegment The string which we are checking is a valid segment.
 */
function validateSegments(maybeSegment: string): Segment {
  const parts = maybeSegment.split(",");
  if (parts.length !== 2) {
    throw new Errors.BadRequestError("each segment must have exactly two parts, an Aspect and an Annotation Status, separated by a comma");
  }

  const [aspect, queryStatus] = parts;
  if (!validateAspect(aspect)) {
    throw new Errors.BadRequestError("the Aspect given in a segment must be exactly 'P', 'C', or 'F'");
  }
  if (!validateQueryStatus(queryStatus)) {
    throw new Errors.BadRequestError("the Annotation Status given in a segment must be exactly 'EXP', 'OTHER', 'UNKNOWN', or 'UNANNOTATED'");
  }

  const annotationStatus = intoAnnotationStatus(queryStatus);
  return {aspect, annotationStatus};
}

/**
 * Validates that a filter string is in a proper format, either
 * 'all', 'include_protein', or 'exclude_pseudogene'.
 *
 * @param maybeFilter the parameter to validate.
 */
function validateFilter(maybeFilter: string): GeneProductTypeFilter {
  if (
    maybeFilter !== "all" &&
    maybeFilter !== "include_protein" &&
    maybeFilter !== "exclude_pseudogene"
  ) {
    throw new Errors.BadRequestError("filter must be 'all', 'include_protein', or 'exclude_pseudogene'");
  }
  return maybeFilter;
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

/**
 * Validates that a query string is a proper Format, either 'gaf', 'gene-csv', or 'json'.
 *
 * Throws a 400 if the query is ill-formatted.
 *
 * @param maybeFormat "gaf", "gene-csv", or "json".
 */
function validateFormat(maybeFormat: string): Format {
  if (
    maybeFormat !== "gaf" &&
    maybeFormat !== "gene-csv" &&
    maybeFormat !== "json"
  ) {
    throw new Errors.BadRequestError("format must be 'gaf', 'gene-csv', or 'json'");
  }
  return maybeFormat;
}
