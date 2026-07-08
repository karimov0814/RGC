// ============================================================
//  Filial Feedback Mini App — frontend logikasi
// ============================================================

const API_BASE = "https://YOUR_BACKEND_DOMAIN"; // <-- backend manzilini shu yerga qo'ying

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const initData = tg.initData; // backendga validatsiya uchun yuboriladi

// ---------- Holat (state) ----------
const state = {
  role: null,          // "employee" | "guest"
  filial: null,        // {id, name}
  sections: [],         // [{id, name}]
  photos: {},            // section_id -> { file, previewUrl, comment }
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

// ---------- 1. Rol tanlash ----------
document.querySelectorAll(".role-card").forEach((btn) => {
  btn.addEventListener("click", async () => {
    state.role = btn.dataset.role;
    if (state.role === "guest") {
      await goToContactCheck();
    } else {
      await goToFilialSelection();
    }
  });
});

// ---------- 2. Mehmon uchun telefon tekshiruvi ----------
async function goToContactCheck() {
  showLoading("Tekshirilmoqda...");
  try {
    const res = await fetch(`${API_BASE}/api/contact-status?init_data=${encodeURIComponent(initData)}`);
    const data = await res.json();
    hideLoading();
    if (data.has_contact) {
      await goToFilialSelection();
    } else {
      showScreen("screen-contact");
    }
  } catch (e) {
    hideLoading();
    alert("Server bilan bog'lanishda xatolik. Qayta urinib ko'ring.");
  }
}

document.getElementById("btn-share-contact").addEventListener("click", () => {
  const hint = document.getElementById("contact-hint");
  if (tg.requestContact) {
    tg.requestContact((shared) => {
      if (shared) {
        hint.textContent = "Rahmat! Tasdiqlanmoqda...";
        // Bot tomonda kontakt saqlanishi uchun bir necha soniya kutamiz
        pollContactSaved();
      } else {
        hint.textContent = "Raqamni ulashish rad etildi. Davom etish uchun ulashish zarur.";
      }
    });
  } else {
    hint.textContent = "Iltimos, avval botga /start yozib, raqamingizni ulashing, so'ng qaytadan urinib ko'ring.";
  }
});

async function pollContactSaved(attempt = 0) {
  if (attempt > 10) {
    document.getElementById("contact-hint").textContent =
      "Hali tasdiqlanmadi. Iltimos, biroz kutib qaytadan urinib ko'ring.";
    return;
  }
  const res = await fetch(`${API_BASE}/api/contact-status?init_data=${encodeURIComponent(initData)}`);
  const data = await res.json();
  if (data.has_contact) {
    await goToFilialSelection();
  } else {
    setTimeout(() => pollContactSaved(attempt + 1), 1200);
  }
}

// ---------- 3. Filial tanlash ----------
async function goToFilialSelection() {
  showLoading("Yuklanmoqda...");
  try {
    const res = await fetch(`${API_BASE}/api/config?init_data=${encodeURIComponent(initData)}`);
    const data = await res.json();
    state.sections = data.sections;

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
    showScreen("screen-filial");
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

// ---------- 4. Bo'limlar bo'yicha rasm olish ----------
let activeSectionId = null;
const cameraInput = document.getElementById("camera-input");

function renderSections() {
  const list = document.getElementById("section-list");
  list.innerHTML = "";

  state.sections.forEach((sec) => {
    const card = document.createElement("div");
    card.className = "section-card";
    card.id = `section-${sec.id}`;

    card.innerHTML = `
      <div class="section-top">
        <div class="section-title">
          <span class="section-status-icon">⬜</span>
          <span>${sec.name}</span>
        </div>
      </div>
      <div class="section-photo-area">
        <button class="capture-btn" data-section-id="${sec.id}">📷 Rasmga olish</button>
      </div>
    `;

    card.querySelector(".capture-btn").addEventListener("click", () => {
      activeSectionId = sec.id;
      cameraInput.click();
    });

    list.appendChild(card);
  });

  updateProgress();
  attachMainButton();
}

cameraInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file || activeSectionId === null) return;

  const previewUrl = URL.createObjectURL(file);
  state.photos[activeSectionId] = {
    file,
    previewUrl,
    comment: state.photos[activeSectionId]?.comment || "",
  };
  renderSectionAsDone(activeSectionId);
  updateProgress();
  attachMainButton();

  cameraInput.value = ""; // qayta xuddi shu faylni tanlash imkonini saqlaydi
});

function renderSectionAsDone(sectionId) {
  const sec = state.sections.find((s) => s.id === sectionId);
  const card = document.getElementById(`section-${sectionId}`);
  const photo = state.photos[sectionId];

  card.classList.add("done");
  card.innerHTML = `
    <div class="section-top">
      <div class="section-title">
        <span class="section-status-icon">✅</span>
        <span>${sec.name}</span>
      </div>
    </div>
    <div class="section-photo-area">
      <img class="photo-preview" src="${photo.previewUrl}" />
      <div style="flex:1">
        <button class="capture-btn" data-section-id="${sectionId}" style="border-style:solid;">🔁 Qayta olish</button>
      </div>
    </div>
    <textarea class="comment-input" rows="2" placeholder="Izoh (ixtiyoriy)">${photo.comment}</textarea>
  `;

  card.querySelector(".capture-btn").addEventListener("click", () => {
    activeSectionId = sectionId;
    cameraInput.click();
  });

  card.querySelector(".comment-input").addEventListener("input", (e) => {
    state.photos[sectionId].comment = e.target.value;
  });
}

function updateProgress() {
  const total = state.sections.length;
  const done = Object.keys(state.photos).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById("progress-fill").style.width = `${pct}%`;
  document.getElementById("progress-text").textContent = `${done} / ${total} bo'lim`;
}

function attachMainButton() {
  const total = state.sections.length;
  const done = Object.keys(state.photos).length;
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

// ---------- 5. Yuborish ----------
async function submitReport() {
  showLoading("Yuborilmoqda...");
  tg.MainButton.showProgress();

  try {
    const formData = new FormData();
    formData.append("init_data", initData);
    formData.append("filial_id", state.filial.id);
    formData.append("role", state.role);

    const meta = [];
    state.sections.forEach((sec) => {
      const photo = state.photos[sec.id];
      if (photo) {
        meta.push({ section_id: sec.id, section_name: sec.name, comment: photo.comment });
        formData.append("files", photo.file, `section_${sec.id}.jpg`);
      }
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
