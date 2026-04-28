export function renderAdminPage() {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Forms Admin</title>
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
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 8px;
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
        .grid-2, .field-row {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <h1>Forms Admin</h1>
          <p>Sites, forms, origins and Telegram routing in one place.</p>
        </div>
        <div class="panel section">
          <div class="row">
            <button id="newSiteBtn">New Site</button>
            <button id="refreshBtn" class="secondary">Refresh</button>
          </div>
        </div>
        <div class="site-list" id="siteList"></div>
      </aside>
      <main class="content">
        <div id="status" class="status"></div>
        <div class="content-grid">
          <section class="panel section">
            <h2>Site</h2>
            <div class="grid-2">
              <label><span class="tiny">Site ID</span><input id="siteId" /></label>
              <label><span class="tiny">Name</span><input id="siteName" /></label>
              <label><span class="tiny">Status</span><input id="siteStatus" value="active" /></label>
              <label><span class="tiny">API Base URL</span><input id="siteApiBaseUrl" /></label>
            </div>
            <label><span class="tiny">Frontend Domains, one per line</span><textarea id="siteDomains"></textarea></label>
            <label><span class="tiny">Notes</span><textarea id="siteNotes"></textarea></label>
            <div class="row">
              <button id="saveSiteBtn">Save Site</button>
              <button id="deleteSiteBtn" class="ghost">Delete Site</button>
            </div>
          </section>

          <section class="panel section">
            <div class="row">
              <h2 style="flex: 1 1 auto">Forms</h2>
              <button id="newFormBtn" class="secondary">New Form</button>
            </div>
            <div class="form-list" id="formList"></div>
          </section>

          <section class="panel section">
            <h2>Form</h2>
            <div class="grid-2">
              <label><span class="tiny">Form Key</span><input id="formKey" /></label>
              <label><span class="tiny">Title</span><input id="formTitle" /></label>
              <label><span class="tiny">Accepted Content Types</span><input id="formContentTypes" value="application/json, application/x-www-form-urlencoded, multipart/form-data" /></label>
              <label><span class="tiny">Enabled</span><select id="formEnabled"><option value="true">true</option><option value="false">false</option></select></label>
            </div>
            <label><span class="tiny">Allowed Origins, one per line</span><textarea id="formOrigins"></textarea></label>
            <label><span class="tiny">Required Fields, comma separated</span><input id="formRequiredFields" /></label>
            <div class="grid-2">
              <label><span class="tiny">Telegram tokenEnvKey</span><input id="tokenEnvKey" /></label>
              <label><span class="tiny">Telegram chatEnvKeys, comma separated</span><input id="chatEnvKeys" /></label>
              <label><span class="tiny">Anti-spam enabled</span><select id="antiSpamEnabled"><option value="true">true</option><option value="false">false</option></select></label>
              <label><span class="tiny">Turnstile</span><select id="turnstileEnabled"><option value="false">false</option><option value="true">true</option></select></label>
              <label><span class="tiny">Honeypot Field</span><input id="honeypotField" value="website" /></label>
              <label><span class="tiny">Min Fill Time, ms</span><input id="minFillTimeMs" value="1500" /></label>
            </div>
            <div class="row">
              <label><span class="tiny">Rate Limit Window, ms</span><input id="rateWindowMs" value="60000" /></label>
              <label><span class="tiny">Rate Limit Max</span><input id="rateMax" value="5" /></label>
            </div>
            <h3>Fields</h3>
            <div id="fieldTable" class="field-table"></div>
            <div class="row">
              <button id="addFieldBtn" class="secondary">Add Field</button>
              <button id="saveFormBtn">Save Form</button>
              <button id="deleteFormBtn" class="ghost">Delete Form</button>
            </div>
          </section>

          <section class="panel section">
            <h2>Frontend Preview</h2>
            <div class="row">
              <button id="copyEndpointBtn" class="secondary">Copy Endpoint</button>
              <button id="copyJsBtn" class="secondary">Copy JS Example</button>
            </div>
            <pre id="endpointPreview"></pre>
            <pre id="jsPreview"></pre>
          </section>
        </div>
      </main>
    </div>
    <script>
      const state = {
        sites: [],
        forms: [],
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
        "siteId","siteName","siteStatus","siteApiBaseUrl","siteDomains","siteNotes",
        "formKey","formTitle","formContentTypes","formEnabled","formOrigins","formRequiredFields",
        "tokenEnvKey","chatEnvKeys","antiSpamEnabled","turnstileEnabled","honeypotField","minFillTimeMs","rateWindowMs","rateMax"
      ];

      const formInputs = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));

      function showStatus(message, isError = false) {
        els.status.textContent = message;
        els.status.className = "status " + (isError ? "error" : "ok");
      }

      function clearStatus() {
        els.status.className = "status";
        els.status.textContent = "";
      }

      async function api(path, options = {}) {
        const response = await fetch(path, {
          headers: { Accept: "application/json", ...(options.headers || {}) },
          ...options
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Request failed");
        }
        return data;
      }

      function lines(value) {
        return value.split("\\n").map((line) => line.trim()).filter(Boolean);
      }

      function csv(value) {
        return value.split(",").map((line) => line.trim()).filter(Boolean);
      }

      function getSelectedSite() {
        return state.sites.find((site) => site.siteId === state.selectedSiteId) || null;
      }

      function getSelectedForm() {
        return state.forms.find((form) => form.formKey === state.selectedFormKey) || null;
      }

      function renderSites() {
        els.siteList.innerHTML = "";
        for (const site of state.sites) {
          const node = document.createElement("div");
          node.className = "site-card" + (site.siteId === state.selectedSiteId ? " active" : "");
          node.innerHTML = "<strong>" + site.name + "</strong><div class='muted tiny'>" + site.siteId + "</div>";
          node.onclick = () => {
            state.selectedSiteId = site.siteId;
            renderSiteEditor();
            renderForms();
          };
          els.siteList.appendChild(node);
        }
      }

      function renderForms() {
        const site = getSelectedSite();
        els.formList.innerHTML = "";
        const forms = site ? state.forms.filter((form) => form.siteId === site.siteId) : [];
        for (const form of forms) {
          const node = document.createElement("div");
          node.className = "form-card" + (form.formKey === state.selectedFormKey ? " active" : "");
          node.innerHTML = "<strong>" + form.title + "</strong><div class='muted tiny'>" + form.formKey + "</div>";
          node.onclick = () => {
            state.selectedFormKey = form.formKey;
            renderFormEditor();
          };
          els.formList.appendChild(node);
        }
      }

      function renderSiteEditor() {
        const site = getSelectedSite();
        formInputs.siteId.value = site?.siteId || "";
        formInputs.siteName.value = site?.name || "";
        formInputs.siteStatus.value = site?.status || "active";
        formInputs.siteApiBaseUrl.value = site?.apiBaseUrl || "";
        formInputs.siteDomains.value = (site?.frontendDomains || []).join("\\n");
        formInputs.siteNotes.value = site?.notes || "";
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
          "<input placeholder='name' data-key='name' value='" + (field.name || "") + "'>",
          "<input placeholder='label' data-key='label' value='" + (field.label || "") + "'>",
          "<input placeholder='aliases csv' data-key='aliases' value='" + ((field.aliases || []).join(", ")) + "'>",
          "<input placeholder='type' data-key='type' value='" + (field.type || "text") + "'>",
          "<input placeholder='map' data-key='map' value='" + (field.map || field.name || "") + "'>",
          "<input placeholder='required true/false, omit true/false' data-key='flags' value='" + [field.required ? "required" : "", field.omit ? "omit" : ""].filter(Boolean).join(", ") + "'>"
        ].join("");
        return row;
      }

      function parseFieldRows() {
        return [...document.querySelectorAll(".field-row")].map((row) => {
          const values = Object.fromEntries([...row.querySelectorAll("input")].map((input) => [input.dataset.key, input.value.trim()]));
          const flags = csv(values.flags);
          return {
            name: values.name,
            label: values.label || values.name,
            aliases: csv(values.aliases),
            type: values.type || "text",
            required: flags.includes("required"),
            omit: flags.includes("omit"),
            map: values.map || values.name
          };
        }).filter((field) => field.name);
      }

      function renderFormEditor() {
        const form = getSelectedForm();
        formInputs.formKey.value = form?.formKey || "";
        formInputs.formTitle.value = form?.title || "";
        formInputs.formContentTypes.value = (form?.acceptedContentTypes || []).join(", ");
        formInputs.formEnabled.value = String(form?.enabled ?? true);
        formInputs.formOrigins.value = (form?.allowedOrigins || []).join("\\n");
        formInputs.formRequiredFields.value = (form?.requiredFields || []).join(", ");
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
        const formKey = formInputs.formKey.value.trim();
        const endpoint = site && formKey ? site.apiBaseUrl.replace(/\\/$/, "") + "/api/forms/" + formKey : "";
        els.endpointPreview.textContent = endpoint || "Select a site and form";
        els.jsPreview.textContent = endpoint ? [
          "fetch(\\"" + endpoint + "\\", {",
          "  method: \\"POST\\",",
          "  headers: {",
          "    \\"Accept\\": \\"application/json\\",",
          "    \\"Content-Type\\": \\"application/json\\",",
          "    \\"X-Requested-With\\": \\"XMLHttpRequest\\"",
          "  },",
          "  body: JSON.stringify({ name: \\"Ivan\\", contact: \\"+79990000000\\", consent: \\"on\\" })",
          "}).then((r) => r.json()).then(console.log);"
        ].join("\\n") : "Select a site and form";
      }

      async function loadData() {
        clearStatus();
        const [sitesData, formsData] = await Promise.all([
          api("/api/admin/sites"),
          api("/api/admin/forms")
        ]);
        state.sites = sitesData.sites;
        state.forms = formsData.forms;
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
      }

      async function saveSite() {
        const payload = {
          siteId: formInputs.siteId.value.trim(),
          name: formInputs.siteName.value.trim(),
          status: formInputs.siteStatus.value.trim(),
          apiBaseUrl: formInputs.siteApiBaseUrl.value.trim(),
          frontendDomains: lines(formInputs.siteDomains.value),
          notes: formInputs.siteNotes.value.trim()
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
        showStatus("Site saved");
      }

      async function deleteSite() {
        const site = getSelectedSite();
        if (!site) return;
        await api("/api/admin/sites/" + encodeURIComponent(site.siteId), { method: "DELETE" });
        state.selectedSiteId = null;
        state.selectedFormKey = null;
        await loadData();
        showStatus("Site deleted");
      }

      async function saveForm() {
        const site = getSelectedSite();
        if (!site) throw new Error("Select a site first");
        const fields = parseFieldRows();
        const payload = {
          formKey: formInputs.formKey.value.trim(),
          siteId: site.siteId,
          title: formInputs.formTitle.value.trim(),
          allowedOrigins: lines(formInputs.formOrigins.value),
          aliases: Object.fromEntries(fields.map((field) => [field.name, field.aliases])),
          fields,
          requiredFields: csv(formInputs.formRequiredFields.value),
          acceptedContentTypes: csv(formInputs.formContentTypes.value),
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
          enabled: formInputs.formEnabled.value === "true"
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
        showStatus("Form saved");
      }

      async function deleteForm() {
        const form = getSelectedForm();
        if (!form) return;
        await api("/api/admin/forms/" + encodeURIComponent(form.formKey), { method: "DELETE" });
        state.selectedFormKey = null;
        await loadData();
        showStatus("Form deleted");
      }

      document.getElementById("refreshBtn").onclick = loadData;
      document.getElementById("newSiteBtn").onclick = () => {
        state.selectedSiteId = null;
        renderSiteEditor();
      };
      document.getElementById("newFormBtn").onclick = () => {
        state.selectedFormKey = null;
        renderFormEditor();
        renderFieldRows([]);
      };
      document.getElementById("saveSiteBtn").onclick = () => saveSite().catch((error) => showStatus(error.message, true));
      document.getElementById("deleteSiteBtn").onclick = () => deleteSite().catch((error) => showStatus(error.message, true));
      document.getElementById("addFieldBtn").onclick = () => document.getElementById("fieldTable").appendChild(createFieldRow());
      document.getElementById("saveFormBtn").onclick = () => saveForm().catch((error) => showStatus(error.message, true));
      document.getElementById("deleteFormBtn").onclick = () => deleteForm().catch((error) => showStatus(error.message, true));
      document.getElementById("copyEndpointBtn").onclick = async () => navigator.clipboard.writeText(els.endpointPreview.textContent);
      document.getElementById("copyJsBtn").onclick = async () => navigator.clipboard.writeText(els.jsPreview.textContent);
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

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        errorNode.textContent = "";

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
      });
    </script>
  </body>
</html>`;
}
