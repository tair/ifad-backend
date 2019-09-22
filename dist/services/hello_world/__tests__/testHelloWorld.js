"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const supertest_1 = tslib_1.__importDefault(require("supertest"));
const server_1 = require("../../../server");
describe("Hello World service", () => {
    let req;
    beforeEach(() => {
        req = supertest_1.default(server_1.app);
    });
    it("Should fail on index", async () => {
        expect.hasAssertions();
        const resp = await req.get("/");
        expect(resp.status).toEqual(404);
    });
    it("Should properly greet me", async () => {
        expect.hasAssertions();
        const resp = await req.get("/hello_world/Joseph");
        expect(resp.status).toEqual(200);
        expect(resp.text).toEqual("Hello Joseph");
    });
});
//# sourceMappingURL=testHelloWorld.js.map