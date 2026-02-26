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

  loadKits();
  loadOrders();
}

refreshSession();

/* ================= KITS ================= */

const kitsTbody = document.getElementById("kitsTbody");
const btnCreateKit = document.getElementById("btnCreateKit");

btnCreateKit.addEventListener("click", async () => {
  const name = document.getElementById("newKitName").value;
  const price = parseFloat(document.getElementById("newKitPrice").value);
  const image = document.getElementById("newKitImage").value;
  const desc = document.getElementById("newKitDesc").value;

  if (!name || !price) return alert("Preencha nome e preço");

  await supabase.from("kits").insert({
    name,
    price_cents: Math.round(price * 100),
    image_url: image,
    description: desc,
    active: true
  });

  document.getElementById("newKitName").value = "";
  document.getElementById("newKitPrice").value = "";
  document.getElementById("newKitImage").value = "";
  document.getElementById("newKitDesc").value = "";

  loadKits();
});

async function loadKits() {
  const { data } = await supabase.from("kits").select("*");

  kitsTbody.innerHTML = "";

  data?.forEach((kit) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        ${kit.image_url ? `<img src="${kit.image_url}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;"><br>` : ""}
        <strong>${kit.name}</strong><br>
        <small>${kit.description || ""}</small>
      </td>
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
  await supabase.from("orders").update({ status: "PAID" }).eq("id", id);
  loadOrders();
};

window.setDelivered = async (id) => {
  await supabase.from("orders").update({ status: "DELIVERED" }).eq("id", id);
  loadOrders();
};
