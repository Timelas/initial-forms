import crypto from "node:crypto";
import { URL } from "node:url";
import { renderAdminPage } from "./admin-page.js";
import { loadEnvFile } from "./env.js";
import { appendAuditLog, appendRejectedLog, ensureStorage, loadRegistry, saveRegistry } from "./storage.js";
import { sendToTelegram } from "./telegram.js";

let initPromise;

async function ensureAppReady() {
  if (!initPromise) {
    initPromise = (async () => {
      loadEnvFile();
      await ensureStorage();
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

const port = Number(process.env.PORT || 3000);
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;
const trustProxy = String(process.env.TRUST_PROXY || "false") === "true";

const rateLimitMemory = new Map();
const sessions = new Map();

const reasonTexts = {
  unknown_form_key: "Unknown form key",
  origin_not_allowed: "Origin is not allowed",
  unauthorized: "Unauthorized",
  validation_failed: "Validation failed",
  rate_limited: "Too many requests",
  telegram_config_missing: "Telegram config is missing",
  telegram_delivery_failed: "Telegram delivery failed",
  server_error: "Internal server error",
  unsupported_content_type: "Unsupported content type",
  form_disabled: "Form is disabled",
  bot_detected: "Request rejected by anti-spam"
};

function json(res, statusCode, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    ...extraHeaders
  });
  res.end(body);
}

function html(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store"
  });
  res.end(payload);
}

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...rest] = part.split("=");
        return [key, decodeURIComponent(rest.join("="))];
      })
  );
}

function createSession(username) {
  const sessionId = crypto.randomBytes(24).toString("hex");
  sessions.set(sessionId, {
    username,
    createdAt: Date.now()
  });
  return sessionId;
}

function getRequestIp(req) {
  if (trustProxy) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      return forwarded.split(",")[0].trim();
    }
  }
  return req.socket?.remoteAddress || "unknown";
}

function normalizeOrigin(origin) {
  if (!origin) {
    return "";
  }
  return origin.replace(/\/$/, "");
}

function setCors(req, res, form) {
  const origin = normalizeOrigin(req.headers.origin || "");
  const allowedOrigins = (form?.allowedOrigins || []).map(normalizeOrigin);
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400");
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  const contentType = (req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();

  if (!raw) {
    return { contentType, data: {} };
  }

  if (contentType === "application/json") {
    return { contentType, data: JSON.parse(raw) };
  }

  if (contentType === "application/x-www-form-urlencoded") {
    return { contentType, data: Object.fromEntries(new URLSearchParams(raw)) };
  }

  if (contentType === "multipart/form-data") {
    const boundaryMatch = (req.headers["content-type"] || "").match(/boundary=(.+)$/);
    if (!boundaryMatch) {
      return { contentType, data: {} };
    }
    const boundary = `--${boundaryMatch[1]}`;
    const fields = {};
    const parts = raw.split(boundary).slice(1, -1);
    for (const part of parts) {
      const [headerBlock, valueBlock] = part.split("\r\n\r\n");
      if (!headerBlock || !valueBlock) {
        continue;
      }
      const nameMatch = headerBlock.match(/name="([^"]+)"/);
      const fileMatch = headerBlock.match(/filename="([^"]*)"/);
      if (!nameMatch || fileMatch) {
        continue;
      }
      fields[nameMatch[1]] = valueBlock.replace(/\r\n--?$/, "").trim();
    }
    return { contentType, data: fields };
  }

  throw Object.assign(new Error("Unsupported content type"), { reason: "unsupported_content_type" });
}

function canonicalizeFields(form, input) {
  const output = {};
  for (const field of form.fields || []) {
    const names = [field.name, ...(field.aliases || [])];
    const matched = names.find((name) => Object.prototype.hasOwnProperty.call(input, name));
    if (!matched) {
      continue;
    }
    const value = input[matched];
    if (!field.omit) {
      output[field.map || field.name] = value;
    }
  }
  return output;
}

