import { Annotation, ANNOTATION_COLUMNS, GENE_COLUMNS, Gene } from './ingest';
import json2csv, { parse } from "json2csv";

const column_modifiers: Map<string|null, json2csv.FieldInfo<Annotation>> = new Map([
    [null, {
        value: () => ''
    }],
    ["Invert", {
        value: (row: Annotation) => row.Invert === true ? "NOT" : ''
    }],
    ["AlternativeGeneName", {
        value: (row: Annotation) => (row.AlternativeGeneName||[]).join("|")
    }],
    ["AdditionalEvidence", {
        value: (row: Annotation) => (row.AdditionalEvidence||[]).join("|")
    }],
    ["Date", {
        // return new Date(Date.parse(`${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}`));
        value: (row) => new Date(row.Date).toJSON().split("T")[0].replace(/\-/g,"")
    }]
])

export function annotationsToGAF(annotations: Annotation[], headers: {[key: string]: string} = {}){
    headers = {
        ...headers,
        "gaf-version": "2.0"
    };

    const parsed = parse(annotations, {
        fields: ANNOTATION_COLUMNS.map(col=>column_modifiers.get(col) || col as string),
        header: false,
        defaultValue: "",
        excelStrings: true
    });

    const joinedHeader = Object.entries(headers).map(([header, value]) => `!${header}: ${value}`, "").join("\n");
    
    return joinedHeader.concat("\n",parsed);
}

export function genesToCSV(genes: Gene[], headers: {[key: string]: string} = {}){
    const parsed = parse(genes, {
        fields: GENE_COLUMNS,
        header: false,
        defaultValue: "",
        excelStrings: true
    });

    const joinedHeader = Object.entries(headers).map(([header, value]) => `!${header}: ${value}`, "").join("\n");
    
    return joinedHeader.concat("\n",parsed);
}