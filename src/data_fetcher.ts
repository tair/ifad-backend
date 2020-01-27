import {readFileSync} from "fs";
import {resolve} from "path";
import {ingestData, StructuredData, UnstructuredText} from "./ingest";

let mostRecentDataset: StructuredData;

export const getDataset = (): StructuredData => { return mostRecentDataset; };

export const downloadData = (dataUrl: string) => {
    const { spawnSync } = require("child_process");
    const path = require("path");
    const filepath = path.join(__dirname + "/../assets/");
    spawnSync("cd " + filepath + " ; rm tair.gaf");
    spawnSync("cd " + filepath + " ; wget " + dataUrl);
    spawnSync("cd " + filepath + " ; gunzip *.gz");
}

export const updateData = () => {
    const file_url = process.env["FILE_URL"] || "http://current.geneontology.org/annotations/tair.gaf.gz";
    downloadData(file_url);
    console.log("Begin reading data");
    const genesText = readFileSync(resolve("assets/gene-types.txt")).toString();
    const annotationsText = readFileSync(resolve("assets/tair.gaf")).toString();
    const unstructuredText: UnstructuredText = {genesText, annotationsText};
    const maybeDataset = ingestData(unstructuredText);
    if (!maybeDataset) throw new Error("failed to parse data");
    const dataset: StructuredData = maybeDataset;
    mostRecentDataset = dataset;
    console.log("Finished parsing data");
};

export const startPeriodicallyCalling = (fn: (...args: any[]) => void, interval: number = (1000 * 60 * 60 * 24), startDate: Date = new Date(), lifetime?: number) => {
    const now = new Date();

    const update_at_midnight: string = process.env["UPDATE_AT_MIDNIGHT"] || "true";
    if (update_at_midnight === "true") {
        startDate = getTomorrowMorning();
    }

    let timer;
    if (isSameTimeOfDay(startDate, now)) {
        timer = setInterval(fn, interval);
    } else {
        let difference = startDate.getTime() - now.getTime();
        if (difference > 0) {
            if (lifetime) {
                setTimeout(startPeriodicallyCalling, difference, fn, interval, startDate, lifetime);
            } else {
                setTimeout(startPeriodicallyCalling, difference, fn, interval, startDate);
            }
            return;
        } else {
            timer = setInterval(fn, interval);  // Just begins the updates now if the startDate is in the past
        }
    }

    if (lifetime) {
        setTimeout(clearInterval, lifetime, timer);
    }
};

export const getTomorrowMorning = (): Date => {
    const tomorrowMorning: Date = new Date();
    tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
    tomorrowMorning.setHours(0);
    tomorrowMorning.setMinutes(0);
    tomorrowMorning.setSeconds(0);
    return tomorrowMorning;
};

const isSameTimeOfDay = (time1, time2) => {
    return time1.getHours() === time2.getHours() && time1.getMinutes() === time2.getMinutes();
}
