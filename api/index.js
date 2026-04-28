import { appHandler } from "../src/http-app.js";

export default async function handler(req, res) {
  try {
    return await appHandler(req, res);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(
      JSON.stringify({
        ok: false,
        reason: "server_error",
        error: error?.message || "Internal server error"
      })
    );
  }
}
