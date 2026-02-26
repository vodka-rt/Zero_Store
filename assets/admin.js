import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ======================
   ELEMENTOS
====================== */

const loginCard = document.getElementById("loginCard");
const dash = document.getElementById("dash");
const btnLogout = document.getElementById("btnLogout");
const adminEmail = document.getElementById("adminEmail");

const email = document.getElementById("email");
const password = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");
const loginMsg = document.getElementById("loginMsg");

const themePrimaryInput = document.getElementById("themePrimaryInput");
const themeSecondaryInput = document.getElementById("themeSecondaryInput");

const themePreview = document.getElementById("themePreview");

const btnSaveSettings = document.getElementById("btnSaveSettings");
const settingsMsg = document.getElementById("settingsMsg");

/* ======================
   LOGIN
====================== */

btnLogin?.addEventListener("click", async () => {

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

btnLogout?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  refreshSession();
});

async function refreshSession() {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;

  if (!user) {
    loginCard?.classList.remove("hidden");
    dash?.classList.add("hidden");
    btnLogout?.classList.add("hidden");
    return;
  }

  adminEmail.textContent = user.email;
  loginCard?.classList.add("hidden");
  dash?.classList.remove("hidden");
  btnLogout?.classList.remove("hidden");

  loadSettings();
}

refreshSession();

/* ======================
   TEMA / DEGRADÊ
====================== */

function applyTheme(primary, secondary){

  if(primary){
    document.documentElement.style.setProperty("--purple", primary);
  }

  if(secondary){
    document.documentElement.style.setProperty("--purple2", secondary);
  }

  if(themePreview){
    themePreview.style.background =
      `radial-gradient(900px 520px at 20% 0%, ${secondary}, #000 60%),
       radial-gradient(900px 520px at 80% 20%, ${primary}, #000 60%),
       linear-gradient(135deg,#0a0a0a,#000)`;
  }
}

themePrimaryInput?.addEventListener("input", ()=>{
  applyTheme(themePrimaryInput.value, themeSecondaryInput.value);
});

themeSecondaryInput?.addEventListener("input", ()=>{
  applyTheme(themePrimaryInput.value, themeSecondaryInput.value);
});

/* ======================
   LOAD SETTINGS
====================== */

async function loadSettings(){

  const { data } = await supabase
    .from("settings")
    .select("*")
    .eq("key","public")
    .single();

  if(!data) return;

  themePrimaryInput.value = data.theme_primary || "#7c3aed";
  themeSecondaryInput.value = data.theme_secondary || "#8b5cf6";

  applyTheme(themePrimaryInput.value, themeSecondaryInput.value);
}

/* ======================
   SAVE SETTINGS
====================== */

btnSaveSettings?.addEventListener("click", async ()=>{

  btnSaveSettings.disabled = true;

  const payload = {
    key: "public",
    theme_primary: themePrimaryInput.value,
    theme_secondary: themeSecondaryInput.value,
  };

  const { error } = await supabase
    .from("settings")
    .upsert(payload,{ onConflict:"key" });

  btnSaveSettings.disabled = false;

  settingsMsg.textContent = error ? error.message : "Salvo ✅";

  applyTheme(themePrimaryInput.value, themeSecondaryInput.value);
});
