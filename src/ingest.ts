import parse from "csv-parse/lib/sync";
import {evidenceCodes} from "./config";
import {Map, OrderedSet, Record, Set} from "immutable";

/**
 * Indicate which columns in the GAF file will be mapped to what fields on the Annotation object.
 * Null indicates that we don't care about the column, but it's needed to select the right column number.
 */
export const ANNOTATION_COLUMNS = [
  "Db",
  "DatabaseID",
  "DbObjectSymbol",
  "Invert",
  "GOTerm",
  "Reference",
  "EvidenceCode",
  "AdditionalEvidence",
  "Aspect",
  "UniqueGeneName",
  "AlternativeGeneName",
  "GeneProductType",
  "Taxon",
  "Date",
  "AssignedBy",
  "AnnotationExtension",
  "GeneProductFormID",
];

/**
 * Similar to ANNOTATION_COLUMNS, this indicates which columns in the gene file map to which object attributes.
 */
export const GENE_COLUMNS = [
  "GeneID",
  "GeneProductType"
];

/**
 * Each Annotation may belong to one of the following three Aspects:
 *
 *   * F: Molecular Function
 *   * P: Biological Process
 *   * C: Cellular Component
 */
export type Aspect = "F" | "P" | "C";

/**
 * Each Annotation has a status that represents the classification of the
 * research associated with a specific Gene:
 *
 *   * KNOWN_EXP:   The research is backed by experimental data.
 *   * KNOWN_OTHER: The research is backed by predictive data. Note that the same
 *                  Gene may also be annotated with experimental data, in which case
 *                  the Gene is classified as KNOWN_EXP for that aspect.
 *   * UNKNOWN:     For the given Gene, a search for research has been performed
 *                  and no research has been found.
 *   * UNANNOTATED: The given Gene has no annotations, either KNOWN or UNKNOWN.
 */
export type AnnotationStatus = "KNOWN_EXP" | "KNOWN_OTHER" | "UNKNOWN" | "UNANNOTATED";

/**
 * The structured form of the data read from an annotations file (e.g. tair.gaf).
 */
type AnnotationProps = {
  Db: string,
  DatabaseID: string,
  DbObjectSymbol: string,
  Invert: boolean,
  GOTerm: string,
  Reference: string,
  EvidenceCode: string,
  AdditionalEvidence: OrderedSet<string>,
  Aspect: Aspect,
  AnnotationStatus: AnnotationStatus,
  GeneNames: Set<string>,
  UniqueGeneName: string,
  AlternativeGeneName: OrderedSet<string>,
  GeneProductType: string,
  Taxon: string,
  Date: string,
  AssignedBy: string,
  AnnotationExtension: string,
  GeneProductFormID: string,
};

export type Annotation = Record<AnnotationProps>;
export const Annotation: Record.Factory<AnnotationProps> = Record({
  Db: "",
  DatabaseID: "",
  DbObjectSymbol: "",
  Invert: false,
  GOTerm: "",
  Reference: "",
  EvidenceCode: "",
  AdditionalEvidence: OrderedSet(),
  Aspect: "P" as Aspect,
  AnnotationStatus: "KNOWN_EXP" as AnnotationStatus,
  GeneNames: Set(),
  UniqueGeneName: "",
  AlternativeGeneName: OrderedSet(),
  GeneProductType: "",
  Taxon: "",
  Date: "",
  AssignedBy: "",
  AnnotationExtension: "",
  GeneProductFormID: "",
} as AnnotationProps, "Annotation");

/**
 * Given the raw text of the annotations section of an annotations file,
 * parse the annotations text and return the structured annotations data.
 *
 * @param input The raw annotations text to be parsed.
 */
export const parseAnnotationsData = (input: string): OrderedSet<Annotation> | null => {
  const evidenceCodeToAnnotationStatus = (evidenceCode: string): AnnotationStatus => {
    if (evidenceCodes.UNKNOWN.includes(evidenceCode)) return "UNKNOWN";
    if (evidenceCodes.KNOWN_EXPERIMENTAL.includes(evidenceCode)) return "KNOWN_EXP";
    return "KNOWN_OTHER";
  };

  const annotations: AnnotationProps[] = parse(input, {
    columns: ANNOTATION_COLUMNS,
    skip_empty_lines: true,
    delimiter: "\t",
    relax: true,
    cast: (value, context) => {
      if (context.column === "Invert") {
        return value === "NOT";
      } else if (context.column === "AlternativeGeneName" || context.column === "AdditionalEvidence") {
        return OrderedSet(value.split("|"));
      } else {
        return value;
      }
    },
  })
    .map(item => ({
      ...item,
      GeneNames: Set([item.UniqueGeneName, ...item.AlternativeGeneName]),
      AnnotationStatus: evidenceCodeToAnnotationStatus(item.EvidenceCode)
    }));

  return OrderedSet(annotations.map(annotationProps => Annotation(annotationProps)));
};


