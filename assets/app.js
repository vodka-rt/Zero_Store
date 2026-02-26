import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const kitsContainer = document.getElementById("kitsContainer");
const bannerBox = document.getElementById("bannerBox");

function formatBRL(cents) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

async function loadPage() {

  // 🔹 CONFIGURAÇÕES
  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("key", "public")
    .single();

  if (settings) {
    document.title = settings.site_name || "ZeroMc Store";

    if (settings.banner_url) {
      bannerBox.innerHTML = `
        <img src="${settings.banner_url}" 
             style="width:100%;max-height:300px;object-fit:cover;border-radius:15px;">
      `;
    }
  }

  // 🔹 KITS
  const { data: kits, error } = await supabase
    .from("kits")
    .select("*")
    .eq("active", true);

  if (error) {
    kitsContainer.innerHTML = `<div class="small">${error.message}</div>`;
    return;
  }

  kitsContainer.innerHTML = "";

  kits?.forEach(kit => {

    const div = document.createElement("div");
    div.className = "card";
    div.style.marginTop = "15px";

    div.innerHTML = `
      ${kit.image_url ? `<img src="${kit.image_url}" 
         style="width:100%;max-height:200px;object-fit:cover;border-radius:10px;">` : ""}
      <h3>${kit.name}</h3>
      <p>${kit.description || ""}</p>
      <b>${formatBRL(kit.price_cents)}</b>
      <br><br>
      <a href="pagamentos.html?kit=${kit.id}" class="btn btn-primary">
        Comprar
      </a>
    `;

    kitsContainer.appendChild(div);
  });

}

loadPage();
