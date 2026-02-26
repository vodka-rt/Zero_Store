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

btnLogin.onclick = async () => {
  loginMsg.textContent = "";
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  });

  if (error) {
    loginMsg.textContent = error.message;
  } else {
    checkSession();
  }
};

btnLogout.onclick = async () => {
  await supabase.auth.signOut();
  checkSession();
};

async function checkSession() {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;

  if (!user) {
    loginCard.classList.remove("hidden");
    dash.classList.add("hidden");
  } else {
    loginCard.classList.add("hidden");
    dash.classList.remove("hidden");
    loadSettings();
    loadKits();
    loadOrders();
  }
}

checkSession();

/* ================= SETTINGS ================= */

const siteNameInput = document.getElementById("siteNameInput");
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
  themePrimaryInput.value = data.theme_primary || "";
  themeSecondaryInput.value = data.theme_secondary || "";
  pixKey.value = data.pix_key || "";
  pixMessage.value = data.pix_message || "";
}

btnSaveSettings.onclick = async () => {
  const { error } = await supabase
    .from("settings")
    .upsert({
      key: "public",
      site_name: siteNameInput.value,
      theme_primary: themePrimaryInput.value,
      theme_secondary: themeSecondaryInput.value,
      pix_key: pixKey.value,
      pix_message: pixMessage.value,
    }, { onConflict: "key" });

  settingsMsg.textContent = error ? error.message : "Salvo ✅";
};

/* ================= KITS ================= */

const kitsList = document.getElementById("kitsList");
const btnCreateKit = document.getElementById("btnCreateKit");
const kitMsg = document.getElementById("kitMsg");

btnCreateKit.onclick = async () => {
  const name = document.getElementById("newKitName").value;
  const price = parseFloat(document.getElementById("newKitPrice").value);
  const image = document.getElementById("newKitImage").value;
  const desc = document.getElementById("newKitDesc").value;

  if (!name || !price) {
    kitMsg.textContent = "Preencha nome e preço";
    return;
  }

  const { error } = await supabase.from("kits").insert({
    name,
    price_cents: Math.round(price * 100),
    image_url: image,
    description: desc,
    active: true
  });

  kitMsg.textContent = error ? error.message : "Kit criado ✅";
  loadKits();
};

async function loadKits() {
  const { data } = await supabase.from("kits").select("*");

  kitsList.innerHTML = "";

  data?.forEach(kit => {
    const div = document.createElement("div");
    div.className = "card";
    div.style.marginTop = "10px";

    div.innerHTML = `
      <b>${kit.name}</b><br>
      ${kit.description || ""}<br>
      R$ ${(kit.price_cents/100).toFixed(2)}<br>
      <button onclick="deleteKit('${kit.id}')" class="btn">Excluir</button>
    `;

    kitsList.appendChild(div);
  });
}

window.deleteKit = async (id) => {
  await supabase.from("kits").delete().eq("id", id);
  loadKits();
};

/* ================= ORDERS ================= */

const ordersList = document.getElementById("ordersList");

async function loadOrders() {
  const { data } = await supabase.from("orders").select("*");

  ordersList.innerHTML = "";

  data?.forEach(order => {
    const div = document.createElement("div");
    div.className = "card";
    div.style.marginTop = "10px";

    div.innerHTML = `
      ${order.player_name} - ${order.kit_name}<br>
      ${order.status}<br>
      <button onclick="approve('${order.id}')" class="btn">Aprovar</button>
      <button onclick="deliver('${order.id}')" class="btn">Entregar</button>
    `;

    ordersList.appendChild(div);
  });
}

window.approve = async (id) => {
  await supabase.from("orders").update({ status: "PAID" }).eq("id", id);
  loadOrders();
};

window.deliver = async (id) => {
  await supabase.from("orders").update({ status: "DELIVERED" }).eq("id", id);
  loadOrders();
};
