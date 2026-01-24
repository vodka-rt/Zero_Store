import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginCard = document.getElementById("loginCard");
const dash = document.getElementById("dash");
const btnLogout = document.getElementById("btnLogout");
const adminEmail = document.getElementById("adminEmail");
const siteNameTop = document.getElementById("siteName");

const email = document.getElementById("email");
const password = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");
const loginMsg = document.getElementById("loginMsg");

const siteNameInput = document.getElementById("siteNameInput");
const bannerUrlInput = document.getElementById("bannerUrlInput");
const themePrimaryInput = document.getElementById("themePrimaryInput");
const themeSecondaryInput = document.getElementById("themeSecondaryInput");

const pixKey = document.getElementById("pixKey");
const pixMessage = document.getElementById("pixMessage");
const btnSaveSettings = document.getElementById("btnSaveSettings");
const settingsMsg = document.getElementById("settingsMsg");

const kitsTbody = document.getElementById("kitsTbody");
const btnNewKit = document.getElementById("btnNewKit");
const kitForm = document.getElementById("kitForm");
const kitId = document.getElementById("kitId");
const kitName = document.getElementById("kitName");
const kitPrice = document.getElementById("kitPrice");
const kitImage = document.getElementById("kitImage");
const kitDesc = document.getElementById("kitDesc");
const kitActive = document.getElementById("kitActive");
const btnSaveKit = document.getElementById("btnSaveKit");
const btnCancelKit = document.getElementById("btnCancelKit");
const btnDeleteKit = document.getElementById("btnDeleteKit");
const kitMsg = document.getElementById("kitMsg");

const couponsTbody = document.getElementById("couponsTbody");
const btnNewCoupon = document.getElementById("btnNewCoupon");
const couponForm = document.getElementById("couponForm");
const couponId = document.getElementById("couponId");
const couponCode = document.getElementById("couponCode");
const couponType = document.getElementById("couponType");
const couponValue = document.getElementById("couponValue");
const couponMin = document.getElementById("couponMin");
const couponMax = document.getElementById("couponMax");
const couponExpire = document.getElementById("couponExpire");
const couponActive = document.getElementById("couponActive");
const btnSaveCoupon = document.getElementById("btnSaveCoupon");
const btnCancelCoupon = document.getElementById("btnCancelCoupon");
const btnDeleteCoupon = document.getElementById("btnDeleteCoupon");
const couponMsg = document.getElementById("couponMsg");

const ordersTbody = document.getElementById("ordersTbody");
const btnRefreshOrders = document.getElementById("btnRefreshOrders");

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));

const brl = (c) =>
  (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const toCents = (v) => Math.round(Number(v || 0) * 100);

function applyThemeFromInputs() {
  const p = (themePrimaryInput?.value || "").trim();
  const s = (themeSecondaryInput?.value || "").trim();
  if (p) document.documentElement.style.setProperty("--purple", p);
  if (s) document.documentElement.style.setProperty("--purple2", s);
}

async function refreshSession() {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;

  if (!user) {
    loginCard.classList.remove("hidden");
    dash.classList.add("hidden");
    btnLogout.classList.add("hidden");
    return;
  }

  adminEmail.textContent = user.email || "admin";
  loginCard.classList.add("hidden");
  dash.classList.remove("hidden");
  btnLogout.classList.remove("hidden");

  await loadSettings();
  await loadKits();
  await loadCoupons();
  await loadOrders();
}

btnLogin.addEventListener("click", async () => {
  loginMsg.textContent = "";
  btnLogin.disabled = true;

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  });

  btnLogin.disabled = false;
  if (error) loginMsg.innerHTML = `<span style="color:var(--bad)">${esc(error.message)}</span>`;

  await refreshSession();
});

btnLogout.addEventListener("click", async () => {
  await supabase.auth.signOut();
  await refreshSession();
});

btnSaveSettings.addEventListener("click", async () => {
  settingsMsg.textContent = "";
  btnSaveSettings.disabled = true;

  const payload = {
    key: "public",
    // visual do site
    site_name: siteNameInput.value.trim() || "Infinity Craft",
    banner_url: bannerUrlInput.value.trim() || null,
    theme_primary: themePrimaryInput.value.trim() || "#7c3aed",
    theme_secondary: themeSecondaryInput.value.trim() || "#8b5cf6",
    // pix
    pix_key: pixKey.value.trim() || "CONFIGURE_NO_ADMIN",
    pix_message: pixMessage.value.trim() || "Ao pagar, avise no Discord e mande o ID do pedido.",
  };

  const { error } = await supabase
    .from("settings")
    .upsert(payload, { onConflict: "key" });

  btnSaveSettings.disabled = false;

  settingsMsg.innerHTML = error
    ? `<span style="color:var(--bad)">${esc(error.message)}</span>`
    : `<span style="color:var(--ok)">Salvo ✅</span>`;

  // aplica no próprio admin
  if (siteNameTop) siteNameTop.textContent = payload.site_name;
  applyThemeFromInputs();
});

