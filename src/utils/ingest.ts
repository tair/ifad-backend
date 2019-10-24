import parse from "csv-parse/lib/sync";
import { readFileSync } from "fs";
import {evidenceCodes} from "../config";
import {Errors} from "typescript-rest";

const ANNOTATION_COLUMNS = [
    null,
    "DatabaseID",
    null,
    "Invert",
    "GOTerm",
    "Reference",
    "EvidenceCode",
    "AdditionalEvidence",
    "Aspect",
    "UniqueGeneName",
    "AlternativeGeneName",
    "GeneProductType",
    null,
    "Date",
    "AssignedBy",
    null,
    null,
];

const GENE_COLUMNS = [
    "GeneID",
    "GeneProductType",
];

export type Aspect = "F" | "P" | "C";
export type AnnotationStatus = "EXP" | "OTHER" | "UNKNOWN" | "UNANNOTATED";

export interface IAnnotation {
    DatabaseID: string;
    Invert: boolean;
    GOTerm: string;
    Reference: string;
    EvidenceCode: string;
    AdditionalEvidence: string;
    Aspect: Aspect;
    AnnotationStatus: AnnotationStatus;
    UniqueGeneName: string;
    AlternativeGeneName: string;
    GeneProductType: string;
    Date: string;
    AssignedBy: string;
}

export interface IGene {
    GeneID: string;
    GeneProductType: string;
}

export const parse_annotations = (input: string): IAnnotation[] => {
    return parse(input, {
        columns: ANNOTATION_COLUMNS,
        skip_empty_lines: true,
        delimiter: "\t",
        relax: true,
        cast: (value, context) => {
            if (context.column === "Invert") {
                return value === "NOT";
            } else if (context.column === "AlternativeGeneName" || context.column === "AdditionalEvidence") {
                return value.split("|");
            } else if (context.column === "Date") {
                return new Date(Date.parse(`${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}`));
            } else {
                return value;
            }
        },
    })
    .map(item => ({
        ...item,
        AnnotationStatus: evidenceCodeToAnnotationStatus(item.EvidenceCode)
    }));
};

const evidenceCodeToAnnotationStatus = (evidenceCode: string): AnnotationStatus => {
    if (evidenceCodes.KNOWN_EXPERIMENTAL.includes(evidenceCode)) {
        return "EXP";
    } else if (evidenceCodes.UNKNOWN.includes(evidenceCode)) {
        return "UNKNOWN";
    } else {
        return "OTHER";
    }
};

export const parse_genes = (input: string): IGene[] => {
    return parse(input, {
        columns: GENE_COLUMNS,
        skip_empty_lines: true,
        skip_lines_with_error: true,
        delimiter: "\t",
        relax: true,
        cast: true,
    });
};

export const read_annotations = (filename: string) => {
    const buffer = readFileSync(filename).toString();
    const trimmed = buffer.slice(buffer.indexOf("\n"));
    return parse_annotations(trimmed);
};

export const read_genes = (filename: string) => {
    const buffer = readFileSync(filename).toString();
    const trimmed = buffer.slice(buffer.indexOf("\n"));
    return parse_genes(trimmed);
};
