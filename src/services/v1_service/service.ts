import {Errors, GET, Path, QueryParam} from "typescript-rest";
import {AnnotationStatus, Aspect, IAnnotation, IGene, read_annotations, read_genes} from "../../utils/ingest";

const annotations = read_annotations(process.env["ANNOTATIONS_FILE"] || "src/assets/gene_association.csv");
const genes = read_genes(process.env["GENES_FILE"] || "src/assets/gene-types.txt");
const geneMap: { [key: string]: IGene } = genes
    // .filter(gene => gene.GeneProductType !== "pseudogene")
    .filter(gene => gene.GeneProductType === "protein_coding")
    .reduce((acc, current) => {
        acc[current.GeneID] = current;
        return acc;
    }, {});
delete geneMap["name"];

/**
 * A Selector is a function which checks whether the filters
 * from a query match a given gene or annotation which should
 * be included in a response.
 *
 * This is used to pick only those genes or annotations which
 * _all_ filters match the given set of filters (intersection),
 * or those for which at least one filter matches (union).
 */
type Selector = (_: (filter: IFilter) => boolean) => boolean;

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
        const allFilters: IFilter[] = (maybeFilters || []).map(validateFilter);

        // Validates the strategy query param string, which must be exactly "union" or "intersection".
        const strategy: Strategy = validateStrategy(maybeStrategy);

        // Create a selector which matches the union or intersection of filters.
        const getSelector = (filters: IFilter[]) => (pred: (IFilter) => boolean) =>
            (strategy === "union") ? filters.some(pred) : filters.every(pred);

        const annotatedFilters = allFilters.filter(({ annotation_status }) => annotation_status !== "UNANNOTATED");
        const unannotatedFilters = allFilters.filter(({ annotation_status }) => annotation_status === "UNANNOTATED");

        let [annotatedGenes, annotations]: [IGene[], IAnnotation[]] = [[], []];
        if (annotatedFilters.length > 0) {
            [annotatedGenes, annotations] = queryAnnotated(getSelector(annotatedFilters))
        }

        let unannotatedGenes: IGene[] = [];
        if (unannotatedFilters.length > 0) {
            unannotatedGenes = queryUnannotated(getSelector(unannotatedFilters));
        }

        return { annotatedGenes, annotations, unannotatedGenes };
    }

    @Path("/test")
    @GET
    async test_func(){
        return geneMap
    }


    @Path("/wgs_segments")
    @GET
    get_wgs(){
        let final = {
            P: {
                EXP: new Set(),
                OTHER: new Set(),
                UNKNOWN: new Set(),
                UNANNOTATED: new Set(),
            },
            F: {
                EXP: new Set(),
                OTHER: new Set(),
                UNKNOWN: new Set(),
                UNANNOTATED: new Set(),
            },
            C: {
                EXP: new Set(),
                OTHER: new Set(),
                UNKNOWN: new Set(),
                UNANNOTATED: new Set(),
            },
        };

        for (let annotation of annotations) {
            let geneId;
            if (!!(geneId = getGeneId(annotation))) {
                final[annotation.Aspect][annotation.AnnotationStatus].add(geneId);
            }
        }

        const geneCount = Object.keys(geneMap).length;
        let aspects = {};
        Object.entries(final).map(([aspect, statuses]) => {
            let annotation_statuses = {};
            let count_in_aspect = 0;
            Object.entries(statuses).map(([status, genes]) => {
                count_in_aspect += genes.size;
                annotation_statuses[status] = genes.size;
            });
            annotation_statuses["UNANNOTATED"] = geneCount - count_in_aspect;
            annotation_statuses["TOTAL"] = geneCount;
            aspects[aspect] = annotation_statuses;
        });

        return aspects;
    }
}

/**
 * Given a selector over Annotated genes, return a subset of genes and a
 * subset of annotations which match the criteria.
 *
 * @param selector A function which applies the filters as a union or intersection.
 */
const queryAnnotated = (selector: Selector): [IGene[], IAnnotation[]] => {
    const queriedAnnotations =
        annotations.filter((item: IAnnotation) =>
            selector(({ aspect, annotation_status }: IFilter) =>
                item.Aspect === aspect &&
                item.AnnotationStatus === annotation_status
            ));

    const queriedGeneNames = Array.from(
        new Set(queriedAnnotations
            .map(annotation => ([annotation.UniqueGeneName, ...annotation.AlternativeGeneName]))
            .reduce((acc, current) => {
                acc.push(...current);
                return acc;
            }, []))
    );

    const queriedGenes = queriedGeneNames
        .map(name => geneMap[name])
        .filter(gene => !!gene);
    return [queriedGenes, queriedAnnotations];
};

/**
 * Given a selector over Unannotated genes, return a subset of genes which
 * match the filter criteria of the selector.
 *
 * @param selector A function which applies the filters as a union or intersection.
 */
const queryUnannotated = (selector: Selector): IGene[] => {

    const queriedAnnotations =
        annotations.filter((item: IAnnotation) =>
            selector(({ aspect }: IFilter) => item.Aspect === aspect ));

    const annotatedGeneNames = new Set(queriedAnnotations
        .map(annotation => annotation.AlternativeGeneName)
        .reduce((acc, current) => {
            acc.push(...current);
            return acc;
    }, []));

    return genes.filter(gene => !annotatedGeneNames.has(gene.GeneID));
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

/**
 * Helper function to parse out gene_ID
 * @param {IAnnotation} annotation
 * @param {IAnnotation} annotation
 * @returns {string}
 */
function getGeneId(annotation: IAnnotation): string | undefined {
    // return annotation.AlternativeGeneName.find(alternateGeneName => Object.keys(geneMap).includes(alternateGeneName));
    return annotation.AlternativeGeneName.find(alternateGeneName => !!geneMap[alternateGeneName]);
    // let geneID;
    // for(let i of annotation.AlternativeGeneName){
    //     if (i in geneMap){
    //         geneID = i
    //     }
    //     else{
    //         geneID = null
    //     }
    // }
    // return geneID;
}