async function loadSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("key", "public")
    .single();

  if (error) {
    settingsMsg.innerHTML = `<span style="color:var(--bad)">${esc(error.message)}</span>`;
    return;
  }

  // topo
  if (siteNameTop && data.site_name) siteNameTop.textContent = data.site_name;

  // site settings
  siteNameInput.value = data.site_name || "Infinity Craft";
  bannerUrlInput.value = data.banner_url || "";
  themePrimaryInput.value = data.theme_primary || "#7c3aed";
  themeSecondaryInput.value = data.theme_secondary || "#8b5cf6";

  // pix
  pixKey.value = data.pix_key || "";
  pixMessage.value = data.pix_message || "";

  applyThemeFromInputs();
}

btnNewKit.addEventListener("click", () => {
  kitForm.classList.remove("hidden");
  kitId.value = "";
  kitName.value = "";
  kitPrice.value = "";
  kitImage.value = "";
  kitDesc.value = "";
  kitActive.value = "true";
  kitMsg.textContent = "";
});

btnCancelKit.addEventListener("click", () => kitForm.classList.add("hidden"));

btnSaveKit.addEventListener("click", async () => {
  kitMsg.textContent = "";
  btnSaveKit.disabled = true;

  const payload = {
    name: kitName.value.trim(),
    description: kitDesc.value.trim(),
    price_cents: toCents(kitPrice.value),
    image_url: kitImage.value.trim() || null,
    active: kitActive.value === "true",
    updated_at: new Date().toISOString(),
  };

  if (!payload.name) {
    kitMsg.innerHTML = `<span style="color:var(--bad)">Nome obrigatório.</span>`;
    btnSaveKit.disabled = false;
    return;
  }

  let error;
  if (kitId.value) {
    ({ error } = await supabase.from("kits").update(payload).eq("id", kitId.value));
  } else {
    ({ error } = await supabase.from("kits").insert(payload));
  }

  btnSaveKit.disabled = false;
  kitMsg.innerHTML = error
    ? `<span style="color:var(--bad)">${esc(error.message)}</span>`
    : `<span style="color:var(--ok)">Salvo ✅</span>`;

  await loadKits();
  kitForm.classList.add("hidden");
});

btnDeleteKit.addEventListener("click", async () => {
  if (!kitId.value) return;
  if (!confirm("Excluir kit?")) return;

  btnDeleteKit.disabled = true;
  const { error } = await supabase.from("kits").delete().eq("id", kitId.value);
  btnDeleteKit.disabled = false;

  if (error) alert(error.message);
  await loadKits();
  kitForm.classList.add("hidden");
});

