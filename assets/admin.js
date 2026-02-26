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

/* ================= CONFIG ================= */

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
  btnSaveSettings.disabled = true;

  const payload = {
    key: "public",
    site_name: siteNameInput.value,
    banner_url: bannerUrlInput.value,
    theme_primary: themePrimaryInput.value,
    theme_secondary: themeSecondaryInput.value,
    pix_key: pixKey.value,
    pix_message: pixMessage.value,
  };

  const { error } = await supabase
    .from("settings")
    .upsert(payload, { onConflict: "key" });

  btnSaveSettings.disabled = false;
  settingsMsg.textContent = error ? error.message : "Salvo ✅";
});

/* ================= KITS ================= */

const kitsTbody = document.getElementById("kitsTbody");

async function loadKits() {
  const { data } = await supabase.from("kits").select("*");

  kitsTbody.innerHTML = "";

  data?.forEach((kit) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${kit.name}</td>
      <td>R$ ${(kit.price_cents / 100).toFixed(2)}</td>
      <td>${kit.active ? "Ativo" : "Inativo"}</td>
      <td>
        <button onclick="deleteKit('${kit.id}')" class="btn">Excluir</button>
      </td>
    `;

    kitsTbody.appendChild(tr);
  });
}

window.deleteKit = async (id) => {
  if (!confirm("Excluir kit?")) return;
  await supabase.from("kits").delete().eq("id", id);
  loadKits();
};

/* ================= ORDERS ================= */

const ordersTbody = document.getElementById("ordersTbody");

async function loadOrders() {
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  ordersTbody.innerHTML = "";

  data?.forEach((order) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${order.player_name}</td>
      <td>${order.kit_name}</td>
      <td>R$ ${(order.total_cents / 100).toFixed(2)}</td>
      <td>${order.status}</td>
      <td>
        <button onclick="setPaid('${order.id}')" class="btn">PAID</button>
        <button onclick="setDelivered('${order.id}')" class="btn">DELIVERED</button>
      </td>
    `;

    ordersTbody.appendChild(tr);
  });
}

window.setPaid = async (id) => {
  await supabase
    .from("orders")
    .update({ status: "PAID" })
    .eq("id", id);
  loadOrders();
};

window.setDelivered = async (id) => {
  await supabase
    .from("orders")
    .update({ status: "DELIVERED" })
    .eq("id", id);
  loadOrders();
};
