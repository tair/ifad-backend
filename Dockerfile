FROM node:lts as build

ADD ./ /proj_build
WORKDIR /proj_build

RUN yarn
RUN yarn build

FROM node:lts

COPY --from=build /proj_build /project
WORKDIR /project

CMD ["yarn", "start"]