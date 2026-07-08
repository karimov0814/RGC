// ============================================================
//  Filial Feedback Mini App — frontend logikasi
// ============================================================

const API_BASE = "https://rgc.up.railway.app";// <-- backend manzilini shu yerga qo'ying

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const initData = tg.initData; // backendga validatsiya uchun yuboriladi

// ============================================================
//  Chiziqli (line) ikonkalar — minimalist dizayn uchun yagona
//  manba. Barcha ikonkalar bir xil stroke-width bilan chiziladi.
// ============================================================
const ICONS = {
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19 3 20l1-4Z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4.8c0-.44.36-.8.8-.8h4.4c.44 0 .8.36.8.8V7"/><path d="M6 7l1 12.2c.05.98.86 1.8 1.85 1.8h6.3c.99 0 1.8-.82 1.85-1.8L18 7"/><path d="M10 11v6M14 11v6"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.63A10.9 10.9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15.8 15.8 0 0 1-3.15 3.99M6.5 6.87C4.06 8.5 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.3 0 2.47-.31 3.5-.8"/><path d="M9.5 9.6a2.6 2.6 0 0 0 3.6 3.55"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4.5 4.5L19 8"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.2c0-.66.54-1.2 1.2-1.2h2.1l1-1.6c.2-.32.55-.5.92-.5h5.56c.37 0 .72.18.92.5l1 1.6h2.1c.66 0 1.2.54 1.2 1.2v10.6c0 .66-.54 1.2-1.2 1.2H5.2c-.66 0-1.2-.54-1.2-1.2Z"/><circle cx="12" cy="13" r="3.4"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.8"/><path d="M19.4 13.5a1.8 1.8 0 0 0 .36 1.98l.06.06a2.16 2.16 0 1 1-3.06 3.06l-.06-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.65V20a2.16 2.16 0 1 1-4.32 0v-.1a1.8 1.8 0 0 0-1.18-1.65 1.8 1.8 0 0 0-1.98.36l-.06.06a2.16 2.16 0 1 1-3.06-3.06l.06-.06a1.8 1.8 0 0 0 .36-1.98 1.8 1.8 0 0 0-1.65-1.1H2a2.16 2.16 0 1 1 0-4.32h.1a1.8 1.8 0 0 0 1.65-1.18 1.8 1.8 0 0 0-.36-1.98l-.06-.06A2.16 2.16 0 1 1 6.4 3.15l.06.06a1.8 1.8 0 0 0 1.98.36h.09A1.8 1.8 0 0 0 9.63 1.9V1.8a2.16 2.16 0 1 1 4.32 0v.1a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 1.98-.36l.06-.06a2.16 2.16 0 1 1 3.06 3.06l-.06.06a1.8 1.8 0 0 0-.36 1.98v.09c.28.72.94 1.22 1.72 1.24h.1a2.16 2.16 0 1 1 0 4.32h-.1a1.8 1.8 0 0 0-1.65 1.1Z"/></svg>`,
  block: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8.5"/><path d="M6.2 6.2l11.6 11.6" stroke-linecap="round"/></svg>`,
  crown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8l3.2 3.2L12 6l4.8 5.2L20 8l-1.4 9.5H5.4Z"/><path d="M5.4 20h13.2"/></svg>`,
};

function iconMarkup(name) {
  return `<span class="icon">${ICONS[name] || ""}</span>`;
}

// Statik HTML ichidagi [data-icon] belgilangan joylarni to'ldiramiz
function renderStaticIcons() {
  document.querySelectorAll("[data-icon]").forEach((el) => {
    el.innerHTML = ICONS[el.dataset.icon] || "";
  });
}
renderStaticIcons();

// ---------- Holat (state) ----------
const state = {
  filial: null,     // {id, name}
  sections: [],      // [{id, name}]
  photos: {},         // section_id -> [{file, previewUrl, comment}, ...]
};

// ---------- Ekranlarni almashtirish ----------
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function showLoading(text) {
  document.getElementById("loading-text").textContent = text || "Yuklanmoqda...";
  document.getElementById("overlay-loading").classList.remove("hidden");
}
function hideLoading() {
  document.getElementById("overlay-loading").classList.add("hidden");
}

