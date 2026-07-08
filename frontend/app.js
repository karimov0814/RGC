// ============================================================
//  Filial Feedback Mini App — frontend logikasi
// ============================================================

const API_BASE = "https://rgc.up.railway.app";// <-- backend manzilini shu yerga qo'ying

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const initData = tg.initData; // backendga validatsiya uchun yuboriladi

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
      el.innerHTML = `<span>${f.name}</span><span class="arrow">›</span>`;
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
    alert("Ma'lumotlarni yuklab bo'lmadi. Qayta urinib ko'ring.");
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
        <button class="remove-photo-btn" data-section-id="${sectionId}" data-idx="${idx}">×</button>
      </div>`
    )
    .join("");

  card.innerHTML = `
    <div class="section-top">
      <div class="section-title">
        <span class="section-status-icon">${isDone ? "✅" : "⬜"}</span>
        <span>${sec.name}</span>
      </div>
      <span class="photo-count">${photos.length > 0 ? photos.length + " ta rasm" : ""}</span>
    </div>
    <div class="photos-row">
      ${thumbsHtml}
      <button class="add-photo-btn" data-section-id="${sectionId}">
        <span>➕</span><span>Rasm qo'shish</span>
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
    alert("Yuborishda xatolik yuz berdi. Qayta urinib ko'ring.");
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
          <div class="admin-list-title">${u.full_name || "Ism kiritilmagan"} ${u.is_superadmin ? "👑" : ""}</div>
          <div class="admin-list-sub">ID: ${u.telegram_user_id}</div>
        </div>
        <div class="admin-list-actions">
          <button class="icon-btn" data-action="edit">✏️</button>
          <button class="icon-btn danger" data-action="delete">🗑️</button>
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
    alert("Telegram user ID faqat raqamlardan iborat bo'lishi kerak");
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
    alert("Xatolik: " + e.message);
  } finally {
    hideLoading();
  }
});

async function editUser(u) {
  const newName = prompt("Ism:", u.full_name || "");
  if (newName === null) return;
  const wantsSuperadmin = confirm("Superadmin huquqi berilsinmi? (OK = ha, Bekor qilish = yo'q)");

  showLoading("Saqlanmoqda...");
  try {
    await adminFetch(`/api/admin/users/${u.id}`, {
      method: "PUT",
      body: adminForm({ full_name: newName, is_superadmin: wantsSuperadmin }),
    });
    await loadAdminUsers();
  } catch (e) {
    alert("Xatolik: " + e.message);
  } finally {
    hideLoading();
  }
}

async function deleteUser(u) {
  if (!confirm(`${u.full_name || u.telegram_user_id} o'chirilsinmi?`)) return;
  showLoading("O'chirilmoqda...");
  try {
    await adminFetch(`/api/admin/users/${u.id}?init_data=${encodeURIComponent(initData)}`, {
      method: "DELETE",
    });
    await loadAdminUsers();
  } catch (e) {
    alert("Xatolik: " + e.message);
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
      el.className = "admin-list-item";
      el.innerHTML = `
        <div class="admin-list-main">
          <div class="admin-list-title">${f.name} ${f.is_active ? "" : "(faolsiz)"}</div>
          <div class="admin-list-sub">ID: ${f.id}</div>
        </div>
        <div class="admin-list-actions">
          <button class="icon-btn" data-action="edit">✏️</button>
          <button class="icon-btn danger" data-action="delete">🗑️</button>
        </div>
      `;
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
    alert("Filial nomini kiriting");
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
    alert("Xatolik: " + e.message);
  } finally {
    hideLoading();
  }
});

async function editFilial(f) {
  const newName = prompt("Filial nomi:", f.name);
  if (newName === null || !newName.trim()) return;

  showLoading("Saqlanmoqda...");
  try {
    await adminFetch(`/api/admin/filials/${f.id}`, {
      method: "PUT",
      body: adminForm({ name: newName.trim(), is_active: f.is_active }),
    });
    await loadAdminFilials();
  } catch (e) {
    alert("Xatolik: " + e.message);
  } finally {
    hideLoading();
  }
}

async function deleteFilial(f) {
  if (!confirm(`"${f.name}" filiali o'chirilsinmi?`)) return;
  showLoading("O'chirilmoqda...");
  try {
    await adminFetch(`/api/admin/filials/${f.id}?init_data=${encodeURIComponent(initData)}`, {
      method: "DELETE",
    });
    await loadAdminFilials();
  } catch (e) {
    alert("Xatolik: " + e.message);
  } finally {
    hideLoading();
  }
}

// ---------- Ishga tushirish ----------
loadFilials();
