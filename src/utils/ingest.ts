import parse from "csv-parse/lib/sync";
import { readFileSync } from "fs";
import {evidenceCodes} from "../config";
import {resolve} from "path";

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
    AlternativeGeneName: string[];
    GeneProductType: string;
    Date: string;
    AssignedBy: string;
}

export interface IGene {
    GeneID: string;
    GeneProductType: string;
}

export const parseAnnotations = (input: string): IAnnotation[] => {
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

export const parseGenes = (input: string): IGene[] => {
    return parse(input, {
        columns: GENE_COLUMNS,
        skip_empty_lines: true,
        skip_lines_with_error: true,
        delimiter: "\t",
        relax: true,
        cast: true,
    });
};

export const readAnnotations = (filename: string) => {
    const buffer = readFileSync(filename).toString();
    const trimmed = buffer.slice(buffer.indexOf("\n"));
    return parseAnnotations(trimmed);
};

export const readGenes = (filename: string) => {
    const buffer = readFileSync(filename).toString();
    const trimmed = buffer.slice(buffer.indexOf("\n"));
    return parseGenes(trimmed);
};

export interface IngestConfig {
    genesFile: string;
    annotationsFile: string;
}

const defaultConfig: IngestConfig = {
    genesFile: process.env["GENES_FILE"] || resolve("src/assets/gene-types.txt"),
    annotationsFile: process.env["ANNOTATIONS_FILE"] || resolve("src/assets/gene_association.tair"),
};

export type GroupedAnnotations<T> = { [key in Aspect]: { [key in AnnotationStatus]: T } };
export const makeGroupedAnnotations = <T>(initial: () => T): GroupedAnnotations<T> => ({
    P: { EXP: initial(), OTHER: initial(), UNKNOWN: initial(), UNANNOTATED: initial() },
    F: { EXP: initial(), OTHER: initial(), UNKNOWN: initial(), UNANNOTATED: initial() },
    C: { EXP: initial(), OTHER: initial(), UNKNOWN: initial(), UNANNOTATED: initial() },
});

export type GeneMap = { [key: string]: IGene };

export interface IngestedData {
    geneMap: GeneMap;
    annotations: IAnnotation[];
    groupedAnnotations: GroupedAnnotations<Set<IGene>>;
}

export const readData = (userConfig: IngestConfig = defaultConfig): IngestedData => {
    const config: IngestConfig = { ...defaultConfig, ...userConfig };

    const genesArray = readGenes(config.genesFile);
    const geneMap: { [key: string]: IGene } = genesArray
        .reduce((acc, current) => {
            acc[current.GeneID] = current;
            return acc;
        }, {});

    // TODO fix parsing so that headers aren't included to start with
    delete geneMap["name"]; // Get rid of "name" header

    const annotations = readAnnotations(config.annotationsFile);
    const groupedAnnotations = annotations.reduce((acc, annotation) => {
        const aspect = annotation.Aspect;
        const annotationStatus = annotation.AnnotationStatus;
        const geneId = annotation.AlternativeGeneName.find(name => !!geneMap[name]);
        if (geneId) acc[aspect][annotationStatus].add(geneMap[geneId]);
        return acc;
    }, makeGroupedAnnotations<Set<IGene>>(() => new Set()));

    return { geneMap, annotations, groupedAnnotations };
};
