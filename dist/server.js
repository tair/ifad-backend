"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const typescript_rest_1 = require("typescript-rest");
const service_1 = require("./services/hello_world/service");
const app = express_1.default();
exports.app = app;
typescript_rest_1.Server.buildServices(app, service_1.HelloWorldService);
//# sourceMappingURL=server.js.map