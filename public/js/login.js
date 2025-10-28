// public/js/login.js
// Clean, defensive login logic — avoids circular import problems
import { login, googleSignIn, onAuthChange } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const googleBtn = document.getElementById("googleSignIn");
  const signinBtn = document.getElementById("signinBtn");
  const emailInput = document.getElementById("login_email");
  const passInput = document.getElementById("login_password");
  const statusDiv = document.getElementById("loginStatus");

  function setStatus(msg, isError = false) {
    if (!statusDiv) return;
    statusDiv.textContent = msg;
    statusDiv.style.color = isError ? "#dc2626" : "#10b981";
  }

  let isSigningIn = false;

  googleBtn?.addEventListener("click", async () => {
    if (isSigningIn) return; // Prevent multiple clicks
    
    isSigningIn = true;
    setStatus("Signing in with Google...");
    googleBtn.disabled = true;
    
    try {
      const user = await googleSignIn();
      if (user) {
        setStatus("Signed in successfully!");
        // Short delay to show success message
        setTimeout(() => {
          window.location.href = "/admin.html";
        }, 500);
      } else {
        throw new Error("Failed to get user data");
      }
    } catch (e) {
      console.error("Google sign-in failed", e);
      setStatus(e.message || "Google sign-in failed. Please try again", true);
      googleBtn.disabled = false;
    } finally {
      isSigningIn = false;
    }
  });

  signinBtn?.addEventListener("click", async () => {
    const email = emailInput?.value?.trim();
    const password = passInput?.value;
    if (!email || !password) {
      setStatus("Please enter email and password", true);
      return;
    }
    setStatus("Signing in...");
    try {
      const user = await login(email, password);
      setStatus("Signed in: " + (user.email || user.displayName));
      // IMPORTANT: use absolute URL so firebase rewrites do not interfere
      window.location.href = "/admin.html";
    } catch (e) {
      console.error("Email sign-in failed", e);
      setStatus("Sign-in failed: " + (e.message || e), true);
    }
  });

  // If user already signed in, redirect immediately to the correct page.
  onAuthChange(async (user) => {
    if (user) {
      // You can fetch role here and redirect accordingly. For now go to admin.
      window.location.href = "/admin.html";
    }
  });
});
