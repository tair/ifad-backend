import {Path, GET, QueryParam, Errors} from "typescript-rest";
import {read_annotations, read_genes} from "../../utils/ingest";
import {evidenceCodes} from "../../config";

const annotations = read_annotations("/path/to/gene_association.csv");
const genes = read_genes("/path/to/gene-types.txt");
//const genes = read_genes("/Users/ChikeUdenze/Documents/ifad-backend/src/gene-types.txt");

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
        return [data, genes];
    }
}

const evidenceCodeToAnnotationStatus = (evidenceCode: string): string => {
    const value = Object.entries(evidenceCodes)
        .find(([_, value]) => evidenceCode in value);

    if (value) {
        return value[0];
    } else {
        throw new Errors.BadRequestError("Evidence code must belong to an annotation status")
    }
};
