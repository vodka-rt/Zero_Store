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
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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

  if(!kitId){
    kitInfo.textContent = "Produto inválido.";
    confirmBtn.disabled = true;
    return;
  }

  // 🔹 Buscar produto
  const { data: product } = await supabase
    .from("kits")
    .select("*")
    .eq("id", kitId)
    .single();

  if(!product){
    kitInfo.textContent = "Produto não encontrado.";
    confirmBtn.disabled = true;
    return;
  }

  kitInfo.innerHTML = `
    <b>Produto:</b> ${product.name}<br>
    <b>Categoria:</b> ${product.category}<br>
    <b>Valor:</b> ${formatBRL(product.price_cents)}
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
      kit_name: product.name,
      total_cents: product.price_cents,
      status: "PENDING",
      pix_confirmed: true
    });

    if(error){
      statusEl.textContent = error.message;
      confirmBtn.disabled = false;
      return;
    }

    statusEl.innerHTML = `
      <div style="margin-top:15px;padding:15px;border-radius:15px;background:#111;border:1px solid #222;">
        <h3>Pedido enviado ✅</h3>
        <p>Agora:</p>
        <ul>
          <li>Abra um ticket no Discord</li>
          <li>Envie o comprovante</li>
          <li>Marque algum administrador</li>
          <li>Aguarde para resgatar seu produto</li>
        </ul>
        <b>Obrigado por comprar na Zero MC!</b>
      </div>
    `;

    confirmBtn.style.display = "none";
  });

}

loadPage();
