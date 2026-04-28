import { appHandler } from "../src/app.js";

export default async function handler(req, res) {
  return appHandler(req, res);
}
