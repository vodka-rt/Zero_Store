import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const siteNameEl = document.getElementById("siteName");

const kitBox = document.getElementById("kitBox");
const playerName = document.getElementById("playerName");
const discordUser = document.getElementById("discordUser");
const couponCode = document.getElementById("couponCode");
const btnApply = document.getElementById("btnApply");
const couponMsg = document.getElementById("couponMsg");
const totalPrice = document.getElementById("totalPrice");
const btnCreateOrder = document.getElementById("btnCreateOrder");

const orderArea = document.getElementById("orderArea");
const orderIdEl = document.getElementById("orderId");
const pixKeyEl = document.getElementById("pixKey");
const pixMessageEl = document.getElementById("pixMessage");
const btnCopyPix = document.getElementById("btnCopyPix");

let kit = null;
let appliedCoupon = null;
let finalCents = 0;

let pixKey = "CONFIGURE_NO_ADMIN";
let pixMessage = "Ao pagar, avise no Discord e mande o ID do pedido.";

const brl = (cents) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));

const getParam = (n) => new URLSearchParams(location.search).get(n);

async function applySettings() {
  const { data } = await supabase.from("settings").select("*").eq("key", "public").single();
  if (!data) return;

  if (data.site_name && siteNameEl) siteNameEl.textContent = data.site_name;

  if (data.theme_primary) document.documentElement.style.setProperty("--purple", data.theme_primary);
  if (data.theme_secondary) document.documentElement.style.setProperty("--purple2", data.theme_secondary);

  pixKey = (data.pix_key || pixKey).trim();
  pixMessage = (data.pix_message || pixMessage).trim();

  pixKeyEl.textContent = pixKey;
  pixMessageEl.textContent = pixMessage;
}

async function loadKit() {
  const id = getParam("kit");
  if (!id) {
    kitBox.textContent = "Nenhum kit.";
    btnCreateOrder.disabled = true;
    return;
  }

  const { data, error } = await supabase.from("kits").select("*").eq("id", id).single();
  if (error || !data) {
    kitBox.textContent = "Kit não encontrado.";
    btnCreateOrder.disabled = true;
    return;
  }

  kit = data;
  kitBox.innerHTML = `<b>${esc(kit.name)}</b><br><span class="small">${esc(kit.description || "")}</span>`;
  recalc();
}

function recalc() {
  const base = kit?.price_cents || 0;
  let total = base;

  if (appliedCoupon) {
    if (appliedCoupon.type === "percent") {
      total = Math.max(0, Math.round(base * (1 - (Number(appliedCoupon.value_percent) / 100))));
    } else {
      total = Math.max(0, base - (appliedCoupon.value_cents || 0));
    }
  }

  finalCents = total;
  totalPrice.textContent = brl(finalCents);
}

async function applyCoupon() {
  couponMsg.textContent = "";
  appliedCoupon = null;

  const code = couponCode.value.trim().toUpperCase();
  if (!code) {
    couponMsg.textContent = "Cupom vazio.";
    recalc();
    return;
  }

  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) {
    couponMsg.innerHTML = `<span style="color:var(--bad)">Cupom inválido.</span>`;
    recalc();
    return;
  }

  const base = kit?.price_cents || 0;

  if (base < (data.min_cart_cents || 0)) {
    couponMsg.innerHTML = `<span style="color:var(--warn)">Mínimo: ${brl(data.min_cart_cents || 0)}</span>`;
    recalc();
    return;
  }

  if ((data.uses_count || 0) >= (data.max_uses || 999999)) {
    couponMsg.innerHTML = `<span style="color:var(--warn)">Cupom esgotado.</span>`;
    recalc();
    return;
  }

  if (data.expires_at && Date.now() > new Date(data.expires_at).getTime()) {
    couponMsg.innerHTML = `<span style="color:var(--warn)">Cupom expirado.</span>`;
    recalc();
    return;
  }

  appliedCoupon = data;
  couponMsg.innerHTML = `<span style="color:var(--ok)">Cupom aplicado!</span>`;
  recalc();
}

async function createOrder() {
  const nick = playerName.value.trim();
  const disc = discordUser.value.trim();

  if (!nick) return alert("Digite seu nick.");
  if (!disc) return alert("Digite seu usuário do Discord.");
  if (!kit) return alert("Kit inválido.");

  btnCreateOrder.disabled = true;

  const payload = {
    player_name: nick,
    discord_user: disc,
    kit_id: kit.id,
    kit_name: kit.name,
    base_price_cents: kit.price_cents || 0,
    coupon_code: appliedCoupon?.code || null,
    total_cents: finalCents,
    status: "WAITING_STAFF",
  };

  const { data, error } = await supabase.from("orders").insert(payload).select("id").single();
  btnCreateOrder.disabled = false;

  if (error) return alert("Erro ao criar pedido: " + error.message);

  orderArea.classList.remove("hidden");
  orderIdEl.textContent = data.id;

  btnCopyPix.onclick = async () => {
    await navigator.clipboard.writeText(pixKey);
    btnCopyPix.textContent = "Copiado ✅";
    setTimeout(() => (btnCopyPix.textContent = "Copiar"), 1200);
  };
}

btnApply.addEventListener("click", () => applyCoupon());
btnCreateOrder.addEventListener("click", () => createOrder());

await applySettings();
await loadKit();
