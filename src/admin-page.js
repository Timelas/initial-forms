function escapeInlineJson(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
}

export function renderAdminPage(initialData = { sites: [], forms: [] }) {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Forms Admin</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <style>
      :root {
        --bg: #f5efe6;
        --panel: rgba(255, 251, 245, 0.9);
        --ink: #1f2937;
        --muted: #6b7280;
        --accent: #a33b20;
        --accent-soft: #e8b9a9;
        --line: rgba(31, 41, 55, 0.12);
        --ok: #1f6f4a;
        --error: #9f1d1d;
        --shadow: 0 20px 40px rgba(89, 54, 28, 0.12);
        --radius: 18px;
        --font: "Avenir Next", "Segoe UI", sans-serif;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: var(--font);
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(232, 185, 169, 0.55), transparent 28%),
          radial-gradient(circle at bottom right, rgba(163, 59, 32, 0.16), transparent 30%),
          linear-gradient(135deg, #f8f4ec, #efe1d0 55%, #f6eee6);
      }
      .layout {
        display: grid;
        grid-template-columns: 320px 1fr;
        min-height: 100vh;
      }
      .sidebar, .content {
        padding: 24px;
      }
      .sidebar {
        border-right: 1px solid var(--line);
        background: rgba(255, 248, 240, 0.75);
        backdrop-filter: blur(10px);
      }
      .brand {
        margin-bottom: 18px;
      }
      .brand h1 {
        margin: 0;
        font-size: 28px;
        letter-spacing: 0.02em;
      }
      .brand h1 span {
        display: block;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--accent);
        margin-bottom: 6px;
      }
      .brand p, .muted {
        color: var(--muted);
      }
      .panel {
        background: var(--panel);
        border: 1px solid rgba(255, 255, 255, 0.55);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
      }
      .site-list, .form-list {
        display: grid;
        gap: 12px;
      }
      .site-card, .form-card {
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 14px;
        background: white;
        cursor: pointer;
      }
      .site-card.active, .form-card.active {
        border-color: var(--accent);
        box-shadow: inset 0 0 0 1px var(--accent);
      }
      .content-grid {
        display: grid;
        gap: 20px;
      }
      .toolbar, .grid-2 {
        display: grid;
        gap: 12px;
      }
      .grid-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      input, textarea, select, button {
        width: 100%;
        font: inherit;
      }
      input, textarea, select {
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 12px;
        background: rgba(255,255,255,0.92);
      }
      textarea {
        min-height: 110px;
        resize: vertical;
      }
      button {
        border: 0;
        border-radius: 999px;
        padding: 12px 16px;
        background: var(--accent);
        color: white;
        cursor: pointer;
        transition: opacity 0.18s ease, transform 0.18s ease;
      }
      button:hover {
        transform: translateY(-1px);
      }
      button:disabled {
        cursor: wait;
        opacity: 0.6;
        transform: none;
      }
      button.secondary {
        background: #ead9ce;
        color: var(--ink);
      }
      button.ghost {
        background: transparent;
        color: var(--accent);
        border: 1px solid var(--accent-soft);
      }
      .row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .row > * {
        flex: 1 1 180px;
      }
      .section {
        padding: 18px;
      }
      .section h2, .section h3 {
        margin-top: 0;
      }
      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
      }
      .section-head h2, .section-head h3 {
        margin: 0;
      }
      .hint {
        margin: 8px 0 0;
        line-height: 1.45;
      }
      .card-empty {
        padding: 18px;
        border: 1px dashed var(--line);
        border-radius: 14px;
        color: var(--muted);
        background: rgba(255, 255, 255, 0.4);
      }
      pre {
        margin: 0;
        padding: 14px;
        overflow: auto;
        background: #201b17;
        color: #f5efe6;
        border-radius: 14px;
      }
      .status {
        padding: 12px 14px;
        border-radius: 12px;
        display: none;
      }
      .status.ok {
        display: block;
        background: rgba(31, 111, 74, 0.12);
        color: var(--ok);
      }
      .status.error {
        display: block;
        background: rgba(159, 29, 29, 0.12);
        color: var(--error);
      }
      .field-table {
        display: grid;
        gap: 10px;
      }
      .field-row {
        display: grid;
        gap: 10px;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.84);
      }
      .field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .field-row label {
        display: grid;
        gap: 6px;
      }
      .field-flags {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
      }
      .field-flags label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .field-flags input {
        width: auto;
      }
      .field-actions {
        display: flex;
        justify-content: flex-end;
      }
      .field-actions button {
        width: auto;
        min-width: 160px;
      }
      .inline-code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 12px;
      }
      .tiny {
        font-size: 12px;
      }
      @media (max-width: 980px) {
        .layout {
          grid-template-columns: 1fr;
        }
        .sidebar {
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }
        .section-head {
          flex-direction: column;
          align-items: stretch;
        }
        .grid-2, .field-grid {
          grid-template-columns: 1fr;
        }
        .field-actions button {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <h1><span>Панель управления</span>Forms Admin</h1>
          <p>Сайты, формы и Telegram-маршрутизация в одном месте.</p>
        </div>
        <div class="panel section">
          <div class="row">
            <button id="newSiteBtn">Новый сайт</button>
            <button id="refreshBtn" class="secondary">Обновить</button>
          </div>
        </div>
        <div class="site-list" id="siteList"></div>
      </aside>
      <main class="content">
        <div id="status" class="status"></div>
        <div class="content-grid">
          <section class="panel section">
            <div class="section-head">
              <h2>Сайт</h2>
            </div>
            <div class="grid-2">
              <label><span class="tiny">Название сайта</span><input id="siteName" placeholder="Например: Karina" /></label>
            </div>
            <p class="muted tiny hint">Фронтенд всегда отправляет формы на backend: <strong>https://initial-forms.ru</strong></p>
            <label><span class="tiny">Домены сайта, по одному на строку</span><textarea id="siteDomains" placeholder="https://site.ru&#10;https://www.site.ru"></textarea></label>
            <div class="row">
              <button id="saveSiteBtn">Сохранить сайт</button>
              <button id="deleteSiteBtn" class="ghost">Удалить сайт</button>
            </div>
          </section>

          <section class="panel section">
            <div class="section-head">
              <h2>Формы</h2>
              <button id="newFormBtn" class="secondary">Новая форма</button>
            </div>
            <div class="form-list" id="formList"></div>
          </section>

          <section class="panel section">
            <div class="section-head">
              <h2>Форма</h2>
            </div>
            <div class="grid-2">
              <label><span class="tiny">Название формы</span><input id="formTitle" placeholder="Например: Попап-аудит" /></label>
            </div>
            <label><span class="tiny">Разрешенные домены для отправки, по одному на строку</span><textarea id="formOrigins" placeholder="Обычно совпадают с доменами сайта"></textarea></label>
            <div class="grid-2">
              <label><span class="tiny">Переменная окружения с токеном Telegram</span><input id="tokenEnvKey" placeholder="TG_DEFAULT_BOT_TOKEN" /></label>
              <label><span class="tiny">Переменные окружения с chat id, через запятую</span><input id="chatEnvKeys" placeholder="TG_DEFAULT_CHAT_ID" /></label>
              <label><span class="tiny">Антиспам включен</span><select id="antiSpamEnabled"><option value="true">Да</option><option value="false">Нет</option></select></label>
              <label><span class="tiny">Использовать Turnstile</span><select id="turnstileEnabled"><option value="false">Нет</option><option value="true">Да</option></select></label>
              <label><span class="tiny">Скрытое honeypot-поле</span><input id="honeypotField" value="website" /></label>
              <label><span class="tiny">Минимальное время заполнения, мс</span><input id="minFillTimeMs" value="1500" inputmode="numeric" /></label>
            </div>
            <div class="row">
              <label><span class="tiny">Окно rate limit, мс</span><input id="rateWindowMs" value="60000" inputmode="numeric" /></label>
              <label><span class="tiny">Лимит заявок в окне</span><input id="rateMax" value="5" inputmode="numeric" /></label>
            </div>
            <div class="section-head">
              <h3>Поля формы</h3>
              <button id="addFieldBtn" class="secondary">Добавить поле</button>
            </div>
            <p class="muted tiny hint">Здесь задается, какие поля приходят с фронтенда и как они будут называться в Telegram.</p>
            <div id="fieldTable" class="field-table"></div>
            <div class="row">
              <button id="saveFormBtn">Сохранить форму</button>
              <button id="deleteFormBtn" class="ghost">Удалить форму</button>
            </div>
          </section>

          <section class="panel section">
            <div class="section-head">
              <h2>Что передать фронту</h2>
            </div>
            <div class="row">
              <button id="copyEndpointBtn" class="secondary">Скопировать endpoint</button>
              <button id="copyJsBtn" class="secondary">Скопировать JS-пример</button>
            </div>
            <pre id="endpointPreview"></pre>
            <pre id="jsPreview"></pre>
          </section>
        </div>
      </main>
    </div>
    <script>
      const BACKEND_BASE_URL = "https://initial-forms.ru";
      const INITIAL_DATA = ${escapeInlineJson(initialData)};

      const state = {
        sites: Array.isArray(INITIAL_DATA.sites) ? INITIAL_DATA.sites : [],
        forms: Array.isArray(INITIAL_DATA.forms) ? INITIAL_DATA.forms : [],
        selectedSiteId: null,
        selectedFormKey: null
      };

      const els = {
        siteList: document.getElementById("siteList"),
        formList: document.getElementById("formList"),
        status: document.getElementById("status"),
        endpointPreview: document.getElementById("endpointPreview"),
        jsPreview: document.getElementById("jsPreview")
      };

      const ids = [
        "siteName","siteDomains",
        "formTitle","formOrigins",
        "tokenEnvKey","chatEnvKeys","antiSpamEnabled","turnstileEnabled","honeypotField","minFillTimeMs","rateWindowMs","rateMax"
      ];

      const formInputs = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
      const defaultContentTypes = [
        "application/json",
        "application/x-www-form-urlencoded",
        "multipart/form-data"
      ];
      const apiTimeoutMs = 15000;

      function showStatus(message, isError = false) {
        els.status.textContent = message;
        els.status.className = "status " + (isError ? "error" : "ok");
      }

      function clearStatus() {
        els.status.className = "status";
        els.status.textContent = "";
      }

      function setButtonBusy(button, busy, busyText = "Сохраняем...") {
        if (!button) {
          return;
        }
        if (!button.dataset.defaultText) {
          button.dataset.defaultText = button.textContent;
        }
        button.disabled = busy;
        button.textContent = busy ? busyText : button.dataset.defaultText;
      }

      async function runWithButton(button, action, busyText) {
        setButtonBusy(button, true, busyText);
        try {
          return await action();
        } finally {
          setButtonBusy(button, false);
        }
      }

      async function api(path, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), apiTimeoutMs);
        let response;
        try {
          response = await fetch(path, {
            headers: { Accept: "application/json", ...(options.headers || {}) },
            ...options,
            signal: controller.signal
          });
        } catch (error) {
          clearTimeout(timeoutId);
          if (error.name === "AbortError") {
            throw new Error("Сервер долго отвечает. Попробуйте обновить страницу.");
          }
          throw new Error("Ошибка сети. Попробуйте еще раз.");
        }
        clearTimeout(timeoutId);
        if (response.status === 401) {
          window.location.href = "/admin";
          throw new Error("Сессия истекла. Войдите заново.");
        }
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Не удалось выполнить запрос.");
        }
        return data;
      }

      function lines(value) {
        return value.split("\\n").map((line) => line.trim()).filter(Boolean);
      }

      function csv(value) {
        return value.split(",").map((line) => line.trim()).filter(Boolean);
      }

      function slugify(value) {
        return String(value || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")
          .replace(/_+/g, "_");
      }

      function uniqueSlug(base, existingValues, currentValue = "") {
        const seed = base || "item";
        const taken = new Set(existingValues.filter(Boolean));
        if (currentValue) {
          taken.delete(currentValue);
        }
        if (!taken.has(seed)) {
          return seed;
        }
        let index = 2;
        while (taken.has(seed + "_" + index)) {
          index += 1;
        }
        return seed + "_" + index;
      }

      function getSelectedSite() {
        return state.sites.find((site) => site.siteId === state.selectedSiteId) || null;
      }

      function getSelectedForm() {
        return state.forms.find((form) => form.formKey === state.selectedFormKey) || null;
      }

      function renderSites() {
        els.siteList.innerHTML = "";
        if (state.sites.length === 0) {
          els.siteList.innerHTML = "<div class='card-empty'>Сайтов пока нет. Создайте первый сайт.</div>";
          return;
        }
        for (const site of state.sites) {
          const node = document.createElement("div");
          const siteLabel = site.frontendDomains?.[0] || site.siteId;
          node.className = "site-card" + (site.siteId === state.selectedSiteId ? " active" : "");
          node.innerHTML = "<strong>" + site.name + "</strong><div class='muted tiny inline-code'>" + siteLabel + "</div>";
          node.onclick = () => {
            state.selectedSiteId = site.siteId;
            const siteForms = state.forms.filter((form) => form.siteId === site.siteId);
            state.selectedFormKey = siteForms[0]?.formKey || null;
            renderSiteEditor();
            renderForms();
            renderFormEditor();
          };
          els.siteList.appendChild(node);
        }
      }

      function renderForms() {
        const site = getSelectedSite();
        els.formList.innerHTML = "";
        const forms = site ? state.forms.filter((form) => form.siteId === site.siteId) : [];
        if (!site) {
          els.formList.innerHTML = "<div class='card-empty'>Сначала выберите или создайте сайт.</div>";
          return;
        }
        if (forms.length === 0) {
          els.formList.innerHTML = "<div class='card-empty'>У этого сайта пока нет форм.</div>";
          return;
        }
        for (const form of forms) {
          const node = document.createElement("div");
          node.className = "form-card" + (form.formKey === state.selectedFormKey ? " active" : "");
          node.innerHTML = "<strong>" + form.title + "</strong><div class='muted tiny inline-code'>" + form.formKey + "</div>";
          node.onclick = () => {
            state.selectedFormKey = form.formKey;
            renderFormEditor();
          };
          els.formList.appendChild(node);
        }
      }

      function renderSiteEditor() {
        const site = getSelectedSite();
        formInputs.siteName.value = site?.name || "";
        formInputs.siteDomains.value = (site?.frontendDomains || []).join("\\n");
      }

      function renderFieldRows(fields) {
        const root = document.getElementById("fieldTable");
        root.innerHTML = "";
        fields.forEach((field) => root.appendChild(createFieldRow(field)));
      }

      function createFieldRow(field = {}) {
        const row = document.createElement("div");
        row.className = "field-row";
        row.innerHTML = [
          "<div class='field-grid'>",
          "<label><span class='tiny'>Техническое имя поля</span><input placeholder='name' data-key='name' value='" + escapeAttr(field.name || "") + "'></label>",
          "<label><span class='tiny'>Название в Telegram</span><input placeholder='Имя' data-key='label' value='" + escapeAttr(field.label || "") + "'></label>",
          "<label><span class='tiny'>Доп. имена с фронта, через запятую</span><input placeholder='f-name, user_name' data-key='aliases' value='" + escapeAttr((field.aliases || []).join(", ")) + "'></label>",
          "<label><span class='tiny'>Тип поля</span><select data-key='type'>" + renderFieldTypeOptions(field.type || "text") + "</select></label>",
          "</div>",
          "<div class='field-flags'>",
          "<label><input type='checkbox' data-key='required'" + (field.required ? " checked" : "") + ">Обязательное поле</label>",
          "<label><input type='checkbox' data-key='omit'" + (field.omit ? " checked" : "") + ">Не отправлять в Telegram</label>",
          "</div>",
          "<div class='field-actions'><button type='button' class='ghost' data-action='remove-field'>Удалить поле</button></div>"
        ].join("");
        row.querySelector("[data-action='remove-field']").onclick = () => {
          row.remove();
          renderPreview();
        };
        row.querySelectorAll("input, select").forEach((input) => {
          input.addEventListener("input", renderPreview);
          input.addEventListener("change", renderPreview);
        });
        return row;
      }

      function escapeAttr(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll('"', "&quot;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;");
      }

      function renderFieldTypeOptions(selectedType) {
        return [
          ["text", "Текст"],
          ["tel", "Телефон"],
          ["email", "Email"],
          ["textarea", "Большой текст"],
          ["checkbox", "Чекбокс"]
        ].map(([value, label]) => {
          const selected = value === selectedType ? " selected" : "";
          return "<option value='" + value + "'" + selected + ">" + label + "</option>";
        }).join("");
      }

      function parseFieldRows() {
        return [...document.querySelectorAll(".field-row")].map((row) => {
          const values = Object.fromEntries(
            [...row.querySelectorAll("input, select")].map((input) => {
              const value = input.type === "checkbox" ? input.checked : input.value.trim();
              return [input.dataset.key, value];
            })
          );
          return {
            name: values.name,
            label: values.label || values.name,
            aliases: csv(values.aliases),
            type: values.type || "text",
            required: Boolean(values.required),
            omit: Boolean(values.omit),
            map: values.name
          };
        }).filter((field) => field.name);
      }

      function renderFormEditor() {
        const form = getSelectedForm();
        formInputs.formTitle.value = form?.title || "";
        formInputs.formOrigins.value = (form?.allowedOrigins || []).join("\\n");
        formInputs.tokenEnvKey.value = form?.telegramConfig?.tokenEnvKey || "";
        formInputs.chatEnvKeys.value = (form?.telegramConfig?.chatEnvKeys || []).join(", ");
        formInputs.antiSpamEnabled.value = String(form?.antiSpamConfig?.enabled ?? true);
        formInputs.turnstileEnabled.value = String(form?.antiSpamConfig?.turnstile ?? false);
        formInputs.honeypotField.value = form?.antiSpamConfig?.honeypotField || "website";
        formInputs.minFillTimeMs.value = String(form?.antiSpamConfig?.minFillTimeMs ?? 1500);
        formInputs.rateWindowMs.value = String(form?.antiSpamConfig?.rateLimit?.windowMs ?? 60000);
        formInputs.rateMax.value = String(form?.antiSpamConfig?.rateLimit?.max ?? 5);
        renderFieldRows(form?.fields || []);
        renderPreview();
      }

      function renderPreview() {
        const site = getSelectedSite();
        const currentForm = getSelectedForm();
        const generatedFormKey = uniqueSlug(
          slugify(formInputs.formTitle.value),
          state.forms.filter((form) => form.siteId === site?.siteId).map((form) => form.formKey),
          currentForm?.formKey || ""
        );
        const formKey = currentForm?.formKey || generatedFormKey;
        const endpoint = site && formKey ? BACKEND_BASE_URL + "/api/forms/" + formKey : "";
        els.endpointPreview.textContent = endpoint || "Выберите сайт и форму";
        const firstRequiredField = parseFieldRows().find((field) => field.required)?.name || "name";
        const secondField = parseFieldRows().find((field) => field.name !== firstRequiredField)?.name || "contact";
        els.jsPreview.textContent = endpoint ? [
          "fetch(\\"" + endpoint + "\\", {",
          "  method: \\"POST\\",",
          "  headers: {",
          "    \\"Accept\\": \\"application/json\\",",
          "    \\"Content-Type\\": \\"application/json\\",",
          "    \\"X-Requested-With\\": \\"XMLHttpRequest\\"",
          "  },",
          "  body: JSON.stringify({",
          "    " + firstRequiredField + ": \\"Иван\\",",
          "    " + secondField + ": \\"+79990000000\\",",
          "    submittedAt: Date.now() - 3000,",
          "    website: \\"\\"",
          "  })",
          "}).then((r) => r.json()).then(console.log);"
        ].join("\\n") : "Сохраните форму, чтобы получить готовый пример.";
      }

      async function loadData() {
        showStatus("Загружаем сайты и формы...");
        if (state.sites.length === 0 && state.forms.length === 0) {
          const bootstrap = await api("/api/admin/bootstrap");
          state.sites = bootstrap.sites;
          state.forms = bootstrap.forms;
        }
        if (!state.selectedSiteId && state.sites[0]) {
          state.selectedSiteId = state.sites[0].siteId;
        }
        if (!state.selectedFormKey) {
          const firstForm = state.forms.find((form) => form.siteId === state.selectedSiteId);
          state.selectedFormKey = firstForm?.formKey || null;
        }
        renderSites();
        renderSiteEditor();
        renderForms();
        renderFormEditor();
        clearStatus();
      }

      async function saveSite() {
        const siteName = formInputs.siteName.value.trim();
        const siteDomains = lines(formInputs.siteDomains.value);
        if (!siteName) {
          throw new Error("Укажите название сайта.");
        }
        if (siteDomains.length === 0) {
          throw new Error("Добавьте хотя бы один домен сайта.");
        }
        const currentSite = getSelectedSite();
        const generatedSiteId = uniqueSlug(
          slugify(siteName),
          state.sites.map((site) => site.siteId),
          currentSite?.siteId || ""
        );
        const payload = {
          siteId: currentSite?.siteId || generatedSiteId,
          name: siteName,
          status: "active",
          apiBaseUrl: BACKEND_BASE_URL,
          frontendDomains: siteDomains
        };
        const exists = state.sites.some((site) => site.siteId === payload.siteId);
        const path = exists ? "/api/admin/sites/" + encodeURIComponent(payload.siteId) : "/api/admin/sites";
        const method = exists ? "PUT" : "POST";
        await api(path, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        state.selectedSiteId = payload.siteId;
        await loadData();
        showStatus("Сайт сохранен.");
      }

      async function deleteSite() {
        const site = getSelectedSite();
        if (!site) return;
        if (!window.confirm("Удалить сайт и все его формы?")) {
          return;
        }
        await api("/api/admin/sites/" + encodeURIComponent(site.siteId), { method: "DELETE" });
        state.selectedSiteId = null;
        state.selectedFormKey = null;
        await loadData();
        showStatus("Сайт удален.");
      }

      async function saveForm() {
        const site = getSelectedSite();
        if (!site) throw new Error("Сначала выберите сайт.");
        const currentForm = getSelectedForm();
        const fields = parseFieldRows();
        const formTitle = formInputs.formTitle.value.trim();
        if (!formTitle) {
          throw new Error("Укажите название формы.");
        }
        if (fields.length === 0) {
          throw new Error("Добавьте хотя бы одно поле формы.");
        }
        const generatedFormKey = uniqueSlug(
          slugify(formTitle),
          state.forms.filter((form) => form.siteId === site.siteId).map((form) => form.formKey),
          currentForm?.formKey || ""
        );
        const payload = {
          formKey: currentForm?.formKey || generatedFormKey,
          siteId: site.siteId,
          title: formTitle,
          allowedOrigins: lines(formInputs.formOrigins.value).length > 0 ? lines(formInputs.formOrigins.value) : site.frontendDomains,
          aliases: Object.fromEntries(fields.map((field) => [field.name, field.aliases])),
          fields,
          requiredFields: fields.filter((field) => field.required).map((field) => field.map || field.name),
          acceptedContentTypes: defaultContentTypes,
          telegramConfig: {
            tokenEnvKey: formInputs.tokenEnvKey.value.trim(),
            chatEnvKeys: csv(formInputs.chatEnvKeys.value)
          },
          antiSpamConfig: {
            enabled: formInputs.antiSpamEnabled.value === "true",
            turnstile: formInputs.turnstileEnabled.value === "true",
            honeypotField: formInputs.honeypotField.value.trim(),
            minFillTimeMs: Number(formInputs.minFillTimeMs.value || 0),
            rateLimit: {
              windowMs: Number(formInputs.rateWindowMs.value || 60000),
              max: Number(formInputs.rateMax.value || 5)
            }
          },
          enabled: true
        };
        const exists = state.forms.some((form) => form.formKey === payload.formKey);
        const path = exists ? "/api/admin/forms/" + encodeURIComponent(payload.formKey) : "/api/admin/forms";
        const method = exists ? "PUT" : "POST";
        await api(path, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        state.selectedFormKey = payload.formKey;
        await loadData();
        showStatus("Форма сохранена.");
      }

      async function deleteForm() {
        const form = getSelectedForm();
        if (!form) return;
        if (!window.confirm("Удалить эту форму?")) {
          return;
        }
        await api("/api/admin/forms/" + encodeURIComponent(form.formKey), { method: "DELETE" });
        state.selectedFormKey = null;
        await loadData();
        showStatus("Форма удалена.");
      }

      document.getElementById("refreshBtn").onclick = loadData;
      document.getElementById("newSiteBtn").onclick = () => {
        state.selectedSiteId = null;
        state.selectedFormKey = null;
        renderSiteEditor();
        renderForms();
        renderFormEditor();
        showStatus("Новый сайт. Заполните поля и сохраните.");
      };
      document.getElementById("newFormBtn").onclick = () => {
        if (!getSelectedSite()) {
          showStatus("Сначала создайте или выберите сайт.", true);
          return;
        }
        state.selectedFormKey = null;
        renderFormEditor();
        renderFieldRows([]);
        formInputs.formOrigins.value = (getSelectedSite()?.frontendDomains || []).join("\\n");
        showStatus("Новая форма. Заполните поля и сохраните.");
      };
      document.getElementById("saveSiteBtn").onclick = () => runWithButton(
        document.getElementById("saveSiteBtn"),
        async () => saveSite().catch((error) => showStatus(error.message, true)),
        "Сохраняем сайт..."
      );
      document.getElementById("deleteSiteBtn").onclick = () => runWithButton(
        document.getElementById("deleteSiteBtn"),
        async () => deleteSite().catch((error) => showStatus(error.message, true)),
        "Удаляем сайт..."
      );
      document.getElementById("addFieldBtn").onclick = () => document.getElementById("fieldTable").appendChild(createFieldRow());
      document.getElementById("saveFormBtn").onclick = () => runWithButton(
        document.getElementById("saveFormBtn"),
        async () => saveForm().catch((error) => showStatus(error.message, true)),
        "Сохраняем форму..."
      );
      document.getElementById("deleteFormBtn").onclick = () => runWithButton(
        document.getElementById("deleteFormBtn"),
        async () => deleteForm().catch((error) => showStatus(error.message, true)),
        "Удаляем форму..."
      );
      document.getElementById("copyEndpointBtn").onclick = async () => {
        await navigator.clipboard.writeText(els.endpointPreview.textContent);
        showStatus("Endpoint скопирован");
      };
      document.getElementById("copyJsBtn").onclick = async () => {
        await navigator.clipboard.writeText(els.jsPreview.textContent);
        showStatus("JS пример скопирован");
      };
      ids.forEach((id) => formInputs[id].addEventListener("input", renderPreview));

      loadData().catch((error) => showStatus(error.message, true));
    </script>
  </body>
</html>`;
}

export function renderAdminLoginPage() {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Forms Admin Login</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <style>
      :root {
        --bg: #f5efe6;
        --panel: rgba(255, 251, 245, 0.94);
        --ink: #1f2937;
        --muted: #6b7280;
        --accent: #a33b20;
        --line: rgba(31, 41, 55, 0.12);
        --error: #9f1d1d;
        --shadow: 0 24px 60px rgba(89, 54, 28, 0.14);
        --radius: 22px;
        --font: "Avenir Next", "Segoe UI", sans-serif;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        font-family: var(--font);
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(232, 185, 169, 0.55), transparent 28%),
          radial-gradient(circle at bottom right, rgba(163, 59, 32, 0.16), transparent 30%),
          linear-gradient(135deg, #f8f4ec, #efe1d0 55%, #f6eee6);
      }
      .card {
        width: min(100%, 440px);
        background: var(--panel);
        border: 1px solid rgba(255, 255, 255, 0.6);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        padding: 28px;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 34px;
      }
      p {
        margin: 0 0 22px;
        color: var(--muted);
      }
      form {
        display: grid;
        gap: 14px;
      }
      label {
        display: grid;
        gap: 6px;
        font-size: 13px;
      }
      input, button {
        width: 100%;
        font: inherit;
      }
      input {
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 13px 14px;
        background: rgba(255, 255, 255, 0.95);
      }
      button {
        border: 0;
        border-radius: 999px;
        padding: 13px 16px;
        background: var(--accent);
        color: white;
        cursor: pointer;
        transition: opacity 0.18s ease;
      }
      button:disabled {
        cursor: wait;
        opacity: 0.6;
      }
      .error {
        min-height: 20px;
        color: var(--error);
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Forms Admin</h1>
      <p>Войдите, чтобы управлять сайтами, формами и Telegram routing.</p>
      <form id="loginForm">
        <label>
          <span>Логин</span>
          <input id="username" name="username" autocomplete="username" required />
        </label>
        <label>
          <span>Пароль</span>
          <input id="password" name="password" type="password" autocomplete="current-password" required />
        </label>
        <div id="error" class="error"></div>
        <button type="submit">Войти</button>
      </form>
    </main>
    <script>
      const form = document.getElementById("loginForm");
      const errorNode = document.getElementById("error");
      const submitButton = form.querySelector("button");
      const defaultButtonText = submitButton.textContent;

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        errorNode.textContent = "";
        submitButton.disabled = true;
        submitButton.textContent = "Входим...";

        try {
          const payload = {
            username: document.getElementById("username").value.trim(),
            password: document.getElementById("password").value
          };

          const response = await fetch("/api/admin/login", {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            errorNode.textContent = data.error || "Не удалось войти";
            return;
          }

          window.location.href = "/admin";
        } catch {
          errorNode.textContent = "Ошибка сети или сервера. Попробуйте еще раз.";
        } finally {
          submitButton.disabled = false;
          submitButton.textContent = defaultButtonText;
        }
      });
    </script>
  </body>
</html>`;
}