// ============================================================
//  Universal modal — Telegram Mini App WebView'larida
//  window.alert / confirm / prompt ko'p qurilmalarda (ayniqsa iOS)
//  bloklanadi yoki hech narsa ko'rsatmaydi, shu sabab tugma bosilganda
//  "hech narsa bo'lmayapti"day tuyulardi. Shu komponent ularning
//  o'rnini bosadi va har doim ishonchli ishlaydi.
// ============================================================
const modalOverlay = document.getElementById("modal-overlay");
const modalTitleEl = document.getElementById("modal-title");
const modalMessageEl = document.getElementById("modal-message");
const modalFieldsEl = document.getElementById("modal-fields");
const modalCancelBtn = document.getElementById("modal-cancel");
const modalConfirmBtn = document.getElementById("modal-confirm");

function closeModal() {
  modalOverlay.classList.add("hidden");
  modalFieldsEl.innerHTML = "";
}

/**
 * Umumiy modal ochuvchi. fields berilsa, forma sifatida ishlaydi va
 * confirm bosilganda field qiymatlari bilan resolve bo'ladi (yoki
 * bekor qilinsa null).
 */
function openModal({ title, message = "", fields = [], confirmText = "OK", cancelText = "Bekor qilish", danger = false, showCancel = true }) {
  return new Promise((resolve) => {
    modalTitleEl.textContent = title;
    modalMessageEl.textContent = message;
    modalFieldsEl.innerHTML = fields
      .map((f) => {
        if (f.type === "checkbox") {
          return `
            <label class="admin-checkbox">
              <input type="checkbox" id="modal-field-${f.id}" ${f.checked ? "checked" : ""} />
              ${f.label}
            </label>`;
        }
        return `
          <div>
            <label class="modal-field-label" for="modal-field-${f.id}">${f.label}</label>
            <input type="text" id="modal-field-${f.id}" class="admin-input" placeholder="${f.placeholder || ""}" value="${f.value ? String(f.value).replace(/"/g, "&quot;") : ""}" />
          </div>`;
      })
      .join("");

    modalConfirmBtn.textContent = confirmText;
    modalConfirmBtn.className = "primary-btn" + (danger ? " danger" : "");
    modalCancelBtn.style.display = showCancel ? "" : "none";
    modalCancelBtn.textContent = cancelText;

    modalOverlay.classList.remove("hidden");

    const firstInput = modalFieldsEl.querySelector('input[type="text"]');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);

    function cleanup() {
      modalConfirmBtn.onclick = null;
      modalCancelBtn.onclick = null;
      closeModal();
    }

    modalConfirmBtn.onclick = () => {
      const result = {};
      fields.forEach((f) => {
        const el = document.getElementById(`modal-field-${f.id}`);
        result[f.id] = f.type === "checkbox" ? el.checked : el.value.trim();
      });
      cleanup();
      resolve(fields.length ? result : true);
    };
    modalCancelBtn.onclick = () => {
      cleanup();
      resolve(null);
    };
  });
}

function showAlert(message, title = "Diqqat") {
  return openModal({ title, message, confirmText: "Tushunarli", showCancel: false });
}
function showConfirm(message, { title = "Tasdiqlang", confirmText = "Ha", danger = false } = {}) {
  return openModal({ title, message, confirmText, danger, showCancel: true }).then((r) => r === true);
}
function showPrompt({ title, fields, confirmText = "Saqlash" }) {
  return openModal({ title, fields, confirmText, showCancel: true });
}

// ---------- 0. Ruxsat tekshiruvi + 1. Filial tanlash (ilova ochilishi bilan) ----------
state.isSuperadmin = false;

