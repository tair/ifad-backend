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
        value: (row: Annotation) => row.Invert === true ? "NOT" : ''
    }],
    ["AlternativeGeneName", {
        value: (row: Annotation) => (row.AlternativeGeneName || []).join("|")
    }],
    ["AdditionalEvidence", {
        value: (row: Annotation) => (row.AdditionalEvidence || []).join("|")
    }],
    ["Date", {
        // return new Date(Date.parse(`${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}`));
        value: (row) => new Date(row.Date).toJSON().split("T")[0].replace(/\-/g, "")
    }]
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

    const input = new Readable({ objectMode: true });
    input._read = () => { };

    for (const record of data.annotations.records) {
        input.push(record)
    }
    input.push(null);

    input.pipe(transformer)

    return combine()
        .append(header+"\n")
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
    const inputs = Object.values(data.genes.index).map(val => val.gene);

    const transformer = new Transform({
        fields: GENE_COLUMNS,
        header: true,
        defaultValue: "",
        excelStrings: false,
        quote: '',
        delimiter: '\t',
    }, { objectMode: true });

    //@ts-ignore
    transformer._implicitHeader = () => {};

    const header = buildGenesMetadata(data, additionalMetadata);

    const input = new Readable({ objectMode: true });
    input._read = () => { };

    for (const record of inputs) {
        input.push(record)
    }
    input.push(null);

    input.pipe(transformer)

    return combine()
        .append(header+"\n")
        .append(transformer)
        .append(null)
}