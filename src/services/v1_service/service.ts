import {Errors, GET, Path, QueryParam} from "typescript-rest";
import {AnnotationStatus, Aspect, IAnnotation, IGene, read_annotations, read_genes} from "../../utils/ingest";

const annotations = read_annotations(process.env["ANNOTATIONS_FILE"] || "../../assets/gene_association.tair");
const genes = read_genes(process.env["GENES_FILE"] || "../../assets/gene-types.txt");
const geneMap: { [key: string]: IGene } = genes.reduce((acc, current) => {
    acc[current.GeneID] = current;
    return acc;
}, {});

type Selector = (_: (value: IFilter) => boolean) => boolean;

@Path("/api/v1")
export class V1Service {

    @Path("/genes")
    @GET
    genes(
        @QueryParam("filter") maybeFilters: string[],
        @QueryParam("strategy") maybeStrategy: string = "union",
    ) {
        const filters: IFilter[] = (maybeFilters || []).map(validateFilter);
        const strategy: Strategy = validateStrategy(maybeStrategy);
        const selector: Selector = ((strategy === "union") ? filters.some : filters.every).bind(filters);

        const annotatedFilters = filters.filter(({ annotation_status }) => annotation_status !== "UNANNOTATED");
        // const unannotatedFilters = filters.filter(({ annotation_status }) => annotation_status === "UNANNOTATED");

        const [annotatedGenes, annotations] = queryAnnotated(annotatedFilters, selector);
        return [annotatedGenes, annotations];
    }
}

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

interface IFilter {
    aspect: Aspect;
    annotation_status: AnnotationStatus;
}

function validateAspect(maybeAspect: string): maybeAspect is Aspect {
    return maybeAspect === "P" || maybeAspect === "C" || maybeAspect === "P";
}

function validateAnnotationStatus(maybeStatus: string): maybeStatus is AnnotationStatus {
    return maybeStatus === "EXP" ||
        maybeStatus === "OTHER" ||
        maybeStatus === "UNKNOWN" ||
        maybeStatus === "UNANNOTATED";
}

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

type Strategy = "union" | "intersection";

function validateStrategy(maybeStrategy: string): Strategy {
    if (maybeStrategy !== "union" && maybeStrategy !== "intersection") {
        throw new Errors.BadRequestError("strategy must be either 'union' or 'intersection'");
    }
    return maybeStrategy;
}