/**
 * The structured form of the data read from a genes file (e.g. gene-types.txt).
 */
type GeneProps = {
  GeneID: string,
  GeneProductType: string,
};

export type Gene = Record<GeneProps>;
export const Gene: Record.Factory<GeneProps> = Record({
  GeneID: "",
  GeneProductType: "",
} as GeneProps, "Gene");

/**
 * Given the raw text of the data in the genes file (excluding headers),
 * parse the genes text and return the structured genes data.
 *
 * @param input The raw genes text to be parsed.
 */
export const parseGenesData = (input: string): OrderedSet<Gene> | null => {
  const genes: GeneProps[] = parse(input, {
    columns: GENE_COLUMNS,
    skip_empty_lines: true,
    skip_lines_with_error: true,
    delimiter: "\t",
    relax: true,
    cast: true,
  });

  return OrderedSet(genes.map(geneProp => Gene(geneProp)));
};


type HeaderAndBody = {
  headerText: string,
  bodyText: string,
};

/**
 * Slices the first line from a body of text.
 *
 * Returns an object with the sliced header and the trimmed body.
 *
 * If a "headerCheck" string is provided, then this function will only
 * return a sliced header-and-body if the headerCheck string was contained
 * in the header line. This can be used if you're uncertain whether a body
 * of text will actually contain a header, but if you know a string that
 * would certainly appear in the header if it exists (such as a header
 * column name).
 *
 * @param body The original body of text to slice a header from.
 * @param headerCheck A string to check that it appears in the header.
 */
const sliceHeader = (body: string, headerCheck: string = ""): HeaderAndBody | null => {
  const firstLine = body.substring(0, body.indexOf("\n"));
  const hasHeaders = firstLine.includes(headerCheck);
  const trimmedBody = body.substring(body.indexOf("\n"));

  // If the given body did not have a header (according to the headerCheck),
  // then return null.
  if (!hasHeaders) return null;

  return {
    headerText: firstLine,
    bodyText: trimmedBody,
  };
};


/**
 * Describes the two regions of a file with metadata. A file
 * is first split into these regions, then each region is further processed.
 *
 * See AnnotationData or GeneData to see richer structure of
 * the data downstream.
 */
type MetadataAndBody = {
  metadataText: string,
  bodyText: string,
};

/**
 * Splits a file into a metadata header and the rest of the body.
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
 * Given the text of a file (e.g. tair.gaf or gene-types.txt), split the contents of the
 * file into "metadata" and "bodyText".
 *
 * The "metadata" string includes all lines from the beginning of the file until the
 * first line which does not begin with "!". The "bodyText" string includes
 * all of the remaining text from the original string.
 *
 * @param body The body of the original input file.
 */
export const splitMetadataText = (body: string): MetadataAndBody | null => {
  const matches = body.match(metadataRegex);
  if (!matches) return null;
  if (matches.length < 3) return null;
  const metadataText = matches[1];
  const bodyText = matches[2];
  return {metadataText, bodyText};
};


/**
 * The type of structured annotation metadata. For now, we don't do any analysis
 * on the annotation metadata, so we simply preserve the metadata string.
 */
type AnnotationMetadata = string;

/**
 * The type of fully-parsed, structured annotations data.
 */
type AnnotationData = {
  metadata: AnnotationMetadata,
  header: string,
  records: OrderedSet<Annotation>,
};

/**
 * Given the text of the annotations data (without the metadata from the file),
 * parse the data and return it in a structured format.
 *
 * @param body The text of the raw annotations data.
 */
export const parseAnnotationsText = (body: string): AnnotationData | null => {
  const splitText = splitMetadataText(body);
  if (!splitText) return null;
  const {metadataText, bodyText} = splitText;

  // Check whether annotations body has headers
  const slicedText = sliceHeader(bodyText, "DB Object ID");
  let header = "";
  let text = bodyText;
  if (slicedText) {
    header = slicedText.headerText;
    text = slicedText.bodyText;
  }

  const annotations = parseAnnotationsData(text);
  if (!annotations) return null;
  return {
    metadata: metadataText,
    records: annotations,
    header,
  };
};


/**
 * The type of structured gene metadata. For now, we don't do any analysis
 * on the gene metadata, so we simply preserve the metadata string.
 */
type GeneMetadata = string;

/**
 * The type of fully-parsed, structured genes data.
 */
