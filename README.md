![Action Status](https://github.com/tair/ifad-backend/workflows/CI/badge.svg)

# IFAD Backend

This is the backend server that handles the ingestion of relevant data and
handles querying of annotations and gene info.

## Dependencies

To get started, you'll need to have the following tools installed:

* [Node.js] (v12 or later)
* [Yarn]

[Node.js]: https://nodejs.org/en/download/
[Yarn]: https://classic.yarnpkg.com/en/docs/install/#debian-stable

## Running Locally

To launch the development server, run the following commands.

``` bash
# Install dependencies
yarn

# Launch the server
yarn start
```

This will start the API server at `localhost:3000`. At this point, you can
launch the [frontend] in order to visually query the data.

[frontend]: https://github.com/tair/ifad-frontend

## Running Unit Tests

To run unit tests, just run

```bash
yarn test
```

## Launching in Production Mode

### Additional Dependency

If you're working with IFAD deployments, you'll also need to have the
following installed:

* [Docker](https://docs.docker.com/install/)
* [docker-compose](https://docs.docker.com/compose/install/)

This application is deployed in production using Docker with the help of
`docker-compose`. Production builds are uploaded as Docker images to
Docker Hub. To download and launch the latest release, run

```bash
docker-compose up -d && docker-compose logs -f
```

This command will do the following:

* `docker-compose up -d`
  * This will download (if necessary) the production image specified
    in the docker-compose.yml file and launch it in the background.
* `docker-compose logs -f`
  * This will open the logs for the production server and follow them
    for as long as the server is running or until exited. Quitting the
    logs will not kill the server.

One thing to note is that if you use `-d` then you'll need to explicitly
shut down the server when you're done with it using `docker-compose down`.

## Creating a new Release

Suppose you want to create a new release, say, `v0.3.0`. You'd first
prepare and tag a release in the frontend, then the backend. To prepare
a release, make sure you have any changes you want in the release tested
and merged into master. Then, in the frontend repository, you'd tag the
git commit and build the frontend docker image, like so:

```bash
# In the frontend repository
git tag -a "v0.3.0" -m "Bump version to v0.3.0"
docker build -t <docker repository>/ifad-frontend:v0.3.0 .
docker push <docker repository>/ifad-frontend:v0.3.0
```

Then, you'd prepare the backend repository in the same way, by testing
and merging any changes you want into master. However, this time you need
to make sure to update the backend's `Dockerfile` and `docker-compose.yml`
with the new version.

Dockerfile:

```diff
- FROM <docker repository>/ifad-frontend:v0.2.2 AS frontend
+ FROM <docker repository>/ifad-frontend:v0.3.0 AS frontend
```

docker-compose.yml:

```diff
-    image: <docker repository>/ifad-backend:v0.2.2
+    image: <docker repository>/ifad-backend:v0.3.0
```

Commit those changes to master, then tag and build it the same way.

```bash
# In the backend repository
git tag -a "v0.3.0" -m "Bump version to v0.3.0"
docker build -t <docker repository>/ifad-backend:v0.3.0 .
docker push <docker repository>/ifad-backend:v0.3.0
```

## Deploying the new Release

To deploy the new docker image we just created, SSH into the deployment
server. If `ifad-backend` has already been cloned there, navigate to it,
otherwise, clone it first. Otherwise, make sure to `git pull` the latest
version.

> **Note**: In reality, you don't need the full source of the project on the
> production machine, but by cloning the git project you can easily get the
> most up-to-date version of the docker-compose.yml file on the machine.

Once you're in the `ifad-backend` directory with the `docker-compose.yml`
file, just run the following to deploy the latest release:

```bash
docker-compose up -d && docker-compose logs -f
```

Once you see from the logs that the server has successfully launched, you
can safely quit the logs using `Ctrl-C` and the server will continue running.
