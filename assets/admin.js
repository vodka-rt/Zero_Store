import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ================= LOGIN ================= */

const loginCard = document.getElementById("loginCard");
const dash = document.getElementById("dash");
const btnLogout = document.getElementById("btnLogout");

const email = document.getElementById("email");
const password = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");
const loginMsg = document.getElementById("loginMsg");

btnLogin.addEventListener("click", async () => {

  loginMsg.textContent = "";
  btnLogin.disabled = true;

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  });

  btnLogin.disabled = false;

  if (error) {
    loginMsg.textContent = error.message;
  } else {
    refreshSession();
  }
});

btnLogout.addEventListener("click", async () => {
  await supabase.auth.signOut();
  refreshSession();
});

async function refreshSession() {

  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;

  if (!user) {
    loginCard.classList.remove("hidden");
    dash.classList.add("hidden");
    btnLogout.classList.add("hidden");
    return;
  }

  loginCard.classList.add("hidden");
  dash.classList.remove("hidden");
  btnLogout.classList.remove("hidden");

  loadSettings();
  loadKits();
  loadOrders();
}

refreshSession();

/* ================= SETTINGS ================= */

const siteNameInput = document.getElementById("siteNameInput");
const bannerUrlInput = document.getElementById("bannerUrlInput");
const themePrimaryInput = document.getElementById("themePrimaryInput");
const themeSecondaryInput = document.getElementById("themeSecondaryInput");
const pixKey = document.getElementById("pixKey");
const pixMessage = document.getElementById("pixMessage");
const btnSaveSettings = document.getElementById("btnSaveSettings");
const settingsMsg = document.getElementById("settingsMsg");

async function loadSettings() {
  const { data } = await supabase
    .from("settings")
    .select("*")
    .eq("key", "public")
    .single();

  if (!data) return;

  siteNameInput.value = data.site_name || "";
  bannerUrlInput.value = data.banner_url || "";
  themePrimaryInput.value = data.theme_primary || "#111111";
  themeSecondaryInput.value = data.theme_secondary || "#3a3a3a";
  pixKey.value = data.pix_key || "";
  pixMessage.value = data.pix_message || "";
}

btnSaveSettings.addEventListener("click", async () => {

  const payload = {
    key: "public",
    site_name: siteNameInput.value,
    banner_url: bannerUrlInput.value,
    theme_primary: themePrimaryInput.value,
    theme_secondary: themeSecondaryInput.value,
    pix_key: pixKey.value,
    pix_message: pixMessage.value
  };

  const { error } = await supabase
    .from("settings")
    .upsert(payload, { onConflict: "key" });

  settingsMsg.textContent = error ? error.message : "Salvo ✅";
});

/* ================= KITS ================= */

const kitsList = document.getElementById("kitsList");

function formatBRL(cents) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

async function loadKits() {

  const { data } = await supabase
    .from("kits")
    .select("*")
    .order("created_at", { ascending: false });

  kitsList.innerHTML = "";

  data?.forEach((kit) => {

    const div = document.createElement("div");
    div.className = "card";
    div.style.marginTop = "10px";

    div.innerHTML = `
      ${kit.image_url ? `<img src="${kit.image_url}" style="width:100%;max-height:200px;object-fit:cover;border-radius:10px;">` : ""}
      <h3>${kit.name}</h3>
      <p>${kit.description || ""}</p>
      <b>${formatBRL(kit.price_cents)}</b>
      <br><br>
      <button onclick="deleteKit('${kit.id}')" class="btn">Excluir</button>
    `;

    kitsList.appendChild(div);
  });
}

window.deleteKit = async (id) => {
  if (!confirm("Excluir kit?")) return;
  await supabase.from("kits").delete().eq("id", id);
  loadKits();
};

/* ================= ORDERS ================= */

const ordersList = document.getElementById("ordersList");

async function loadOrders() {

  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  ordersList.innerHTML = "";

  data?.forEach((order) => {

    const div = document.createElement("div");
    div.className = "card";
    div.style.marginTop = "10px";

    div.innerHTML = `
      <b>Nick:</b> ${order.player_name}<br>
      <b>Discord:</b> ${order.discord_user}<br>
      <b>Kit:</b> ${order.kit_name}<br>
      <b>Valor:</b> ${formatBRL(order.total_cents)}<br>
      <b>Status:</b> ${order.status}<br><br>

      <button onclick="approveOrder('${order.id}')" class="btn">Aprovar</button>
      <button onclick="denyOrder('${order.id}')" class="btn">Negar</button>
      <button onclick="deliverOrder('${order.id}')" class="btn">Entregue</button>
    `;

    ordersList.appendChild(div);
  });
}

window.approveOrder = async (id) => {
  await supabase.from("orders").update({ status: "PAID" }).eq("id", id);
  loadOrders();
};

window.denyOrder = async (id) => {
  await supabase.from("orders").update({ status: "DENIED" }).eq("id", id);
  loadOrders();
};

window.deliverOrder = async (id) => {
  await supabase.from("orders").update({ status: "DELIVERED" }).eq("id", id);
  loadOrders();
};
