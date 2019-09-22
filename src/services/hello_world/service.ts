import { Path, GET, PathParam } from "typescript-rest";

@Path("/hello_world")
export class HelloWorldService {
    @Path(":name")
    @GET
    sayHello(@PathParam("name") name: string){
        return `Hello ${name}`;
    }
}