async function loadFilials() {
  showLoading("Yuklanmoqda...");
  try {
    const res = await fetch(`${API_BASE}/api/config?init_data=${encodeURIComponent(initData)}`);

    if (res.status === 401 || res.status === 403) {
      // Ruxsat etilmagan (whitelist'da yo'q) yoki initData yaroqsiz foydalanuvchi
      hideLoading();
      showScreen("screen-blocked");
      return;
    }
    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    state.sections = data.sections;
    state.isSuperadmin = !!data.is_superadmin;

    const list = document.getElementById("filial-list");
    list.innerHTML = "";
    data.filials.forEach((f) => {
      const el = document.createElement("div");
      el.className = "filial-item";
      el.innerHTML = `<span>${f.name}</span><span class="arrow">${iconMarkup("chevron")}</span>`;
      el.addEventListener("click", () => selectFilial(f));
      list.appendChild(el);
    });

    hideLoading();

    if (state.isSuperadmin) {
      // Superadmin mini appni ochganda avval admin panel ochiladi
      document.getElementById("admin-back-bar").classList.remove("hidden");
      showScreen("screen-admin");
      loadAdminUsers();
      loadAdminFilials();
    } else {
      showScreen("screen-filial");
    }
  } catch (e) {
    hideLoading();
    await showAlert("Ma'lumotlarni yuklab bo'lmadi. Qayta urinib ko'ring.");
  }
}

function selectFilial(filial) {
  state.filial = filial;
  state.photos = {};
  document.getElementById("filial-name-title").textContent = filial.name;
  renderSections();
  showScreen("screen-sections");
}

// ---------- 2. Bo'limlar bo'yicha (bir nechta) rasm olish ----------
let activeSectionId = null;
const cameraInput = document.getElementById("camera-input");

function renderSections() {
  const list = document.getElementById("section-list");
  list.innerHTML = "";

  state.sections.forEach((sec) => {
    if (!state.photos[sec.id]) state.photos[sec.id] = [];

    const card = document.createElement("div");
    card.className = "section-card";
    card.id = `section-${sec.id}`;
    list.appendChild(card);

    renderSectionCard(sec.id);
  });

  updateProgress();
  attachMainButton();
}

function renderSectionCard(sectionId) {
  const sec = state.sections.find((s) => s.id === sectionId);
  const photos = state.photos[sectionId];
  const card = document.getElementById(`section-${sectionId}`);
  const isDone = photos.length > 0;

  card.classList.toggle("done", isDone);

  const thumbsHtml = photos
    .map(
      (p, idx) => `
      <div class="photo-thumb-wrap">
        <img class="photo-preview" src="${p.previewUrl}" />
        <button class="remove-photo-btn" data-section-id="${sectionId}" data-idx="${idx}">${iconMarkup("close")}</button>
      </div>`
    )
    .join("");

  card.innerHTML = `
    <div class="section-top">
      <div class="section-title">
        <span class="section-status-icon">${isDone ? iconMarkup("check") : ""}</span>
        <span>${sec.name}</span>
      </div>
      <span class="photo-count">${photos.length > 0 ? photos.length + " ta rasm" : ""}</span>
    </div>
    <div class="photos-row">
      ${thumbsHtml}
      <button class="add-photo-btn" data-section-id="${sectionId}">
        ${iconMarkup("plus")}<span>Rasm qo'shish</span>
      </button>
    </div>
    ${isDone ? `<textarea class="comment-input" rows="2" placeholder="Izoh (ixtiyoriy)">${photos[0].comment || ""}</textarea>` : ""}
  `;

  card.querySelector(".add-photo-btn").addEventListener("click", () => {
    activeSectionId = sectionId;
    cameraInput.click();
  });

  card.querySelectorAll(".remove-photo-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx, 10);
      state.photos[sectionId].splice(idx, 1);
      renderSectionCard(sectionId);
      updateProgress();
      attachMainButton();
    });
  });

  const commentEl = card.querySelector(".comment-input");
  if (commentEl) {
    commentEl.addEventListener("input", (e) => {
      // Izoh butun bo'lim uchun umumiy (barcha rasmlarga bitta caption qo'shiladi)
      state.photos[sectionId].forEach((p) => (p.comment = e.target.value));
    });
  }
}

cameraInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length || activeSectionId === null) return;

  const existingComment = state.photos[activeSectionId][0]?.comment || "";
  files.forEach((file) => {
    state.photos[activeSectionId].push({
      file,
      previewUrl: URL.createObjectURL(file),
      comment: existingComment,
    });
  });

  renderSectionCard(activeSectionId);
  updateProgress();
  attachMainButton();

  cameraInput.value = ""; // qayta xuddi shu faylni tanlash imkonini saqlaydi
});

function updateProgress() {
  const total = state.sections.length;
  const done = state.sections.filter((s) => state.photos[s.id]?.length > 0).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("progress-fill").style.width = `${pct}%`;
  document.getElementById("progress-text").textContent = `${done} / ${total} bo'lim`;
}

function attachMainButton() {
  const total = state.sections.length;
  const done = state.sections.filter((s) => state.photos[s.id]?.length > 0).length;
  const allDone = total > 0 && done === total;

  tg.MainButton.setText("✅ Yuborish");
  if (allDone) {
    tg.MainButton.show();
    tg.MainButton.enable();
  } else {
    tg.MainButton.hide();
  }
}

tg.MainButton.onClick(async () => {
  await submitReport();
});

// ---------- 3. Yuborish ----------
async function submitReport() {
  showLoading("Yuborilmoqda...");
  tg.MainButton.showProgress();

  try {
    const formData = new FormData();
    formData.append("init_data", initData);
    formData.append("filial_id", state.filial.id);

    const meta = [];
    state.sections.forEach((sec) => {
      const photos = state.photos[sec.id] || [];
      photos.forEach((p) => {
        meta.push({ section_id: sec.id, section_name: sec.name, comment: p.comment });
        formData.append("files", p.file, `section_${sec.id}_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
      });
    });
    formData.append("items_meta", JSON.stringify(meta));

    const res = await fetch(`${API_BASE}/api/submit`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(await res.text());

    hideLoading();
    tg.MainButton.hideProgress();
    tg.MainButton.hide();
    showScreen("screen-success");
    tg.HapticFeedback.notificationOccurred("success");
  } catch (e) {
    hideLoading();
    tg.MainButton.hideProgress();
    tg.HapticFeedback.notificationOccurred("error");
    await showAlert("Yuborishda xatolik yuz berdi. Qayta urinib ko'ring.");
  }
}

document.getElementById("btn-close").addEventListener("click", () => tg.close());

// ============================================================
//  ADMIN PANEL (faqat superadmin uchun)
// ============================================================

// ---------- Tablar ----------
document.querySelectorAll(".admin-tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".admin-tab-content").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Admin panelga qaytish (hisobot rejimidan)
document.getElementById("btn-back-to-admin").addEventListener("click", () => {
  showScreen("screen-admin");
});
document.getElementById("btn-goto-report").addEventListener("click", () => {
  showScreen("screen-filial");
});

function adminForm(extraFields) {
  const fd = new FormData();
  fd.append("init_data", initData);
  Object.entries(extraFields).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

async function adminFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    let detail = "Xatolik yuz berdi";
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }
  return res.json();
}

// ---------- Userlar ----------
async function loadAdminUsers() {
  const list = document.getElementById("users-list");
  list.innerHTML = `<p class="hint">Yuklanmoqda...</p>`;
  try {
    const data = await adminFetch(`/api/admin/users?init_data=${encodeURIComponent(initData)}`);
    list.innerHTML = "";
    if (!data.users.length) {
      list.innerHTML = `<p class="hint">Hozircha foydalanuvchi yo'q</p>`;
      return;
    }
    data.users.forEach((u) => {
      const el = document.createElement("div");
      el.className = "admin-list-item";
      el.innerHTML = `
        <div class="admin-list-main">
          <div class="admin-list-title">${u.full_name || "Ism kiritilmagan"} ${u.is_superadmin ? `<span class="badge">${iconMarkup("crown")}</span>` : ""}</div>
          <div class="admin-list-sub">ID: ${u.telegram_user_id}</div>
        </div>
        <div class="admin-list-actions">
          <button class="icon-btn" data-action="edit" aria-label="Tahrirlash">${iconMarkup("edit")}</button>
          <button class="icon-btn danger" data-action="delete" aria-label="O'chirish">${iconMarkup("trash")}</button>
        </div>
      `;
      el.querySelector('[data-action="edit"]').addEventListener("click", () => editUser(u));
      el.querySelector('[data-action="delete"]').addEventListener("click", () => deleteUser(u));
      list.appendChild(el);
    });
  } catch (e) {
    list.innerHTML = `<p class="hint">Yuklashda xatolik: ${e.message}</p>`;
  }
}

document.getElementById("btn-add-user").addEventListener("click", async () => {
  const idInput = document.getElementById("new-user-id");
  const nameInput = document.getElementById("new-user-name");
  const saCheckbox = document.getElementById("new-user-superadmin");

  const telegramUserId = idInput.value.trim();
  if (!telegramUserId || !/^\d+$/.test(telegramUserId)) {
    await showAlert("Telegram user ID faqat raqamlardan iborat bo'lishi kerak");
    return;
  }

  showLoading("Qo'shilmoqda...");
  try {
    await adminFetch("/api/admin/users", {
      method: "POST",
      body: adminForm({
        telegram_user_id: telegramUserId,
        full_name: nameInput.value.trim(),
        is_superadmin: saCheckbox.checked,
      }),
    });
    idInput.value = "";
    nameInput.value = "";
    saCheckbox.checked = false;
    await loadAdminUsers();
  } catch (e) {
    await showAlert("Xatolik: " + e.message);
  } finally {
    hideLoading();
  }
});

async function editUser(u) {
  const result = await showPrompt({
    title: "Foydalanuvchini tahrirlash",
    confirmText: "Saqlash",
    fields: [
      { id: "full_name", label: "Ism", value: u.full_name || "" },
      { id: "is_superadmin", label: "Superadmin huquqi", type: "checkbox", checked: !!u.is_superadmin },
    ],
  });
  if (!result) return;

  showLoading("Saqlanmoqda...");
  try {
    await adminFetch(`/api/admin/users/${u.id}`, {
      method: "PUT",
      body: adminForm({ full_name: result.full_name, is_superadmin: result.is_superadmin }),
    });
    await loadAdminUsers();
  } catch (e) {
    await showAlert("Xatolik: " + e.message);
  } finally {
    hideLoading();
  }
}

async function deleteUser(u) {
  const ok = await showConfirm(`${u.full_name || u.telegram_user_id} o'chirilsinmi?`, {
    title: "Foydalanuvchini o'chirish",
    confirmText: "O'chirish",
    danger: true,
  });
  if (!ok) return;

  showLoading("O'chirilmoqda...");
  try {
    await adminFetch(`/api/admin/users/${u.id}?init_data=${encodeURIComponent(initData)}`, {
      method: "DELETE",
    });
    await loadAdminUsers();
  } catch (e) {
    await showAlert("Xatolik: " + e.message);
  } finally {
    hideLoading();
  }
}

// ---------- Filiallar ----------
async function loadAdminFilials() {
  const list = document.getElementById("filials-list");
  list.innerHTML = `<p class="hint">Yuklanmoqda...</p>`;
  try {
    const data = await adminFetch(`/api/admin/filials?init_data=${encodeURIComponent(initData)}`);
    list.innerHTML = "";
    if (!data.filials.length) {
      list.innerHTML = `<p class="hint">Hozircha filial yo'q</p>`;
      return;
    }
    data.filials.forEach((f) => {
      const el = document.createElement("div");
      el.className = "admin-list-item" + (f.is_active ? "" : " is-inactive");
      el.innerHTML = `
        <div class="admin-list-main">
          <div class="admin-list-title">${f.name} ${f.is_active ? "" : `<span class="badge-text">nofaol</span>`}</div>
          <div class="admin-list-sub">ID: ${f.id}</div>
        </div>
        <div class="admin-list-actions">
          <button class="icon-btn active-toggle ${f.is_active ? "" : "is-off"}" data-action="toggle" aria-label="${f.is_active ? "Nofaol qilish" : "Faollashtirish"}">${iconMarkup(f.is_active ? "eye" : "eyeOff")}</button>
          <button class="icon-btn" data-action="edit" aria-label="Tahrirlash">${iconMarkup("edit")}</button>
          <button class="icon-btn danger" data-action="delete" aria-label="O'chirish">${iconMarkup("trash")}</button>
        </div>
      `;
      el.querySelector('[data-action="toggle"]').addEventListener("click", () => toggleFilialActive(f));
      el.querySelector('[data-action="edit"]').addEventListener("click", () => editFilial(f));
      el.querySelector('[data-action="delete"]').addEventListener("click", () => deleteFilial(f));
      list.appendChild(el);
    });
  } catch (e) {
    list.innerHTML = `<p class="hint">Yuklashda xatolik: ${e.message}</p>`;
  }
}

document.getElementById("btn-add-filial").addEventListener("click", async () => {
  const nameInput = document.getElementById("new-filial-name");
  const name = nameInput.value.trim();
  if (!name) {
    await showAlert("Filial nomini kiriting");
    return;
  }

  showLoading("Qo'shilmoqda...");
  try {
    await adminFetch("/api/admin/filials", {
      method: "POST",
      body: adminForm({ name }),
    });
    nameInput.value = "";
    await loadAdminFilials();
  } catch (e) {
    await showAlert("Xatolik: " + e.message);
  } finally {
    hideLoading();
  }
});

async function editFilial(f) {
  const result = await showPrompt({
    title: "Filialni tahrirlash",
    confirmText: "Saqlash",
    fields: [{ id: "name", label: "Filial nomi", value: f.name }],
  });
  if (!result || !result.name) return;

  showLoading("Saqlanmoqda...");
  try {
    await adminFetch(`/api/admin/filials/${f.id}`, {
      method: "PUT",
      body: adminForm({ name: result.name, is_active: f.is_active }),
    });
    await loadAdminFilials();
  } catch (e) {
    await showAlert("Xatolik: " + e.message);
  } finally {
    hideLoading();
  }
}

// Ko'z icon: filialni butunlay o'chirmasdan, faqat foydalanuvchilarga
// ko'rinish/ko'rinmasligini boshqaradi (superadmin xohlagan payt qayta
// faollashtirishi mumkin).
async function toggleFilialActive(f) {
  const makingInactive = f.is_active;
  const ok = await showConfirm(
    makingInactive
      ? `"${f.name}" filiali endi ro'yxatlarda ko'rinmaydi. Bazada saqlanib qoladi va istalgan vaqt qaytarish mumkin.`
      : `"${f.name}" filiali qaytadan faol qilinsinmi va ro'yxatlarda ko'rinadigan bo'lsinmi?`,
    { title: makingInactive ? "Filialni nofaol qilish" : "Filialni faollashtirish", confirmText: makingInactive ? "Nofaol qilish" : "Faollashtirish" }
  );
  if (!ok) return;

  showLoading("Saqlanmoqda...");
  try {
    await adminFetch(`/api/admin/filials/${f.id}/active`, {
      method: "PUT",
      body: adminForm({ is_active: !makingInactive }),
    });
    await loadAdminFilials();
  } catch (e) {
    await showAlert("Xatolik: " + e.message);
  } finally {
    hideLoading();
  }
}

async function deleteFilial(f) {
  const ok = await showConfirm(
    `"${f.name}" filiali bazadan butunlay o'chiriladi. Bu amalni orqaga qaytarib bo'lmaydi. Filialni vaqtincha yashirish uchun o'rniga ko'z ikonkasidan foydalaning.`,
    { title: "Filialni butunlay o'chirish", confirmText: "Butunlay o'chirish", danger: true }
  );
  if (!ok) return;

  showLoading("O'chirilmoqda...");
  try {
    await adminFetch(`/api/admin/filials/${f.id}?init_data=${encodeURIComponent(initData)}`, {
      method: "DELETE",
    });
    await loadAdminFilials();
  } catch (e) {
    await showAlert("Xatolik: " + e.message);
  } finally {
    hideLoading();
  }
}

// ---------- Ishga tushirish ----------
loadFilials();
