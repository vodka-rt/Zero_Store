import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginCard = document.getElementById("loginCard");
const dash = document.getElementById("dash");
const btnLogout = document.getElementById("btnLogout");

const email = document.getElementById("email");
const password = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");
const loginMsg = document.getElementById("loginMsg");

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
}

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

refreshSession();
