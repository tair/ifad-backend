"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const typescript_rest_1 = require("typescript-rest");
let HelloWorldService = class HelloWorldService {
    sayHello(name) {
        return `Hello ${name}`;
    }
};
tslib_1.__decorate([
    typescript_rest_1.Path(":name"),
    typescript_rest_1.GET,
    tslib_1.__param(0, typescript_rest_1.PathParam("name")),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], HelloWorldService.prototype, "sayHello", null);
HelloWorldService = tslib_1.__decorate([
    typescript_rest_1.Path("/hello_world")
], HelloWorldService);
exports.HelloWorldService = HelloWorldService;
//# sourceMappingURL=service.js.map