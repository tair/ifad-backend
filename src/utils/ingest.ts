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

export const parseAnnotationsData = (input: string): IAnnotation[] => {
  const evidenceCodeToAnnotationStatus = (evidenceCode: string): AnnotationStatus => {
    if (evidenceCodes.UNKNOWN.includes(evidenceCode)) return "UNKNOWN";
    if (evidenceCodes.KNOWN_EXPERIMENTAL.includes(evidenceCode)) return "KNOWN_EXP";
    return "KNOWN_OTHER";
  };

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

type Metadata = string;

type AnnotationData = {
  metadata: Metadata,
  annotations: IAnnotation[],
};

/**
 * Splits an Annotations file into the metadata header and the rest of the body.
 *
 * Given the following file contents, we would want the capture groups to look
 * like the following:
 *
 *         //// BEGIN tair.gaf
 *    (1   !gaf-version: 2.1
 *         !Some metadata here
 *         !More metadata
 *         !
 *         !Last updated Jan 1)
 *    (2   TAIR   locus:XXXXX   ENO1 ...
 *         TAIR   locus:XXXXX   ENO1 ...)
 *         //// END tair.gaf
 *
 * Regex Explanation:
 *
 * ^ ... $ match entire file
 *
 * (?:       BEGIN capture group for metadata
 * \s*       match any whitespace
 * (:?         BEGIN match a line starting with !
 * ![^\n]*     match ! and all characters until next newline
 * )?          END match a line starting with !. Optional for blank lines
 * \n)*      END capture group for metadata. Repeat as many times as possible
 *
 * (.*)      the rest of the file that does not match metadata lines becomes the body
 */
const metadataRegex = /^((?:\s*(?:![^\n]*)?\n)*)(.*$)/s;

/**
 * Given the text of an annotations file (e.g. tair.gaf), split the contents of the
 * file into "metadata" and "annotationsText".
 *
 * The "metadata" string includes all lines from the beginning of the file until the
 * first line which does not begin with "!". The "annotationsText" string includes
 * all of the remaining text from the original string.
 *
 * @param body The body of the original annotations input file.
 */
export const splitAnnotationsText = (body: string) => {
  const matches = body.match(metadataRegex);
  if (!matches) return null;
  if (matches.length < 3) return null;
  const metadata = matches[1];
  const annotationsText = matches[2];
  return { metadata, annotationsText };
};

/**
 * Given the text of the annotations data (without the metadata from the file),
 * parse the data and return it in a structured format.
 *
 * @param body The text of the raw annotations data.
 */
export const parseAnnotationsText = (body: string): AnnotationData | null => {
    const splitText = splitAnnotationsText(body);
    if (!splitText) return null;
    const { metadata, annotationsText } = splitText;
    const annotations = parseAnnotationsData(annotationsText);
    return { metadata, annotations };
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
    metadata: Metadata,
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
export const readData = (userConfig: IngestConfig = defaultConfig): IngestedData | null => {
    const config: IngestConfig = { ...defaultConfig, ...userConfig };
    console.log("Reading data using configs: " + JSON.stringify(config));

    const genesArray = readGenes(config.genesFile);
    const geneMap: GeneMap = genesArray
        .reduce((acc, current) => {
            acc[current.GeneID] = {
                gene: current,
                annotations: new Set<IAnnotation>(),
            };
            return acc;
        }, {});

    // TODO fix parsing so that headers aren't included to start with
    delete geneMap["name"]; // Get rid of "name" header

    const maybeAnnotationData = parseAnnotationsText(config.annotationsFile);
    if (!maybeAnnotationData) return null;
    const { metadata, annotations } = maybeAnnotationData;

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

    return { metadata, geneMap, annotations, groupedAnnotations };
};
