// public/js/register-driver.js
import { registerDriverWithInvite } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const nameEl = document.getElementById("drv_fullName");
  const contactEl = document.getElementById("drv_contact");
  const emailEl = document.getElementById("drv_email");
  const passEl = document.getElementById("drv_password");
  const inviteEl = document.getElementById("drv_invite");
  const busEl = document.getElementById("drv_busid");
  const statusEl = document.getElementById("drv_status");
  const regBtn = document.getElementById("drv_register_btn");
  const clearBtn = document.getElementById("drv_clear_btn");

  function setStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.style.color = isError ? "#ef4444" : "#10b981";
  }

  regBtn.addEventListener("click", async () => {
    const fullName = nameEl.value.trim();
    const contact = contactEl.value.trim();
    const email = emailEl.value.trim();
    const password = passEl.value;
    const invite = inviteEl.value.trim();
    const busId = busEl.value.trim() || null;

    if (!fullName || !email || !password || !invite) {
      setStatus("Please fill required fields", true);
      return;
    }
    setStatus("Registering...");
    try {
      await registerDriverWithInvite(fullName, contact, email, password, invite, busId);
      setStatus("Registration successful — redirecting...", false);
      setTimeout(()=> window.location.href = "/login.html", 1200);
    } catch (e) {
      console.error(e);
      setStatus("Registration failed: " + (e.message || e), true);
    }
  });

  clearBtn.addEventListener("click", () => {
    nameEl.value = ""; contactEl.value = ""; emailEl.value = ""; passEl.value = ""; inviteEl.value = ""; busEl.value = "";
    setStatus("");
  });
});
