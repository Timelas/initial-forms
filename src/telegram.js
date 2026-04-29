function resolveEnvArray(keys = []) {
  return keys.map((key) => process.env[key]).filter(Boolean);
}

const telegramRequestTimeoutMs = Number(process.env.TELEGRAM_REQUEST_TIMEOUT_MS || 10000);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function normalizeSiteDomain(site, form) {
  const domain = site?.frontendDomains?.[0] || form?.allowedOrigins?.[0] || site?.name || form?.siteId || "";
  return String(domain).replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function normalizeLabel(fieldKey, fieldConfig) {
  return fieldConfig?.label || fieldConfig?.name || fieldKey;
}

function normalizeFieldValue(fieldConfig, value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (fieldConfig?.type === "checkbox") {
    return ["on", "true", "1", "yes", "да"].includes(String(value).toLowerCase()) ? "Да" : "Нет";
  }

  return String(value);
}

function buildTelegramLines(form, fields) {
  const configuredFields = Array.isArray(form?.fields) ? form.fields : [];
  const lines = [];
  const usedKeys = new Set();

  for (const fieldConfig of configuredFields) {
    const key = fieldConfig.map || fieldConfig.name;
    if (!key || !Object.prototype.hasOwnProperty.call(fields, key)) {
      continue;
    }

    const value = normalizeFieldValue(fieldConfig, fields[key]);
    if (!value) {
      continue;
    }

    usedKeys.add(key);
    lines.push(`<b>${escapeHtml(normalizeLabel(key, fieldConfig))}</b>: ${escapeHtml(value)}`);
  }

  for (const [key, rawValue] of Object.entries(fields)) {
    if (usedKeys.has(key)) {
      continue;
    }

    const value = normalizeFieldValue(null, rawValue);
    if (!value) {
      continue;
    }

    lines.push(`<b>${escapeHtml(key)}</b>: ${escapeHtml(value)}`);
  }

  return lines;
}

export async function sendToTelegram(form, site, fields) {
  const { telegramConfig = {} } = form;
  const token = process.env[telegramConfig.tokenEnvKey];
  const chatIds = telegramConfig.chatEnvKeys?.length
    ? resolveEnvArray(telegramConfig.chatEnvKeys)
    : telegramConfig.chatEnvKey
      ? [process.env[telegramConfig.chatEnvKey]].filter(Boolean)
      : [];

  if (!token || chatIds.length === 0) {
    return {
      ok: false,
      reason: "telegram_config_missing",
      error: "Telegram env config is missing"
    };
  }

  const header = [
    `<b>Новая заявка</b>`,
    `<b>Форма</b>: ${escapeHtml(form.title || form.formKey)}`,
    `<b>Сайт</b>: ${escapeHtml(normalizeSiteDomain(site, form))}`
  ];

  const body = buildTelegramLines(form, fields);

  const text = [...header, "", ...body].join("\n");

  for (const chatId of chatIds) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), telegramRequestTimeoutMs);
    let response;

    try {
      response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML"
        }),
        signal: controller.signal
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error?.name === "AbortError") {
        return {
          ok: false,
          reason: "telegram_delivery_failed",
          error: `Telegram request timed out after ${telegramRequestTimeoutMs}ms`
        };
      }
      return {
        ok: false,
        reason: "telegram_delivery_failed",
        error: error?.message || "Telegram request failed"
      };
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        reason: "telegram_delivery_failed",
        error: `Telegram API responded with ${response.status}`,
        details: errorText
      };
    }
  }

  return { ok: true };
}