type GeneData = {
  metadata: GeneMetadata,
  header: string,
  records: OrderedSet<Gene>,
};

/**
 * Given the text of the genes data (without the metadata from the file),
 * parse the data and return it in a structured format.
 *
 * @param body The text of the raw genes data.
 */
export const parseGenesText = (body: string): GeneData | null => {
  const splitText = splitMetadataText(body);
  if (!splitText) return null;
  const {metadataText, bodyText} = splitText;

  const slicedText = sliceHeader(bodyText, "gene_model_type");
  let header = "";
  let text = bodyText;
  if (slicedText) {
    header = slicedText.headerText;
    text = slicedText.bodyText;
  }

  const genes = parseGenesData(text);
  if (!genes) return null;
  return {
    metadata: metadataText,
    records: genes,
    header,
  };
};


type GeneIndexElementProps = {
  gene: Gene,
  annotations: Set<Annotation>,
}

export type GeneIndexElement = Record<GeneIndexElementProps>;
export const GeneIndexElement: Record.Factory<GeneIndexElementProps> = Record({
  gene: Gene(),
  annotations: Set(),
} as GeneIndexElementProps, "GeneIndexElement");

/**
 * The GeneIndex type is an object which is keyed by the names of Genes and
 * has values of the Gene which the key represents.
 */
export type GeneIndex = Map<string, GeneIndexElement>;
export const GeneIndex = Map;

/**
 * Given the parsed Gene records, index the genes by creating an object whose
 * keys are the Gene names and whose values are the Genes themselves.
 *
 * @param geneData The parsed Gene records.
 */
export const indexGenes = (
  geneData: Set<Gene>,
): GeneIndex => {

  return geneData.toKeyedSeq()
    .mapKeys(gene => gene.get("GeneID"))
    .map(gene => GeneIndexElement({ gene }))
    .toMap();
};


export type AnnotationIndexElementProps<T> = {
  all: T,
  unknown: T,
  knownAll: T,
  knownExp: T,
  knownOther: T,
  unannotated: T,
};

export type AnnotationIndexElement<T=Set<Gene>> = Record<AnnotationIndexElementProps<T>>;
export function AnnotationIndexElement<T=Set<Gene>>(initial: () => T): Record.Factory<AnnotationIndexElementProps<T>> {
  return Record({
    all: initial(),
    unknown: initial(),
    knownAll: initial(),
    knownExp: initial(),
    knownOther: initial(),
    unannotated: initial(),
  } as AnnotationIndexElementProps<T>, "AnnotationIndexElement");
}

/**
 * An AnnotationIndex object contains data which is grouped by the Aspect and the
 * AnnotationStatus of a piece of data. This is generic over any type so that we can
 * build structures of data which may represent different goals. For example, an
 * AnnotationIndex<Set<IGene>> can be used to organize sets of Genes that belong to
 * the given Aspect and AnnotationStatus, whereas an AnnotationIndex<number> can be
 * used to hold the count of how many genes belong to a given Aspect and AnnotationStatus.
 */
export type AnnotationIndexProps<T> = {
  [key in Aspect]: AnnotationIndexElement<T>;
};

export type AnnotationIndex<T=Set<Gene>> = Record<AnnotationIndexProps<T>>;
export function AnnotationIndex<T=Set<Gene>>(initial: () => T): Record.Factory<AnnotationIndexProps<T>> {
  return Record({
    C: AnnotationIndexElement(initial)(),
    F: AnnotationIndexElement(initial)(),
    P: AnnotationIndexElement(initial)(),
  } as AnnotationIndexProps<T>, "AnnotationIndex");
}

type FinalIndexes = {
  geneIndex: GeneIndex,
  annotationIndex: AnnotationIndex,
};

/**
 * Given a GeneIndex and the parsed Annotation data, create an index of those genes
 * that groups them based on which Aspect and Annotation Status they belong to.
 *
 * As this function iterates through Annotations, it will find which Gene each
 * Annotation belongs to and add that annotation to the "annotations" list in the
 * GeneIndex for that gene.
 *
 * @param partialGeneIndex The index of gene names to Gene objects.
 * @param annotationData The parsed annotation data.
 */
