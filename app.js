const CONFIG = {
  businessName: "Lustre",
  phone: "+353 21 555 0190",
  phoneHref: "tel:+353215550190",
  email: "book@lustre.ie",
  emailHref: "mailto:book@lustre.ie",
  hours: "Tue–Sat 9:00–18:00",
  year: new Date().getFullYear(),
  formspreeId: "",
  web3formsKey: ""
};

function applyConfig() {
  document.querySelectorAll("[data-cfg='phone']").forEach((el) => {
    el.textContent = CONFIG.phone;
    if (el.tagName === "A") el.href = CONFIG.phoneHref;
  });
  document.querySelectorAll("[data-cfg='email']").forEach((el) => {
    el.textContent = CONFIG.email;
    if (el.tagName === "A") el.href = CONFIG.emailHref;
  });
  document.querySelectorAll("[data-cfg='hours']").forEach((el) => {
    el.textContent = CONFIG.hours;
  });
  document.querySelectorAll("[data-cfg='year']").forEach((el) => {
    el.textContent = CONFIG.year;
  });
}

function initNav() {
  const btn = document.getElementById("menuBtn");
  const nav = document.getElementById("nav");
  if (!btn || !nav) return;
  const close = () => {
    nav.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  };
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 960) close();
  });
}

function setActive() {
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav a").forEach((link) => {
    const file = (link.getAttribute("href") || "").split("/").pop().toLowerCase();
    if (file === path || (path === "" && file === "index.html")) link.classList.add("is-active");
  });
}

async function sendLead(payload) {
  if (CONFIG.formspreeId) {
    const res = await fetch("https://formspree.io/f/" + CONFIG.formspreeId, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("fail");
    return;
  }
  if (CONFIG.web3formsKey) {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: CONFIG.web3formsKey, subject: "Lustre booking", ...payload })
    });
    const data = await res.json();
    if (!data.success) throw new Error("fail");
    return;
  }
  const key = "lustre-leads";
  const list = JSON.parse(localStorage.getItem(key) || "[]");
  list.push(payload);
  localStorage.setItem(key, JSON.stringify(list));
}

function bindForm() {
  const form = document.getElementById("bookForm");
  if (!form) return;
  const ok = document.getElementById("bookFormOk");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.querySelector("[name='name']");
    const phone = form.querySelector("[name='phone']");
    const pkg = form.querySelector("[name='package']");
    let valid = true;
    form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
    if (!name.value.trim()) { name.classList.add("is-invalid"); valid = false; }
    if (!phone.value.trim()) { phone.classList.add("is-invalid"); valid = false; }
    if (pkg && !pkg.value) valid = false;
    if (!valid) return;
    const btn = form.querySelector("[type='submit']");
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      await sendLead({
        name: name.value.trim(),
        phone: phone.value.trim(),
        email: (form.querySelector("[name='email']") || {}).value || "",
        package: pkg ? pkg.value : "",
        vehicle: (form.querySelector("[name='vehicle']") || {}).value || "",
        message: (form.querySelector("[name='message']") || {}).value || "",
        when: new Date().toISOString(),
        page: location.pathname
      });
      form.reset();
      if (ok) ok.classList.add("is-visible");
    } catch (err) {
      alert("Could not send — call " + CONFIG.phone);
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  });
}

function prefillPackage() {
  const select = document.querySelector("select[name='package']");
  if (!select) return;
  const q = new URLSearchParams(location.search).get("package");
  if (q && select.querySelector('option[value="' + q + '"]')) select.value = q;
}

document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  initNav();
  setActive();
  bindForm();
  prefillPackage();
});
