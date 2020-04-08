import express from "express";
import { Server } from 'typescript-rest';
import {V1Service} from "./services/v1";
import {resolve} from "path";
import cors from "cors";
import compression from "compression";
import { updateData, startPeriodicallyCalling, getTomorrowMorning } from './data_fetcher';

updateData();
const default_interval: string = (1000 * 60 * 60 * 24).toString();
const interval: string = process.env["UPDATE_INTERVAL"] || default_interval;
const update_at_midnight: string = process.env["UPDATE_AT_MIDNIGHT"] || 'true';
if (update_at_midnight === "true") {
    startPeriodicallyCalling(updateData, parseInt(interval), getTomorrowMorning());
} else {
    startPeriodicallyCalling(updateData, parseInt(interval));
}

const app = express();
app.use(cors());
app.use(compression());
Server.buildServices(app, V1Service);

app.use(/\/$/, (req, res) => res.redirect("/app/"));
app.use("/app/", express.static(process.env["FRONTEND_PUBLIC_PATH"] || resolve("../ifad-frontend/build")));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`🚢 Now listening on 0.0.0.0:${PORT} 🔥`);
});

const lifetime: string | null = process.env["SERVER_LIFETIME_LENGTH"] || null;
if (lifetime) {
    setTimeout(() => server.close(() => console.log("Server closed")), parseInt(lifetime));
}
