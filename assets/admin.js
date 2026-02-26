import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* LOGIN */

const loginCard = document.getElementById("loginCard");
const dash = document.getElementById("dash");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const loginMsg = document.getElementById("loginMsg");

btnLogin.onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if(error){
    loginMsg.textContent = error.message;
  } else {
    checkSession();
  }
};

btnLogout.onclick = async () => {
  await supabase.auth.signOut();
  checkSession();
};

async function checkSession(){
  const { data } = await supabase.auth.getSession();
  if(!data.session){
    loginCard.classList.remove("hidden");
    dash.classList.add("hidden");
  } else {
    loginCard.classList.add("hidden");
    dash.classList.remove("hidden");
    loadProducts();
    loadOrders();
  }
}

checkSession();

/* ADICIONAR PRODUTO */

const productMsg = document.getElementById("productMsg");

async function createProduct(category){

  const name = document.getElementById("productName").value;
  const price = parseFloat(document.getElementById("productPrice").value);
  const image = document.getElementById("productImage").value;
  const desc = document.getElementById("productDesc").value;

  if(!name || !price){
    productMsg.textContent = "Preencha nome e preço";
    return;
  }

  const { error } = await supabase.from("kits").insert({
    name,
    price_cents: Math.round(price*100),
    image_url: image,
    description: desc,
    category: category,
    active: true
  });

  productMsg.textContent = error ? error.message : "Produto criado ✅";

  loadProducts();
}

document.getElementById("addKit").onclick = () => createProduct("kits");
document.getElementById("addVip").onclick = () => createProduct("vips");
document.getElementById("addBase").onclick = () => createProduct("bases");

/* LISTAR PRODUTOS */

const productsList = document.getElementById("productsList");

function formatBRL(c){
  return (c/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

async function loadProducts(){

  const { data } = await supabase.from("kits").select("*");

  productsList.innerHTML = "";

  ["kits","vips","bases"].forEach(cat => {

    const title = document.createElement("h3");
    title.textContent = cat.toUpperCase();
    productsList.appendChild(title);

    data.filter(p => p.category === cat)
        .forEach(p => {

          const div = document.createElement("div");
          div.className = "card";
          div.style.marginTop = "10px";

          div.innerHTML = `
            <b>${p.name}</b><br>
            ${p.description || ""}<br>
            ${formatBRL(p.price_cents)}<br>
            <button onclick="deleteProduct('${p.id}')" class="btn">Excluir</button>
          `;

          productsList.appendChild(div);
        });
  });
}

window.deleteProduct = async (id)=>{
  await supabase.from("kits").delete().eq("id",id);
  loadProducts();
};

/* PEDIDOS */

const ordersList = document.getElementById("ordersList");

async function loadOrders(){

  const { data } = await supabase.from("orders").select("*");

  ordersList.innerHTML = "";

  data.forEach(o => {

    const div = document.createElement("div");
    div.className = "card";
    div.style.marginTop = "10px";

    div.innerHTML = `
      ${o.player_name} - ${o.kit_name}<br>
      ${o.status}<br>
      <button onclick="approve('${o.id}')" class="btn">Aprovar</button>
      <button onclick="deliver('${o.id}')" class="btn">Entregue</button>
    `;

    ordersList.appendChild(div);
  });
}

window.approve = async(id)=>{
  await supabase.from("orders").update({status:"PAID"}).eq("id",id);
  loadOrders();
};

window.deliver = async(id)=>{
  await supabase.from("orders").update({status:"DELIVERED"}).eq("id",id);
  loadOrders();
};