function validateFields(form, input) {
  const missing = [];
  for (const requiredName of form.requiredFields || []) {
    if (!input[requiredName] && input[requiredName] !== 0) {
      missing.push(requiredName);
    }
  }
  return missing;
}

function checkRateLimit(form, ip) {
  const antiSpam = form.antiSpamConfig || {};
  const rateLimit = antiSpam.rateLimit || { windowMs: 60000, max: 5 };
  const key = `${form.formKey}:${ip}`;
  const now = Date.now();
  const history = (rateLimitMemory.get(key) || []).filter((time) => now - time < rateLimit.windowMs);
  history.push(now);
  rateLimitMemory.set(key, history);
  return history.length <= rateLimit.max;
}

function checkAntiSpam(form, rawInput, canonicalFields, ip) {
  const antiSpam = form.antiSpamConfig || {};
  if (!antiSpam.enabled) {
    return { ok: true };
  }
  if (!checkRateLimit(form, ip)) {
    return { ok: false, reason: "rate_limited" };
  }
  if (antiSpam.honeypotField && rawInput[antiSpam.honeypotField]) {
    return { ok: false, reason: "bot_detected" };
  }
  if (antiSpam.minFillTimeMs) {
    const submittedAt = Number(rawInput.submittedAt || rawInput.ts || 0);
    if (!submittedAt || Date.now() - submittedAt < antiSpam.minFillTimeMs) {
      return { ok: false, reason: "bot_detected" };
    }
  }
  if (antiSpam.turnstile) {
    if (!canonicalFields.turnstileToken && !rawInput.turnstileToken) {
      return { ok: false, reason: "validation_failed", error: "Turnstile token is required" };
    }
  }
  return { ok: true };
}

function buildRequestLog(req, form, site, extra = {}) {
  return {
    at: new Date().toISOString(),
    method: req.method,
    path: req.url,
    origin: req.headers.origin || "",
    referer: req.headers.referer || "",
    requestOrigin: req.headers["x-forwarded-host"] || req.headers.host || "",
    contentType: req.headers["content-type"] || "",
    formKey: form?.formKey || extra.formKey || "",
    siteId: site?.siteId || form?.siteId || "",
    ip: getRequestIp(req),
    ...extra
  };
}

async function reject(req, res, statusCode, reason, form, site, extra = {}) {
  setCors(req, res, form);
  const payload = {
    ok: false,
    reason,
    error: extra.error || reasonTexts[reason] || "Request failed"
  };
  const logEntry = buildRequestLog(req, form, site, {
    ...extra,
    reason
  });
  await appendRejectedLog(logEntry);
  json(res, statusCode, payload);
}

async function requireAdmin(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const session = cookies.session ? sessions.get(cookies.session) : null;
  if (session) {
    return true;
  }

  if (req.method === "POST" && req.url === "/api/admin/login") {
    const { data } = await parseBody(req);
    if (
      data.username === process.env.ADMIN_USERNAME &&
      data.password === process.env.ADMIN_PASSWORD
    ) {
      const sessionId = createSession(data.username);
      json(
        res,
        200,
        { ok: true },
        {
          "Set-Cookie": `session=${sessionId}; HttpOnly; Path=/; SameSite=Lax`
        }
      );
      return false;
    }
    json(res, 401, {
      ok: false,
      reason: "unauthorized",
      error: reasonTexts.unauthorized
    });
    return false;
  }

  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    const authHeader = req.headers.authorization || "";
    const basicPrefix = "Basic ";
    if (authHeader.startsWith(basicPrefix)) {
      const decoded = Buffer.from(authHeader.slice(basicPrefix.length), "base64").toString("utf8");
      const [username, password] = decoded.split(":");
      if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        return true;
      }
    }
  }

  json(res, 401, {
    ok: false,
    reason: "unauthorized",
    error: reasonTexts.unauthorized
  });
  return false;
}

