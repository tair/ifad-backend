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
export type AnnotationStatus = "KNOWN_EXP" | "KNOWN_OTHER" | "UNKNOWN" | "UNANNOTATED";

export interface IAnnotation {
    DatabaseID: string;
    Invert: boolean;
    GOTerm: string;
    Reference: string;
    EvidenceCode: string;
    AdditionalEvidence: string[];
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
    if (evidenceCodes.UNKNOWN.includes(evidenceCode)) {
        return "UNKNOWN";
    }
    if (evidenceCodes.KNOWN_EXPERIMENTAL.includes(evidenceCode)) {
        return "KNOWN_EXP";
    }
    return "KNOWN_OTHER";
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

/**
 * An IngestConfig contains the paths of files at which to read and parse data.
 */
export interface IngestConfig {
    genesFile: string;
    annotationsFile: string;
}

/**
 * The default IngestConfig reads filenames from Environment Variables or defaults
 * to the file paths given here.
 */
const defaultConfig: IngestConfig = {
    genesFile: process.env["GENES_FILE"] || resolve("src/assets/gene-types.txt"),
    annotationsFile: process.env["ANNOTATIONS_FILE"] || resolve("src/assets/gene_association.tair"),
};

/**
 * A GroupedAnnotations object contains data which is grouped by the Aspect and the
 * AnnotationStatus of a piece of data. This is generic over any type so that we can
 * build structures of data which may represent different goals. For example, a
 * GroupedAnnotation<Set<IGene>> can be used to organize sets of IGenes that belong to
 * the given Aspect and AnnotationStatus, whereas a GroupedAnnotation<number> can be
 * used to hold the count of how many genes belong to a given Aspect and AnnotationStatus.
 */
export type GroupedAnnotations<T> = {
  [key in Aspect]: {
    all: T,
    unknown: T,
    known: {
      all: T,
      exp: T,
      other: T,
    },
  }
};

/**
 * This function creates a GroupedAnnotations object which is initialized such that every
 * key contains a specific initial value. This can be used to create a GroupedAnnotations
 * which holds empty Sets or which has a 0-count.
 *
 * @param initial A function which produces an initial value to put at each key.
 */
export const makeGroupedAnnotations = <T>(initial: () => T): GroupedAnnotations<T> => ({
  P: { all: initial(), unknown: initial(), known: { all: initial(), exp: initial(), other: initial() } },
  F: { all: initial(), unknown: initial(), known: { all: initial(), exp: initial(), other: initial() } },
  C: { all: initial(), unknown: initial(), known: { all: initial(), exp: initial(), other: initial() } },
});

/**
 * The GeneMap type is an object which is keyed by the names of IGenes and
 * has values of the IGene which the key represents.
 */
export type GeneMap = {
  [key: string]: {
    gene: IGene,
    annotations: Set<IAnnotation>,
  }
};

/**
 * IngestedData is the data format which contains all parsed and cached data
 * which was read from all of the data sources during the ingestion step.
 */
export interface IngestedData {
    geneMap: GeneMap;
    annotations: IAnnotation[];
    groupedAnnotations: GroupedAnnotations<Set<IGene>>;
}

/**
 * The easy top-level entrypoint for reading data needed for backend queries.
 *
 * This function takes an IngestConfig which describes the location for reading
 * files with the data we're interested in. A default configuration is provided
 * which reads these file paths from environment variables.
 *
 * This function returns an `IngestedData` object, which has the parsed data
 * inside of it. The same data may be included in the IngestedData object multiple
 * times if it is transformed or cached in various formats. For example, we have
 * an array of all annotations, or a map in which the annotations are grouped by
 * their aspect and annotation status.
 *
 * @param userConfig An optional configuration for specifying file locations.
 * @return An IngestedData object with parsed and structured information.
 */
export const readData = (userConfig: IngestConfig = defaultConfig): IngestedData => {
    const config: IngestConfig = { ...defaultConfig, ...userConfig };
    console.log("Reading data using configs: " + JSON.stringify(config));

    const genesArray = readGenes(config.genesFile);
    const geneMap: GeneMap = genesArray
        .reduce((acc, current) => {
            acc[current.GeneID] = current;
            return acc;
        }, {});

    // TODO fix parsing so that headers aren't included to start with
    delete geneMap["name"]; // Get rid of "name" header

    const annotations = readAnnotations(config.annotationsFile);

    // Group all annotations based on aspect, categorizing KNOWN_EXP but not KNOWN_OTHER
    const tmpGroupedAnnotations: GroupedAnnotations<Set<IGene>> = annotations
        .reduce((acc, annotation) => {
            const aspect = annotation.Aspect;
            const annotationStatus = annotation.AnnotationStatus;
            const geneId = annotation.AlternativeGeneName.find(name => !!geneMap[name]);
            if (!geneId) return acc;

            const { gene, annotations } = geneMap[geneId];

            // Add the current annotation to the list for the gene it belongs to.
            annotations.add(annotation);

            // Add gene to the proper index in GroupedAnnotations
            acc[aspect].all.add(gene);
            if (annotationStatus === "UNKNOWN") {
                acc[aspect].unknown.add(gene);
            } else {
                acc[aspect].known.all.add(gene);
                if (annotationStatus === "KNOWN_EXP") {
                    acc[aspect].known.exp.add(gene);
                }
            }
            return acc;
        }, makeGroupedAnnotations<Set<IGene>>(() => new Set()));

    // Calculate KNOWN_OTHER by finding all genes that are in "known" but not KNOWN_EXP
    const groupedAnnotations = Object.entries(tmpGroupedAnnotations)
        .reduce((acc, [aspect, index]) => {
              index.known.other = new Set([...index.known.all].filter(gene => !index.known.exp.has(gene)));
              acc[aspect] = index;
              return acc;
        }, makeGroupedAnnotations<Set<IGene>>(() => new Set()));

    return { geneMap, annotations, groupedAnnotations };
};
