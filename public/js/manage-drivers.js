// public/js/driver.js
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

let geoWatchId = null, lastUpdateTs = 0;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    // not signed in — you may redirect driver to login
    return;
  }
  // UI wiring omitted — make sure page has #start_tracking, #stop_tracking, #bus_id, #bus_number
  document.getElementById("start_tracking")?.addEventListener("click", startGeoTracking);
  document.getElementById("stop_tracking")?.addEventListener("click", stopGeoTracking);
});

function log(s){ console.log("[driver]", s); }

async function postLocation(busId, busNumber, coords) {
  const busRef = doc(db, "buses", busId);
  await setDoc(busRef, {
    busNumber: busNumber || null,
    driverId: auth.currentUser?.uid || null,
    currentLocation: {
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy ?? null,
      speed: coords.speed ?? null,
      heading: coords.heading ?? null,
      ts: serverTimestamp()
    },
    lastSeen: serverTimestamp()
  }, { merge: true });
  // append history
  await addDoc(collection(db, "buses", busId, "updates"), {
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy: coords.accuracy ?? null,
    speed: coords.speed ?? null,
    heading: coords.heading ?? null,
    ts: serverTimestamp()
  });
  log("posted location " + busId);
}

function startGeoTracking(){
  const busId = document.getElementById("bus_id").value.trim();
  const busNumber = document.getElementById("bus_number").value.trim();
  if (!busId) { alert("Enter bus id"); return; }
  const intervalSec = Math.max(3, Number(document.getElementById("update_interval")?.value || 8));
  const desiredIntervalMs = intervalSec * 1000;
  if (!navigator.geolocation) { alert("Geolocation not supported"); return; }

  geoWatchId = navigator.geolocation.watchPosition(async pos => {
    const now = Date.now();
    if (now - lastUpdateTs < desiredIntervalMs) return;
    lastUpdateTs = now;
    try { await postLocation(busId, busNumber, pos.coords); } catch (e){ console.error(e); }
  }, err => { console.error("geo", err); alert("Geo error: "+err.message); }, { enableHighAccuracy: true, maximumAge: 2000, timeout:10000 });

  document.getElementById("start_tracking").disabled = true;
  document.getElementById("stop_tracking").disabled = false;
}

function stopGeoTracking(){
  if (geoWatchId != null) { navigator.geolocation.clearWatch(geoWatchId); geoWatchId = null; }
  document.getElementById("start_tracking").disabled = false;
  document.getElementById("stop_tracking").disabled = true;
  log("stopped tracking");
}
