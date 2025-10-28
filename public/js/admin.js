// public/js/admin.js
// Admin dashboard initialization only after auth ready
import { auth, db } from "./firebaseConfig.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

function el(id) { return document.getElementById(id); }

// Put DOM reads inside DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  const signOutBtn = el("signOutBtn");
  const totalBusesEl = el("totalBuses");
  const activeNowEl = el("activeNow");
  const totalRoutesEl = el("totalRoutes");
  const liveTrackingEl = el("liveTracking");
  const eventsLogEl = el("eventsLog");
  const welcomeEl = el("welcome");
  const adminNameEl = el("adminName");

  function logEvent(text) {
    if (!eventsLogEl) return;
    const d = document.createElement("div");
    d.className = "event-line";
    d.textContent = `${new Date().toLocaleTimeString()} — ${text}`;
    eventsLogEl.prepend(d);
    while (eventsLogEl.children.length > 40) eventsLogEl.removeChild(eventsLogEl.lastChild);
  }

  // Initialize dashboard only after auth confirmed
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Not signed in — redirect to login
      window.location.href = "/login.html";
      return;
    }

    const shortName = (user.displayName || user.email || "Admin").toUpperCase();
    welcomeEl && (welcomeEl.textContent = `Welcome back, ${shortName}!`);
    adminNameEl && (adminNameEl.textContent = shortName);
    logEvent(`Signed in: ${user.email}`);

    // Realtime counts for buses collection
    const busesCol = collection(db, "buses");
    onSnapshot(busesCol, (snap) => {
      totalBusesEl && (totalBusesEl.textContent = snap.size);
      // live tracking count
      if (liveTrackingEl) {
        let live = 0;
        snap.docs.forEach(d => {
          const data = d.data();
          if (data?.currentLocation?.lat && data?.currentLocation?.lng) live++;
        });
        liveTrackingEl.textContent = live;
      }
      logEvent(`buses collection updated: ${snap.size}`);
    }, (err) => {
      console.error("buses snapshot error", err);
      logEvent("buses snapshot error: " + err.message);
    });

    // routes snapshot
    const routesCol = collection(db, "routes");
    onSnapshot(routesCol, (snap) => {
      totalRoutesEl && (totalRoutesEl.textContent = snap.size);
      logEvent(`routes count: ${snap.size}`);
    });

    // active now calculation (client side)
    onSnapshot(busesCol, (snap) => {
      const now = Date.now();
      const tenMin = 10 * 60 * 1000;
      let active = 0;
      snap.docs.forEach(doc => {
        const data = doc.data();
        const lastSeen = data?.lastSeen;
        if (lastSeen && lastSeen.toDate) {
          const diff = now - lastSeen.toDate().getTime();
          if (diff <= tenMin) active++;
        }
      });
      activeNowEl && (activeNowEl.textContent = active);
    });

    // logs: listen last 30 entries
    const logsQuery = query(collection(db, "logs"), orderBy("ts", "desc"), limit(30));
    onSnapshot(logsQuery, (snap) => {
      eventsLogEl && (eventsLogEl.innerHTML = "");
      snap.docs.forEach(doc => {
        const d = doc.data();
        const t = d.ts && d.ts.toDate ? d.ts.toDate().toLocaleTimeString() : new Date().toLocaleTimeString();
        const line = `${t} — ${d.action || "log"} — ${d.actorId || ""} ${JSON.stringify(d.meta || {})}`;
        const eln = document.createElement("div");
        eln.className = "event-line";
        eln.textContent = line;
        eventsLogEl.appendChild(eln);
      });
    });

    // Setup navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.getAttribute('data-page');
        
        // Update active states
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Handle page navigation
        switch (page) {
          case 'dashboard':
            showPage('dashboard-page');
            break;
          case 'drivers':
            window.location.href = '/manage-drivers.html';
            break;
          case 'buses':
            window.location.href = '/all-buses.html';
            break;
          case 'live':
            window.location.href = '/live-tracking.html';
            break;
        }
      });
    });

    // Show specific page content
    function showPage(pageId) {
      const pages = document.querySelectorAll('.content-page');
      pages.forEach(page => {
        if (page.id === pageId) {
          page.classList.add('active');
        } else {
          page.classList.remove('active');
        }
      });
    }

    // Signout button
    if (signOutBtn) {
      signOutBtn.addEventListener("click", async () => {
        try {
          await signOut(auth);
          logEvent("Signed out (admin)");
        } catch (e) {
          console.error(e);
        }
      });
    }

    // Quick action buttons
    document.getElementById("gotoDrivers")?.addEventListener("click", () => window.location.href = "/manage-drivers.html");
    document.getElementById("gotoBuses")?.addEventListener("click", () => window.location.href = "/all-buses.html");
    document.getElementById("gotoLive")?.addEventListener("click", () => window.location.href = "/live-tracking.html");
  });
});
