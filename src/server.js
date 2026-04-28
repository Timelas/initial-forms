import http from "node:http";
import { appHandler, getPublicBaseUrl } from "./http-app.js";

const port = Number(process.env.PORT || 3000);

const server = http.createServer(appHandler);

server.listen(port, () => {
  console.log(`Forms platform listening on ${getPublicBaseUrl()}`);
});
