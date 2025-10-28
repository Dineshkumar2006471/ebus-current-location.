import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

let map, markers = {};
function initMap(){
  map = L.map('map').setView([20.5937,78.9629], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

function smoothMove(marker, newLatLng){
  // simple linear interpolation: setLatLng instantly (Leaflet will animate if marker has setLatLng)
  marker.setLatLng(newLatLng);
}

onAuthStateChanged(auth, user => {
  if (!user) return window.location.href = "/login.html";
  initMap();
  const busesCol = collection(db, "buses");
  onSnapshot(busesCol, snap => {
    snap.docs.forEach(d => {
      const id = d.id; const data = d.data();
      const loc = data?.currentLocation;
      if (loc && loc.lat && loc.lng) {
        if (!markers[id]) {
          markers[id] = L.marker([loc.lat, loc.lng]).addTo(map).bindPopup(`${id} ${data.busNumber||''}`);
        } else {
          smoothMove(markers[id], [loc.lat, loc.lng]);
          markers[id].getPopup().setContent(`${id} ${data.busNumber||''}`);
        }
      } else {
        if (markers[id]) { map.removeLayer(markers[id]); delete markers[id]; }
      }
    });
  });
});
