import express from "express";
import { StructuredData } from "../ingest";
import {startPeriodicallyCalling, getDataset} from "../data_fetcher";

describe("Periodically calling functions", () => {
  
  it("should call once for each period", () => {
    let foo = jest.fn();
    startPeriodicallyCalling(foo, 300, new Date());
    setTimeout(() => expect(foo).toHaveBeenCalledTimes(3), 1000);
  });

  it("should only start calling after the start date", () => {
    let bar = jest.fn();
    const startDate = new Date();
    startDate.setMilliseconds(startDate.getMilliseconds() + 500);
    startPeriodicallyCalling(bar, 200, startDate);
    setTimeout(() => expect(bar).toHaveBeenCalledTimes(0), 400);
    setTimeout(() => expect(bar).toHaveBeenCalledTimes(2), 1000);
  });

  it("should stop running when a lifetime is provided", () => {
    let foobar = jest.fn();
    startPeriodicallyCalling(foobar, 200, new Date(), 300);
    setTimeout(() => expect(foobar).toHaveBeenCalledTimes(1), 500);
  });
});

test("The data getter reflects updates when the server changes", 
 async () => {
    const path = require("path");
  
    process.env["UPDATE_INTERVAL"] = "5000";
    process.env["UPDATE_AT_MIDNIGHT"] = "false";
    process.env["SERVER_LIFETIME_LENGTH"] = "20000";
    process.env["FILE_URL"] = "http://localhost:8080/annotations/tair.gaf.gz";
  
    const januaryServer = serveFile(path.join(__dirname + "/january"));
  
    await new Promise(() => setTimeout(() => {
      januaryServer.close();
      let februaryServer = serveFile(path.join(__dirname + "/february"));
      setTimeout(() => februaryServer.close(), 10000);
    }, 10000));
  
    await new Promise(() => setTimeout(async () => {
      const backend = require(path.join(__dirname + "/../../src/index.ts"));
  
      const januaryData: StructuredData = getDataset();
      await new Promise(() => setTimeout(() => {
        const februaryData: StructuredData = getDataset();
        console.log(januaryData == februaryData);
        console.log(januaryData === februaryData);
        console.log(JSON.stringify(januaryData).split('at').length - 1);
        console.log(JSON.stringify(februaryData).split('at').length - 1);
        expect(januaryData).not.toEqual(februaryData);
        expect(januaryData).toEqual(februaryData);
      }, 12000));
    }, 5000));
}, 25000);

const serveFile = (filename: string, callback?: () => any) => {
  const app = express();
  app.use("/annotations", express.static(filename));
  return app.listen(8080, () => {
    console.log(`Serving file ${filename}`);
    if (callback) {
      callback();
    }
  });
};
