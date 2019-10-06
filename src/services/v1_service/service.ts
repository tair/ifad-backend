import {Path, GET, QueryParam, Errors} from "typescript-rest";
import {read_annotations} from "../../utils/ingest";

const annotations = read_annotations("/path/to/gene_association.csv");

@Path("/api/v1")
export class V1Service {

    @Path("/genes")
    @GET
    genes(@QueryParam("filter") filter: string[]) {
        const filter_parts = filter.map(item => {
            const parts = item.split(",");
            return {
                aspect: parts[0],
                annotation_status: parts[1],
            }
        });

        const data = annotations.filter(item => {
            return filter_parts.some(({ aspect }) => {
                console.log("Aspect is ", aspect);
                return item.Aspect === aspect;
            });
        });

        return data;
    }
}

const evidenceCodeToAnnotationStatus = (evidenceCode: string): string => {
    const ANNOTATION_STATUSES = {
        EXP: ["ONE"],
        OTHER: ["ONE"],
        UNKNOWN: ["ONE"],
        UNANNOTATED: ["ONE"],
    };

    const value = Object.entries(ANNOTATION_STATUSES)
        .find(([_, value]) => evidenceCode in value);

    if (value) {
        return value[0];
    } else {
        throw new Errors.BadRequestError("Evidence code must belong to an annotation status")
    }
};
