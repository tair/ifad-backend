import express from "express";
import { StructuredData } from "../../ingest";
import { getDataset } from "../../data_fetcher";

const serveFile = (filename: string, callback?: () => any) => {
  const app = express();
  app.use("/annotations", express.static(filename));
  return app.listen(8080, () => {
    console.log(`Serving file ${filename}`);
    if (callback) { callback(); }
  });
};

test("data updates when files on the server change", async (done) => {
  const path = require("path");
  process.env["UPDATE_INTERVAL"] = "5000";
  process.env["UPDATE_AT_MIDNIGHT"] = "false";
  process.env["SERVER_LIFETIME_LENGTH"] = "20000";
  process.env["FILE_URL"] = "http://localhost:8080/annotations/tair.gaf.gz";
  const januaryServer = await serveFile(path.join(__dirname + "/january"),
  () => {
    const backend = require(path.join(__dirname + "/../../index.ts"));
    const januaryData: StructuredData = getDataset();
  
    setTimeout(async () => {
      januaryServer.close();
      let februaryServer = await serveFile(path.join(__dirname + "/february"));
      setTimeout(() => februaryServer.close(), 10000);
    }, 10000);
    setTimeout(() => {
      const februaryData: StructuredData = getDataset();
      expect(januaryData).not.toEqual(februaryData);
      done();
    }, 12000);
  });
}, 30000);
