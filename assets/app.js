import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const kitsEl = document.getElementById("kits");
const bannerBox = document.getElementById("bannerBox");

function brl(cents){
  return (cents/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

function applyTheme(p,s){
  if(p) document.documentElement.style.setProperty("--purple", p);
  if(s) document.documentElement.style.setProperty("--purple2", s);
}

async function load(){
  const { data: settings } = await supabase
    .from("settings").select("*").eq("key","public").single();

  if(settings){
    document.title = settings.site_name || "ZeroMc Store";
    applyTheme(settings.theme_primary || "#111111", settings.theme_secondary || "#3a3a3a");

    if(settings.banner_url){
      bannerBox.innerHTML = `
        <img src="${settings.banner_url}" style="width:100%;max-height:280px;object-fit:cover;border-radius:22px;border:1px solid #222">
      `;
    }
  }

  const { data: kits } = await supabase
    .from("kits").select("*").eq("active", true);

  kitsEl.innerHTML = "";
  (kits || []).forEach(k=>{
    const div = document.createElement("div");
    div.className = "kit";
    div.innerHTML = `
      ${k.image_url ? `<img src="${k.image_url}">` : `<div style="height:150px;background:#0b0b0b"></div>`}
      <div class="body">
        <div style="font-weight:900;font-size:16px;">${k.name}</div>
        <div class="small" style="margin-top:6px;">${k.description || ""}</div>
        <div class="price">${brl(k.price_cents || 0)}</div>
        <a class="btn btn-primary" style="display:block;text-align:center;margin-top:12px;"
           href="buy.html?kit=${encodeURIComponent(k.id)}">Comprar</a>
      </div>
    `;
    kitsEl.appendChild(div);
  });
}

load();
