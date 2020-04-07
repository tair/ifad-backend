FROM phoenixbioinformatics/ifad-frontend:v0.2.4 AS frontend

FROM node:lts as backend

WORKDIR /ifad/backend
COPY --from=frontend /frontend /ifad/frontend
COPY . .

RUN yarn

ENV FRONTEND_PUBLIC_PATH /ifad/frontend
RUN yarn build

CMD ["yarn", "start"]
