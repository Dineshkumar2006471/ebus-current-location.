// public/js/all-buses.js
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  doc, setDoc, collection, onSnapshot, serverTimestamp, deleteDoc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

function $(id) { return document.getElementById(id); }

// Format timestamp to relative time
function formatRelativeTime(timestamp) {
  if (!timestamp) return '-';
  const now = new Date();
  const date = new Date(timestamp.toMillis());
  const diff = Math.floor((now - date) / 1000); // difference in seconds

  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + ' mins ago';
  if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
  return date.toLocaleDateString();
}

// Create a bus card element
function createBusCard(id, data) {
  const card = document.createElement('div');
  card.className = 'bus-card';
  card.innerHTML = `
    <div class="bus-header">
      <div class="bus-id">Bus #${id}</div>
      <div class="bus-status ${data.isActive ? 'status-active' : ''}">${data.isActive ? 'Active' : 'Inactive'}</div>
    </div>
    <div class="bus-info">
      <div class="info-item">
        <span>Bus Number</span>
        <span class="info-value">${data.busNumber || '-'}</span>
      </div>
      <div class="info-item">
        <span>Driver ID</span>
        <span class="info-value">${data.driverId || 'Unassigned'}</span>
      </div>
      <div class="info-item">
        <span>Last Updated</span>
        <span class="info-value">${formatRelativeTime(data.updatedAt)}</span>
      </div>
    </div>
    <div class="bus-actions">
      <button class="btn secondary small edit-btn" data-id="${id}">
        <span class="btn-icon">✏️</span>
        Edit
      </button>
      <button class="btn secondary small view-btn" data-id="${id}">
        <span class="btn-icon">📍</span>
        Track
      </button>
      <button class="btn secondary small del-btn" data-id="${id}">
        <span class="btn-icon">🗑️</span>
        Remove
      </button>
    </div>
  `;
  return card;
}

document.addEventListener("DOMContentLoaded", () => {
  const idInput = $("bus_id");
  const numberInput = $("bus_number");
  const driverInput = $("bus_driver");
  const saveBtn = $("saveBus");
  const clearBtn = $("clearBus");
  const refreshBtn = $("refreshBuses");
  const listDiv = $("busesList");
  let unsubscribe = null;

  // Show loading animation
  const showLoading = () => {
    const loader = document.querySelector('.loading');
    if (loader) loader.style.display = 'block';
  };

  // Hide loading animation
  const hideLoading = () => {
    const loader = document.querySelector('.loading');
    if (loader) loader.style.display = 'none';
  };

  // Subscribe to buses collection
  function subscribeToBuses() {
    if (unsubscribe) unsubscribe();
    
    showLoading();
    unsubscribe = onSnapshot(collection(db, "buses"), (snap) => {
      hideLoading();
      listDiv.innerHTML = "";
      
      if (snap.empty) {
        listDiv.innerHTML = `
          <div class="empty-state">
            <p>No buses registered yet.</p>
          </div>
        `;
        return;
      }

      snap.docs.forEach(doc => {
        const data = doc.data();
        const card = createBusCard(doc.id, data);
        listDiv.appendChild(card);
      });

      // Add event listeners to buttons
      setupButtonListeners();
    }, (error) => {
      console.error("Error fetching buses:", error);
      hideLoading();
      listDiv.innerHTML = `
        <div class="error-state">
          <p>Error loading buses. Please try again.</p>
        </div>
      `;
    });
  }

  // Setup button event listeners
  function setupButtonListeners() {
    // Delete buttons
    listDiv.querySelectorAll(".del-btn").forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (!confirm(`Are you sure you want to remove bus #${id}?`)) return;
        
        try {
          showLoading();
          await deleteDoc(doc(db, "buses", id));
          hideLoading();
        } catch (error) {
          console.error("Error deleting bus:", error);
          hideLoading();
          alert("Failed to delete bus. Please try again.");
        }
      };
    });

    // View/Track buttons
    listDiv.querySelectorAll(".view-btn").forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        window.location.href = `/live-tracking.html?focus=${encodeURIComponent(id)}`;
      };
    });

    // Edit buttons
    listDiv.querySelectorAll(".edit-btn").forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        try {
          showLoading();
          const busDoc = await getDoc(doc(db, "buses", id));
          hideLoading();
          
          if (busDoc.exists()) {
            const data = busDoc.data();
            idInput.value = id;
            numberInput.value = data.busNumber || '';
            driverInput.value = data.driverId || '';
            idInput.disabled = true; // Prevent ID modification during edit
            saveBtn.textContent = '💾 Update Bus';
            
            // Scroll to form
            document.querySelector('.add-bus-card').scrollIntoView({ behavior: 'smooth' });
          }
        } catch (error) {
          console.error("Error fetching bus details:", error);
          hideLoading();
          alert("Failed to load bus details. Please try again.");
        }
      };
    });
  }

  // Save/Update bus
  saveBtn.addEventListener("click", async () => {
    const id = idInput.value.trim();
    if (!id) {
      alert("Please enter a bus ID");
      return;
    }

    try {
      showLoading();
      const payload = {
        busNumber: numberInput.value.trim() || null,
        driverId: driverInput.value.trim() || null,
        updatedAt: serverTimestamp(),
        isActive: true // Set as active by default when creating/updating
      };

      await setDoc(doc(db, "buses", id), payload, { merge: true });
      hideLoading();
      
      // Reset form
      clearBtn.click();
      idInput.disabled = false;
      saveBtn.textContent = '💾 Save Bus';
      alert("Bus saved successfully!");
    } catch (error) {
      console.error("Error saving bus:", error);
      hideLoading();
      alert("Failed to save bus. Please try again.");
    }
  });

  // Clear form
  clearBtn.addEventListener("click", () => {
    idInput.value = "";
    numberInput.value = "";
    driverInput.value = "";
    idInput.disabled = false;
    saveBtn.textContent = '💾 Save Bus';
  });

  // Refresh bus list
  refreshBtn.addEventListener("click", () => {
    subscribeToBuses();
  });

  // Check authentication and initialize
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "/login.html";
      return;
    }
    subscribeToBuses();
  });
});