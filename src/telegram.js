function resolveEnvArray(keys = []) {
  return keys.map((key) => process.env[key]).filter(Boolean);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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
    `<b>${escapeHtml(form.title || form.formKey)}</b>`,
    `Site: ${escapeHtml(site?.name || form.siteId)}`,
    `Form key: ${escapeHtml(form.formKey)}`
  ];

  const body = Object.entries(fields).map(([key, value]) => {
    return `<b>${escapeHtml(key)}</b>: ${escapeHtml(value)}`;
  });

  const text = [...header, "", ...body].join("\n");

  for (const chatId of chatIds) {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML"
      })
    });

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