async function loadKits() {
  const { data, error } = await supabase.from("kits").select("*").order("created_at", { ascending: false });
  kitsTbody.innerHTML = "";

  if (error) {
    kitsTbody.innerHTML = `<tr><td colspan="4">${esc(error.message)}</td></tr>`;
    return;
  }

  for (const k of data || []) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><b>${esc(k.name)}</b><div class="small">${esc(k.description || "")}</div></td>
      <td>${brl(k.price_cents || 0)}</td>
      <td>${k.active ? "Sim" : "Não"}</td>
      <td><button class="btn btn-ghost" data-edit="${k.id}">Editar</button></td>
    `;
    kitsTbody.appendChild(tr);
  }

  kitsTbody.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-edit");
      const { data } = await supabase.from("kits").select("*").eq("id", id).single();
      if (!data) return;

      kitForm.classList.remove("hidden");
      kitId.value = data.id;
      kitName.value = data.name || "";
      kitPrice.value = ((data.price_cents || 0) / 100).toFixed(2);
      kitImage.value = data.image_url || "";
      kitDesc.value = data.description || "";
      kitActive.value = data.active ? "true" : "false";
      kitMsg.textContent = "";
    });
  });
}

btnNewCoupon.addEventListener("click", () => {
  couponForm.classList.remove("hidden");
  couponId.value = "";
  couponCode.value = "";
  couponType.value = "percent";
  couponValue.value = "";
  couponMin.value = "";
  couponMax.value = "";
  couponExpire.value = "";
  couponActive.value = "true";
  couponMsg.textContent = "";
});

btnCancelCoupon.addEventListener("click", () => couponForm.classList.add("hidden"));

btnSaveCoupon.addEventListener("click", async () => {
  couponMsg.textContent = "";
  btnSaveCoupon.disabled = true;

  const code = couponCode.value.trim().toUpperCase();
  const type = couponType.value;
  const val = Number(couponValue.value || 0);

  if (!code) {
    couponMsg.innerHTML = `<span style="color:var(--bad)">Código obrigatório.</span>`;
    btnSaveCoupon.disabled = false;
    return;
  }

  if (val <= 0) {
    couponMsg.innerHTML = `<span style="color:var(--bad)">Valor inválido.</span>`;
    btnSaveCoupon.disabled = false;
    return;
  }

  const payload = {
    code,
    type,
    value_percent: type === "percent" ? val : null,
    value_cents: type === "fixed" ? toCents(val) : null,
    min_cart_cents: toCents(couponMin.value || 0),
    max_uses: Number(couponMax.value || 999999),
    expires_at: couponExpire.value ? new Date(couponExpire.value + "T23:59:59Z").toISOString() : null,
    active: couponActive.value === "true",
    updated_at: new Date().toISOString(),
  };

  let error;
  if (couponId.value) {
    ({ error } = await supabase.from("coupons").update(payload).eq("id", couponId.value));
  } else {
    ({ error } = await supabase.from("coupons").insert(payload));
  }

  btnSaveCoupon.disabled = false;

  couponMsg.innerHTML = error
    ? `<span style="color:var(--bad)">${esc(error.message)}</span>`
    : `<span style="color:var(--ok)">Salvo ✅</span>`;

  await loadCoupons();
  couponForm.classList.add("hidden");
});

btnDeleteCoupon.addEventListener("click", async () => {
  if (!couponId.value) return;
  if (!confirm("Excluir cupom?")) return;

  btnDeleteCoupon.disabled = true;
  const { error } = await supabase.from("coupons").delete().eq("id", couponId.value);
  btnDeleteCoupon.disabled = false;

  if (error) alert(error.message);
  await loadCoupons();
  couponForm.classList.add("hidden");
});

async function loadCoupons() {
  const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  couponsTbody.innerHTML = "";

  if (error) {
    couponsTbody.innerHTML = `<tr><td colspan="5">${esc(error.message)}</td></tr>`;
    return;
  }

  for (const c of data || []) {
    const value = c.type === "percent" ? `${c.value_percent}%` : brl(c.value_cents || 0);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><b>${esc(c.code)}</b><div class="small">Usos: ${c.uses_count}/${c.max_uses}</div></td>
      <td>${esc(c.type)}</td>
      <td>${esc(value)}</td>
      <td>${c.active ? "Sim" : "Não"}</td>
      <td><button class="btn btn-ghost" data-editc="${c.id}">Editar</button></td>
    `;
    couponsTbody.appendChild(tr);
  }

  couponsTbody.querySelectorAll("[data-editc]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-editc");
      const { data } = await supabase.from("coupons").select("*").eq("id", id).single();
      if (!data) return;

      couponForm.classList.remove("hidden");
      couponId.value = data.id;
      couponCode.value = data.code || "";
      couponType.value = data.type || "percent";
      couponValue.value =
        data.type === "percent" ? (data.value_percent || "") : ((data.value_cents || 0) / 100).toFixed(2);
      couponMin.value = ((data.min_cart_cents || 0) / 100).toFixed(2);
      couponMax.value = data.max_uses || "";
      couponActive.value = data.active ? "true" : "false";
      couponExpire.value = data.expires_at ? new Date(data.expires_at).toISOString().slice(0, 10) : "";
      couponMsg.textContent = "";
    });
  });
}

btnRefreshOrders.addEventListener("click", () => loadOrders());

async function loadOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  ordersTbody.innerHTML = "";

  if (error) {
    ordersTbody.innerHTML = `<tr><td colspan="7">${esc(error.message)}</td></tr>`;
    return;
  }

  for (const o of data || []) {
    const dateStr = o.created_at ? new Date(o.created_at).toLocaleString("pt-BR") : "—";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${esc(dateStr)}</td>
      <td><b>${esc(o.player_name)}</b></td>
      <td>${esc(o.discord_user)}</td>
      <td>${esc(o.kit_name)}</td>
      <td>${brl(o.total_cents || 0)}</td>
      <td>${esc(o.status)}</td>
      <td>
        <button class="btn btn-ghost" data-paid="${o.id}">PAID</button>
        <button class="btn btn-ghost" data-del="${o.id}">DELIVERED</button>
      </td>
    `;
    ordersTbody.appendChild(tr);
  }

  ordersTbody.querySelectorAll("[data-paid]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-paid");
      await supabase.from("orders").update({ status: "PAID", paid_at: new Date().toISOString() }).eq("id", id);
      await loadOrders();
    });
  });

  ordersTbody.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      await supabase.from("orders").update({ status: "DELIVERED", delivered_at: new Date().toISOString() }).eq("id", id);
      await loadOrders();
    });
  });
}

await refreshSession();
