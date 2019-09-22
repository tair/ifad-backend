import express from "express";
import { Server } from 'typescript-rest';
import { HelloWorldService } from './services/hello_world/service';

const app = express();

Server.buildServices(app, HelloWorldService);

export {app};