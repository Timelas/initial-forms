import { promises as fs } from "node:fs";
import path from "node:path";

const seedDataDir = path.resolve("data");
const defaultDataDir = process.env.VERCEL ? "/tmp/forms-platform-data" : seedDataDir;
const dataDir = path.resolve(process.env.DATA_DIR || defaultDataDir);
const registryPath = path.join(dataDir, "registry.json");
const rejectedLogPath = path.join(dataDir, "rejected.ndjson");
const seedRegistryPath = path.join(seedDataDir, "registry.json");

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function writeJson(filePath, value) {
  const next = `${JSON.stringify(value, null, 2)}\n`;
  await fs.writeFile(filePath, next, "utf8");
}

export async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  const registry = await readJson(registryPath, null);
  if (!registry) {
    const seedRegistry = await readJson(seedRegistryPath, { sites: [], forms: [], auditLog: [] });
    await writeJson(registryPath, seedRegistry);
  }
  try {
    await fs.access(rejectedLogPath);
  } catch {
    await fs.writeFile(rejectedLogPath, "", "utf8");
  }
}

export async function loadRegistry() {
  return readJson(registryPath, { sites: [], forms: [], auditLog: [] });
}

export async function saveRegistry(registry) {
  return writeJson(registryPath, registry);
}

export async function appendRejectedLog(entry) {
  await fs.appendFile(rejectedLogPath, `${JSON.stringify(entry)}\n`, "utf8");
}

export async function appendAuditLog(entry) {
  const registry = await loadRegistry();
  registry.auditLog = Array.isArray(registry.auditLog) ? registry.auditLog : [];
  registry.auditLog.unshift(entry);
  registry.auditLog = registry.auditLog.slice(0, 200);
  await saveRegistry(registry);
}