export const indexAnnotations = (
  partialGeneIndex: GeneIndex,
  annotationData: Set<Annotation>,
): FinalIndexes => {
  let geneIndex: GeneIndex = partialGeneIndex;

  // // Index all annotations based on aspect, categorizing KNOWN_EXP but not KNOWN_OTHER
  const expAndUnknownIndex: AnnotationIndex = annotationData
    .reduce((acc: AnnotationIndex, anno: Annotation) => {
    const aspect = anno.get("Aspect");
    const status = anno.get("AnnotationStatus");
    const geneId = anno.get("GeneNames").find(name => partialGeneIndex.has(name));
    if (!geneId) return acc;

    const maybeGene = partialGeneIndex.get(geneId);
    if (!maybeGene) return acc;
    const gene: Gene = maybeGene.get("gene");

    // Add this annotation to the GeneIndex under it's gene
    geneIndex = geneIndex.updateIn([geneId, "annotations"], annos => annos.add(anno));

    let ret = acc;
    ret = ret.updateIn([aspect, "all"], all => all.add(gene));
    if (status === "UNKNOWN") {
      ret = ret.updateIn([aspect, "unknown"], unknown => unknown.add(gene));
    } else {
      ret = ret.updateIn([aspect, "knownAll"], knownAll => knownAll.add(gene));
      if (status === "KNOWN_EXP") {
        ret = ret.updateIn([aspect, "knownExp"], knownExp => knownExp.add(gene));
      }
    }

    return ret;
  }, AnnotationIndex(() => Set())());

  // Calculate known.other by finding all genes that are in KNOWN_OTHER but not KNOWN_EXP
  const expUnknownAndOtherIndex: AnnotationIndex = expAndUnknownIndex.toSeq()
    .reduce((acc: AnnotationIndex, element: AnnotationIndexElement, aspect: Aspect) => {
      const knownAll: Set<Gene> = element.getIn(["knownAll"]);
      const knownOther = knownAll.filter(gene => {
        const knownExp: Set<Gene> = element.getIn(["knownExp"]);
        return !knownExp.has(gene);
      });
      return acc
        .set(aspect, element)
        .setIn([aspect, "knownOther"], knownOther);
    }, AnnotationIndex(() => Set())());

  // For each Gene (G), and for each Aspect (A):
  // If gene G does not appear in the annotations for aspect A, then
  // add gene G to the "Unannotated" set for aspect A.
  let annotationIndex = expUnknownAndOtherIndex;
  const aspects: Aspect[] = ["P", "C", "F"];
  geneIndex.valueSeq().forEach(geneElement => {
    const gene: Gene = geneElement.get("gene");
    for (const aspect of aspects) {
      const aspectIndex: Set<Gene> = annotationIndex.getIn([aspect, "all"]);
      const inAspect = aspectIndex.has(gene);
      if (!inAspect) {
        annotationIndex = annotationIndex.updateIn([aspect, "unannotated"], genes => genes.add(gene));
      }
    }
  });

  return {
    geneIndex,
    annotationIndex,
  };
};

/**
 * Contains all of the required raw input to the top-level ingestData function.
 */
export type UnstructuredText = {
  genesText: string,
  annotationsText: string,
};

/**
 * Contains all of the structured-unindexed gene data as well as all
 * of the structured-indexed gene data.
 */
export type StructuredGenes = {
  metadata: GeneMetadata,
  header: string,
  records: OrderedSet<Gene>,
  index: GeneIndex,
};

/**
 * Contains all of the structured-unindexed annotation data as well as all
 * of the structured-indexed annotation data.
 */
export type StructuredAnnotations = {
  metadata: AnnotationMetadata,
  header: string,
  records: OrderedSet<Annotation>,
  index: AnnotationIndex,
};

/**
 * Contains all of the parsed and indexed data which was extracted from the
 * UnstructuredText given to ingestData.
 */
export type StructuredData = {
  genes: StructuredGenes,
  annotations: StructuredAnnotations,
  raw: UnstructuredText,
};

/**
 * Given the unstructured text input for genes and annotations data files,
 * parse and index the data, returning a structured version of the data.
 *
 * @param raw The raw contents of the genes and annotations files.
 */
export const ingestData = (raw: UnstructuredText): StructuredData | null => {
  // Parse Gene data
  const geneData = parseGenesText(raw.genesText);
  if (!geneData) return null;

  // Parse Annotation data
  const annotationData = parseAnnotationsText(raw.annotationsText);
  if (!annotationData) return null;

  // Index gene data
  const partialGeneIndex = indexGenes(geneData.records);

  // Index annotation data and get finalized geneIndex
  const { geneIndex, annotationIndex } = indexAnnotations(partialGeneIndex, annotationData.records);

  const genes: StructuredGenes = {
    metadata: geneData.metadata,
    header: geneData.header,
    records: geneData.records,
    index: geneIndex,
  };

  // Store un-indexed and indexed Annotation data together
  const annotations: StructuredAnnotations = {
    metadata: annotationData.metadata,
    header: annotationData.header,
    records: annotationData.records,
    index: annotationIndex,
  };

  // Return all structured data
  return {genes, annotations, raw};
};
