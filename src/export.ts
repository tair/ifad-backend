import json2csv, { parse as serialize, Transform } from "json2csv";
import { Annotation, ANNOTATION_COLUMNS, GENE_COLUMNS, StructuredData } from './ingest';
import { Readable, PassThrough } from "stream"
import combine from "combine-streams";
import moment from "moment";

const column_modifiers: Map<string | null, json2csv.FieldInfo<Annotation>> = new Map([
    [null, {
        value: () => ''
    }],
    ["Invert", {
        value: (row: Annotation) => row.get("Invert") ? "NOT" : ''
    }],
    ["AlternativeGeneName", {
        value: (row: Annotation) => row.get("AlternativeGeneName").join("|")
    }],
    ["AdditionalEvidence", {
        value: (row: Annotation) => row.get("AdditionalEvidence").join("|")
    }],
])

export const metadataSerializer = (metadata: { [key: string]: string }) => Object.entries(metadata)
    .map((([key, value]) => `!${key}: ${value}`))
    .reduce((accum, curr) => `${accum}\n${curr}`, "");

const additionalHeaders = (metadata: {[key: string]: string}) => `!=================================
!
!The data represents a subset of data filtered according to the following parameters on ${moment().format("MM-DD-YYYY")}.${metadataSerializer(metadata)}`

export function buildAnnotationMetadata(data: StructuredData, additionalMetadata: { [key: string]: string } = {}){
    const header = Object.keys(additionalMetadata).length > 0 ?
        `${data.annotations.metadata.trim()}\n${additionalHeaders(additionalMetadata).trim()}` :
        data.annotations.metadata
    return header;
}

export function annotationsToGAF(data: StructuredData, additionalMetadata: { [key: string]: string } = {}) {
    const transformer = new Transform({
        fields: ANNOTATION_COLUMNS.map(col => column_modifiers.get(col) || col as string),
        header: false,
        defaultValue: "",
        excelStrings: false,
        quote: '',
        delimiter: '\t',
    }, { objectMode: true })
    // const serialized = serialize(data.annotations.records, );
    //@ts-ignore
    transformer._implicitHeader = () => {};

    const header = buildAnnotationMetadata(data, additionalMetadata);
    const csv_header = data.annotations.header;

    const input = new Readable({ objectMode: true });
    input._read = () => { };

    for (const record of data.annotations.records) {
        input.push(record)
    }
    input.push(null);

    input.pipe(transformer)

    return combine()
        .append(header+"\n")
        .append(csv_header+"\n")
        .append(transformer)
        .append(null)
}

export function buildGenesMetadata(data: StructuredData, additionalMetadata: { [key: string]: string } = {}){
    const header = Object.keys(additionalMetadata).length > 0 ?
        `${data.genes.metadata.trim()}\n${additionalHeaders(additionalMetadata).trim()}` :
        data.genes.metadata

    return header;
}

export function genesToCSV(data: StructuredData, additionalMetadata: { [key: string]: string } = {}) {
    const inputs = data.genes.index.map(geneElement => geneElement.get("gene"));

    const transformer = new Transform({
        fields: GENE_COLUMNS,
        header: false,
        defaultValue: "",
        excelStrings: false,
        quote: '',
        delimiter: '\t',
    }, { objectMode: true });

    //@ts-ignore
    transformer._implicitHeader = () => {};

    const header = buildGenesMetadata(data, additionalMetadata);
    const csv_header = data.genes.header;

    const input = new Readable({ objectMode: true });
    input._read = () => { };

    inputs.forEach(gene => input.push(gene));
    input.push(null);
    input.pipe(transformer);

    return combine()
        .append(header+"\n")
        .append(csv_header+"\n")
        .append(transformer)
        .append(null)
}