import parse from "csv-parse/lib/sync";
import { readFileSync } from "fs";

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

interface IAnnotation {
    DatabaseID: string;
    Invert: boolean;
    GOTerm: string;
    Reference: string;
    EvidenceCode: string;
    AdditionalEvidence: string;
    Aspect: "F" | "P" | "C";
    UniqueGeneName: string;
    AlternativeGeneName: string;
    GeneProductType: string;
    Date: string;
    AssignedBy: string;
}

interface IGene {
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
    });
};

export const parse_genes = (input: string): IGene[] => {
    return parse(input, {
        columns: GENE_COLUMNS,
        skip_empty_lines: true,
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
    return parse_genes(readFileSync(filename).toString());
};
