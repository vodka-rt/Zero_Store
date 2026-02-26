import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function formatBRL(cents) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

window.showCategory = function(category) {
  document.querySelectorAll(".category").forEach(c => c.classList.add("hidden"));
  document.getElementById(category).classList.remove("hidden");
}

window.toggleTerms = function() {
  document.getElementById("termsBox").classList.toggle("hidden");
}

async function loadProducts() {

  const { data } = await supabase
    .from("kits")
    .select("*")
    .eq("active", true);

  data?.forEach(product => {

    const container = document.getElementById(product.category + "Container");
    if (!container) return;

    const div = document.createElement("div");
    div.className = "card";
    div.style.marginTop = "10px";

    div.innerHTML = `
      ${product.image_url ? `<img src="${product.image_url}" style="width:100%;max-height:200px;object-fit:cover;border-radius:10px;">` : ""}
      <h3>${product.name}</h3>
      <p>${product.description || ""}</p>
      <b>${formatBRL(product.price_cents)}</b>
      <br><br>
      <a href="pagamentos.html?kit=${product.id}" class="btn btn-primary">
        Comprar
      </a>
    `;

    container.appendChild(div);
  });
}

loadProducts();
