import request, { SuperTest, Test } from "supertest";
import { app } from '../../../server';

describe("Hello World service", () => {
    let req: SuperTest<Test>;

    beforeEach(() => {
        req = request(app);
    });

    it("Should fail on index", async () => {
        expect.hasAssertions();

        const resp = await req.get("/");

        expect(resp.status).toEqual(404);
    })

    it("Should properly greet me", async () => {
        expect.hasAssertions();

        const resp = await req.get("/hello_world/Joseph");

        expect(resp.status).toEqual(200);
        expect(resp.text).toEqual("Hello Joseph");
    })
})