async function handleAdminPage(req, res) {
  if (!(await requireAdmin(req, res))) {
    return;
  }
  html(res, 200, renderAdminPage());
}

function sendRoot(res) {
  json(res, 200, {
    ok: true,
    service: "forms-platform",
    publicBaseUrl,
    endpoints: {
      health: "/health",
      submit: "/api/forms/:formKey",
      adminUi: "/admin"
    }
  });
}

async function handleFormOptions(req, res, formKey) {
  const registry = await loadRegistry();
  const form = registry.forms.find((item) => item.formKey === formKey) || null;
  setCors(req, res, form);
  res.writeHead(204);
  res.end();
}

async function handleFormSubmit(req, res, formKey) {
  const registry = await loadRegistry();
  const form = registry.forms.find((item) => item.formKey === formKey);
  if (!form) {
    return reject(req, res, 404, "unknown_form_key", null, null, { formKey });
  }

  const site = registry.sites.find((item) => item.siteId === form.siteId) || null;
  setCors(req, res, form);

  const origin = normalizeOrigin(req.headers.origin || "");
  if (origin && !(form.allowedOrigins || []).map(normalizeOrigin).includes(origin)) {
    return reject(req, res, 403, "origin_not_allowed", form, site);
  }

  if (!form.enabled) {
    return reject(req, res, 403, "form_disabled", form, site, { error: reasonTexts.form_disabled });
  }

  let parsed;
  try {
    parsed = await parseBody(req);
  } catch (error) {
    return reject(req, res, 415, error.reason || "unsupported_content_type", form, site, {
      error: error.message
    });
  }

  if (
    Array.isArray(form.acceptedContentTypes) &&
    form.acceptedContentTypes.length > 0 &&
    !form.acceptedContentTypes.includes(parsed.contentType)
  ) {
    return reject(req, res, 415, "unsupported_content_type", form, site);
  }

  const canonicalFields = canonicalizeFields(form, parsed.data);
  const missing = validateFields(form, canonicalFields);
  if (missing.length > 0) {
    return reject(req, res, 422, "validation_failed", form, site, {
      parsedFields: canonicalFields,
      error: `Missing required fields: ${missing.join(", ")}`
    });
  }

  const antiSpam = checkAntiSpam(form, parsed.data, canonicalFields, getRequestIp(req));
  if (!antiSpam.ok) {
    return reject(req, res, antiSpam.reason === "rate_limited" ? 429 : 403, antiSpam.reason, form, site, {
      parsedFields: canonicalFields,
      error: antiSpam.error
    });
  }

  const delivery = await sendToTelegram(form, site, canonicalFields);
  const logEntry = buildRequestLog(req, form, site, {
    parsedFields: canonicalFields,
    telegramResult: delivery
  });
  await appendAuditLog(logEntry);

  if (!delivery.ok) {
    return reject(req, res, 502, delivery.reason, form, site, {
      parsedFields: canonicalFields,
      error: delivery.error,
      telegramResult: delivery
    });
  }

  json(res, 200, { ok: true });
}

async function handleAdminSites(req, res, pathname) {
  if (!(await requireAdmin(req, res))) {
    return;
  }
  const registry = await loadRegistry();
  const siteId = decodeURIComponent(pathname.split("/").pop());

  if (req.method === "GET" && pathname === "/api/admin/sites") {
    return json(res, 200, { ok: true, sites: registry.sites });
  }

  if (req.method === "POST" && pathname === "/api/admin/sites") {
    const { data } = await parseBody(req);
    registry.sites = registry.sites.filter((site) => site.siteId !== data.siteId);
    registry.sites.push(data);
    await saveRegistry(registry);
    await appendAuditLog({ at: new Date().toISOString(), action: "site_created", siteId: data.siteId });
    return json(res, 201, { ok: true, site: data });
  }

  if (req.method === "PUT" && pathname.startsWith("/api/admin/sites/")) {
    const { data } = await parseBody(req);
    registry.sites = registry.sites.map((site) => (site.siteId === siteId ? data : site));
    await saveRegistry(registry);
    await appendAuditLog({ at: new Date().toISOString(), action: "site_updated", siteId });
    return json(res, 200, { ok: true, site: data });
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/admin/sites/")) {
    registry.sites = registry.sites.filter((site) => site.siteId !== siteId);
    registry.forms = registry.forms.filter((form) => form.siteId !== siteId);
    await saveRegistry(registry);
    await appendAuditLog({ at: new Date().toISOString(), action: "site_deleted", siteId });
    return json(res, 200, { ok: true });
  }
}

