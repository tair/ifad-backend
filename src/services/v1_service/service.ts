import {Errors, GET, Path, QueryParam} from "typescript-rest";
import {AnnotationStatus, Aspect, IAnnotation, IGene, read_annotations, read_genes} from "../../utils/ingest";

const annotations = read_annotations(process.env["ANNOTATIONS_FILE"] || "../../assets/gene_association.tair");
const genes = read_genes(process.env["GENES_FILE"] || "../../assets/gene-types.txt");
const geneMap: { [key: string]: IGene } = genes.reduce((acc, current) => {
    acc[current.GeneID] = current;
    return acc;
}, {});

/**
 * A Selector is a function which checks whether the filters
 * from a query match a given gene or annotation which should
 * be included in a response.
 *
 * This is used to pick only those genes or annotations which
 * _all_ filters match the given set of filters (intersection),
 * or those for which at least one filter matches (union).
 */
type Selector = (_: (value: IFilter) => boolean) => boolean;

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
        const filters: IFilter[] = (maybeFilters || []).map(validateFilter);

        // Validates the strategy query param string, which must be exactly "union" or "intersection".
        const strategy: Strategy = validateStrategy(maybeStrategy);

        // Create a selector which matches the union or intersection of filters.
        const selector: Selector = ((strategy === "union") ? filters.some : filters.every).bind(filters);

        const annotatedFilters = filters.filter(({ annotation_status }) => annotation_status !== "UNANNOTATED");
        // const unannotatedFilters = filters.filter(({ annotation_status }) => annotation_status === "UNANNOTATED");

        const [annotatedGenes, annotations] = queryAnnotated(annotatedFilters, selector);
        return { annotatedGenes, annotations };
    }
}

/**
 * Given a set of filters and a selector, return a subset of genes and a
 * subset of annotations which match the criteria.
 *
 * @param filters Represent subsets of annotation and gene data to pick.
 * @param selector Whether to apply the filters as a union or intersection.
 */
const queryAnnotated = (filters: IFilter[], selector: Selector): [IGene[], IAnnotation[]] => {
    const queriedAnnotations =
        annotations.filter((item: IAnnotation) =>
            selector(({ aspect, annotation_status }: IFilter) =>
                item.Aspect === aspect &&
                item.AnnotationStatus === annotation_status
            ));

    const queriedGeneNames = Array.from(new Set(queriedAnnotations.map(annotation => annotation.UniqueGeneName)));
    const queriedGenes = queriedGeneNames.map(name => geneMap[name]);
    return [queriedGenes, queriedAnnotations];
};

/**
 * A Filter is used to match genes and annotations based on which Aspect
 * and Annotation Status they have.
 */
interface IFilter {
    aspect: Aspect;
    annotation_status: AnnotationStatus;
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
function validateFilter(maybeFilter: string): IFilter {
    const parts = maybeFilter.split(",");
    if (parts.length !== 2) {
        throw new Errors.BadRequestError("each filter must have exactly two parts, an Aspect and an Annotation Status, separated by a comma");
    }

    const [aspect, annotation_status] = parts;
    if (!validateAspect(aspect)) {
        throw new Errors.BadRequestError("the Aspect given in a filter must be exactly 'P', 'C', or 'F'");
    }
    if (!validateAnnotationStatus(annotation_status)) {
        throw new Errors.BadRequestError("the Annotation Status given in a filter must be exactly 'EXP', 'OTHER', 'UNKNOWN', or 'UNANNOTATED'");
    }

    return { aspect, annotation_status };
}

/**
 * Whether to match genes and annotations when:
 *   At least on filter matches that gene or annotation (union)
 *   All filters match that gene or annotation (intersection)
 */
type Strategy = "union" | "intersection";

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
