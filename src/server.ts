import express from "express";
import { Server } from 'typescript-rest';
import {V1Service} from "./services/v1_service/service";

const app = express();

Server.buildServices(app, V1Service);

export {app};