async function handleAdminForms(req, res, pathname) {
  if (!(await requireAdmin(req, res))) {
    return;
  }
  const registry = await loadRegistry();
  const formKey = decodeURIComponent(pathname.split("/").pop());

  if (req.method === "GET" && pathname === "/api/admin/forms") {
    return json(res, 200, { ok: true, forms: registry.forms });
  }

  if (req.method === "POST" && pathname === "/api/admin/forms") {
    const { data } = await parseBody(req);
    registry.forms = registry.forms.filter((form) => form.formKey !== data.formKey);
    registry.forms.push(data);
    await saveRegistry(registry);
    await appendAuditLog({ at: new Date().toISOString(), action: "form_created", formKey: data.formKey });
    return json(res, 201, { ok: true, form: data });
  }

  if (req.method === "PUT" && pathname.startsWith("/api/admin/forms/")) {
    const { data } = await parseBody(req);
    registry.forms = registry.forms.map((form) => (form.formKey === formKey ? data : form));
    await saveRegistry(registry);
    await appendAuditLog({ at: new Date().toISOString(), action: "form_updated", formKey });
    return json(res, 200, { ok: true, form: data });
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/admin/forms/")) {
    registry.forms = registry.forms.filter((form) => form.formKey !== formKey);
    await saveRegistry(registry);
    await appendAuditLog({ at: new Date().toISOString(), action: "form_deleted", formKey });
    return json(res, 200, { ok: true });
  }
}

export async function appHandler(req, res) {
  try {
    await ensureAppReady();

    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;

    if (req.method === "GET" && pathname === "/") {
      return sendRoot(res);
    }

    if (req.method === "GET" && pathname === "/health") {
      return json(res, 200, { ok: true, uptime: process.uptime() });
    }

    if (req.method === "GET" && pathname === "/admin") {
      return handleAdminPage(req, res);
    }

    if (req.method === "OPTIONS" && pathname.startsWith("/api/forms/")) {
      const formKey = decodeURIComponent(pathname.split("/").pop());
      return handleFormOptions(req, res, formKey);
    }

    if (req.method === "POST" && pathname.startsWith("/api/forms/")) {
      const formKey = decodeURIComponent(pathname.split("/").pop());
      return handleFormSubmit(req, res, formKey);
    }

    if (pathname.startsWith("/api/admin/sites")) {
      return handleAdminSites(req, res, pathname);
    }

    if (pathname.startsWith("/api/admin/forms")) {
      return handleAdminForms(req, res, pathname);
    }

    if (req.method === "GET" && pathname === "/api/admin/audit-log") {
      if (!(await requireAdmin(req, res))) {
        return;
      }
      const registry = await loadRegistry();
      return json(res, 200, { ok: true, auditLog: registry.auditLog || [] });
    }

    return json(res, 404, {
      ok: false,
      reason: "server_error",
      error: "Route not found"
    });
  } catch (error) {
    console.error(error);
    return json(res, 500, {
      ok: false,
      reason: "server_error",
      error: error.message || reasonTexts.server_error
    });
  }
}

export function getPublicBaseUrl() {
  return publicBaseUrl;
}
