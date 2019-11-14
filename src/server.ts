import express from "express";
import { Server } from 'typescript-rest';
import {V1Service} from "./services/v1_service/service";
import {resolve} from "path";
import cors from "cors";

const app = express();
app.use(cors());
Server.buildServices(app, V1Service);

app.use(/\/$/, (req, res) => res.redirect("/app/"));
app.use("/app/", express.static(process.env["FRONTEND_PUBLIC_PATH"] || resolve("../ifad-frontend/build")));

export {app};