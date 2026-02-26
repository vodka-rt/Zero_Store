import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const kitInfo = document.getElementById("kitInfo");
const pixKeyBox = document.getElementById("pixKeyBox");
const pixMessage = document.getElementById("pixMessage");
const confirmBtn = document.getElementById("confirmPaymentBtn");
const statusEl = document.getElementById("status");

const urlParams = new URLSearchParams(window.location.search);
const kitId = urlParams.get("kit");

function formatBRL(cents){
  return (cents/100).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}

async function loadPage(){

  // 🔹 Buscar configurações (PIX)
  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("key", "public")
    .single();

  if(settings){
    pixKeyBox.textContent = settings.pix_key || "Configure no painel admin";
    pixMessage.textContent = settings.pix_message || "";
  }

  // 🔹 Buscar kit
  if(!kitId){
    kitInfo.textContent = "Kit inválido.";
    confirmBtn.disabled = true;
    return;
  }

  const { data: kit } = await supabase
    .from("kits")
    .select("*")
    .eq("id", kitId)
    .single();

  if(!kit){
    kitInfo.textContent = "Kit não encontrado.";
    confirmBtn.disabled = true;
    return;
  }

  kitInfo.innerHTML = `
    <b>Kit:</b> ${kit.name}<br>
    <b>Valor:</b> ${formatBRL(kit.price_cents)}
  `;

  confirmBtn.addEventListener("click", async () => {

    const player = document.getElementById("player_name").value.trim();
    const discord = document.getElementById("discord_user").value.trim();

    if(!player || !discord){
      alert("Preencha seus dados.");
      return;
    }

    confirmBtn.disabled = true;
    statusEl.textContent = "Enviando pedido para a staff...";

    const { error } = await supabase.from("orders").insert({
      player_name: player,
      discord_user: discord,
      kit_name: kit.name,
      total_cents: kit.price_cents,
      status: "PENDING",
      pix_confirmed: true
    });

    if(error){
      statusEl.textContent = error.message;
      confirmBtn.disabled = false;
    } else {
      statusEl.textContent = "Pedido enviado com sucesso! Aguarde aprovação.";
    }

  });

}

loadPage();
