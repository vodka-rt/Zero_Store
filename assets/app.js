import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const kitsGrid = document.getElementById("kitsGrid");
const kitCount = document.getElementById("kitCount");
const siteNameEl = document.getElementById("siteName");
const bannerImg = document.getElementById("bannerImg");

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

async function applySettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("key", "public")
    .single();

  if (error) return; // não trava o site

  if (data?.site_name && siteNameEl) siteNameEl.textContent = data.site_name;

  if (data?.theme_primary) document.documentElement.style.setProperty("--purple", data.theme_primary);
  if (data?.theme_secondary) document.documentElement.style.setProperty("--purple2", data.theme_secondary);

  if (bannerImg && data?.banner_url && String(data.banner_url).startsWith("http")) {
    bannerImg.src = data.banner_url;
  }
}

async function loadKits() {
  kitCount.textContent = "Carregando…";

  const { data, error } = await supabase
    .from("kits")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    kitsGrid.innerHTML = `<div class="card"><b>Erro:</b><div class="small">${esc(error.message)}</div></div>`;
    kitCount.textContent = "Erro";
    return;
  }

  const kits = data || [];
  kitCount.textContent = `${kits.length} kits`;
  kitsGrid.innerHTML = "";

  if (!kits.length) {
    kitsGrid.innerHTML = `<div class="card"><h3>Sem kits</h3><div class="small">Crie kits no Admin.</div></div>`;
    return;
  }

  for (const k of kits) {
    const img = k.image_url
      ? `<img src="${esc(k.image_url)}" style="width:100%;height:140px;object-fit:cover;border-radius:16px;border:1px solid rgba(255,255,255,.08);margin-bottom:10px">`
      : "";

    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      ${img}
      <h3>${esc(k.name)}</h3>
      <div class="price">${brl(k.price_cents || 0)}</div>
      <div class="small">${esc(k.description || "")}</div>
      <div class="hr"></div>
      <div class="row">
        <span class="badge">PIX</span>
        <a class="btn" href="pagamentos.html?kit=${encodeURIComponent(k.id)}">Comprar</a>
      </div>
    `;
    kitsGrid.appendChild(el);
  }
}

await applySettings();
await loadKits();
