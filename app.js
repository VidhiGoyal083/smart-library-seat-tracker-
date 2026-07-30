/* ============================================================
   Library Seat Tracker — Application Logic (Student-Friendly)
   ============================================================ */

// ---- Configuration ----
const CONFIG = {
  totalSeats: 60,
  zones: [
    { name: 'A', label: 'Zone A — Ground Floor', count: 20 },
    { name: 'B', label: 'Zone B — First Floor',  count: 20 },
    { name: 'C', label: 'Zone C — Reading Hall',  count: 20 },
  ],
  demoInterval: 5000,
  sessionKey: 'lst_student_session',
};

// ---- State ----
let seats = [];
let activityLog = [];
let demoTimer = null;

// ---- Initialize Seats ----
function initSeats() {
  seats = [];
  let id = 1;
  CONFIG.zones.forEach(zone => {
    for (let i = 1; i <= zone.count; i++) {
      seats.push({
        id: id++,
        label: zone.name + i,
        zone: zone.label,
        zonePrefix: zone.name,
        status: 'free',  // free | busy | booked
        lastUpdated: new Date(),
      });
    }
  });
}

// ---- Login Handler ----
function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const studentId = document.getElementById('studentId').value.trim();

  if (!studentId) {
    showToast('❌ Please enter your Student ID', 'error');
    return false;
  }

  btn.classList.add('loading');

  setTimeout(() => {
    localStorage.setItem(CONFIG.sessionKey, studentId);
    showToast('✅ Welcome, ' + studentId + '! Loading dashboard…', 'success');
    setTimeout(() => {
      showDashboard();
      btn.classList.remove('loading');
    }, 600);
  }, 800);

  return false;
}

// ---- Screen Switching ----
function showDashboard() {
  document.getElementById('welcomeScreen').classList.add('hidden');
  const dash = document.getElementById('mainDashboard');
  dash.classList.remove('hidden');
  initSeats();
  randomizeSeats();
  renderSeatMap();
  renderStats();
  startDemoMode();
}

function goBackToWelcome() {
  stopDemoMode();
  localStorage.removeItem(CONFIG.sessionKey);
  document.getElementById('mainDashboard').classList.add('hidden');
  document.getElementById('welcomeScreen').classList.remove('hidden');
  showToast('👋 See you next time!', 'info');
}

// ---- Check Existing Session ----
function checkSession() {
  if (localStorage.getItem(CONFIG.sessionKey)) {
    showDashboard();
  }
}

// ---- Seat Map Rendering ----
function renderSeatMap() {
  const mapContainer = document.getElementById('seatMap');
  if (!mapContainer) return;
  mapContainer.innerHTML = '';

  seats.forEach(seat => {
    const div = document.createElement('div');
    div.className = `seat ${seat.status}`;
    div.id = `seat-${seat.id}`;
    div.title = `${seat.label} — ${capitalize(seat.status)}`;
    div.innerHTML = `
      <span>${seat.label}</span>
      <span class="seat-label">${seat.status === 'free' ? '✓' : seat.status === 'busy' ? '●' : '◎'}</span>
    `;
    mapContainer.appendChild(div);
  });
}

// ---- Stats ----
function renderStats() {
  const counts = getCounts();
  animateNumber('availableSeats', counts.free);
  animateNumber('occupiedSeats', counts.busy);
  animateNumber('totalSeats', counts.total);
}

function getCounts() {
  const c = { total: seats.length, free: 0, busy: 0, booked: 0 };
  seats.forEach(s => { c[s.status]++; });
  return c;
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;

  const diff = target - current;
  const step = diff > 0 ? 1 : -1;
  let value = current;
  const interval = setInterval(() => {
    value += step;
    el.textContent = value;
    if (value === target) clearInterval(interval);
  }, 30);
}

// ---- Activity Log ----
function renderActivityLog() {
  const list = document.getElementById('activityList');
  if (!list) return;
  list.innerHTML = '';

  activityLog.slice(-15).reverse().forEach(entry => {
    const li = document.createElement('li');
    li.className = 'activity-item';
    const dotClass = entry.status === 'free' ? 'green' : entry.status === 'busy' ? 'red' : 'purple';
    const statusText = entry.status === 'free' ? 'Free' : entry.status === 'busy' ? 'Occupied' : 'Booked';

    li.innerHTML = `
      <span class="activity-dot ${dotClass}"></span>
      <div>
        <div class="activity-text">Seat <strong>${entry.seat}</strong> → ${statusText}</div>
        <div class="activity-time">${formatTime(entry.time)}</div>
      </div>
    `;
    list.appendChild(li);
  });
}

// ---- Demo Mode ----
function startDemoMode() {
  if (demoTimer) clearInterval(demoTimer);
  demoTimer = setInterval(() => {
    updateRandomSeats(3);
    renderStats();
    renderActivityLog();
  }, CONFIG.demoInterval);
}

function stopDemoMode() {
  if (demoTimer) {
    clearInterval(demoTimer);
    demoTimer = null;
  }
}

function randomizeSeats() {
  seats.forEach(seat => {
    const rand = Math.random();
    if (rand < 0.55)       seat.status = 'free';
    else if (rand < 0.85)  seat.status = 'busy';
    else                   seat.status = 'booked';
    seat.lastUpdated = new Date();
  });
}

function updateRandomSeats(count) {
  const statuses = ['free', 'busy', 'booked'];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * seats.length);
    const seat = seats[idx];
    const oldStatus = seat.status;
    let newStatus;
    do {
      newStatus = statuses[Math.floor(Math.random() * statuses.length)];
    } while (newStatus === oldStatus);

    seat.status = newStatus;
    seat.lastUpdated = new Date();

    activityLog.push({
      seat: seat.label,
      status: newStatus,
      time: new Date(),
    });

    // Update DOM
    const seatEl = document.getElementById(`seat-${seat.id}`);
    if (seatEl) {
      seatEl.className = `seat ${newStatus}`;
      seatEl.title = `${seat.label} — ${capitalize(newStatus)}`;
      seatEl.innerHTML = `
        <span>${seat.label}</span>
        <span class="seat-label">${newStatus === 'free' ? '✓' : newStatus === 'busy' ? '●' : '◎'}</span>
      `;
      seatEl.classList.add('flash');
      setTimeout(() => seatEl.classList.remove('flash'), 600);
    }
  }
}

// ---- Refresh Button ----
function refreshData() {
  const btn = document.getElementById('refreshBtn');
  if (btn) {
    btn.classList.add('spinning');
    setTimeout(() => btn.classList.remove('spinning'), 800);
  }
  updateRandomSeats(5);
  renderStats();
  renderActivityLog();
  showToast('🔄 Seat data refreshed!', 'info');
}

// ---- ESP32 Integration ----
/**
 * Update a single seat from ESP32 sensor data.
 * @param {string} seatLabel - e.g. "A1", "B5"
 * @param {string} status - "free" | "busy" | "booked"
 */
function updateSeatFromESP32(seatLabel, status) {
  const seat = seats.find(s => s.label === seatLabel);
  if (!seat) return;

  seat.status = status;
  seat.lastUpdated = new Date();

  activityLog.push({ seat: seat.label, status, time: new Date() });

  const seatEl = document.getElementById(`seat-${seat.id}`);
  if (seatEl) {
    seatEl.className = `seat ${status}`;
    seatEl.title = `${seat.label} — ${capitalize(status)}`;
    seatEl.innerHTML = `
      <span>${seat.label}</span>
      <span class="seat-label">${status === 'free' ? '✓' : status === 'busy' ? '●' : '◎'}</span>
    `;
    seatEl.classList.add('flash');
    setTimeout(() => seatEl.classList.remove('flash'), 600);
  }

  renderStats();
  renderActivityLog();
}

/**
 * Start polling ESP32 for live seat data.
 * @param {string} esp32IP - e.g. "192.168.1.100"
 */
function startESP32Polling(esp32IP) {
  stopDemoMode();
  document.getElementById('modeLabel').textContent = 'ESP32 LIVE';
  showToast('🔗 Connected to ESP32 at ' + esp32IP, 'success');

  setInterval(async () => {
    try {
      const resp = await fetch(`http://${esp32IP}/seats`);
      const data = await resp.json();
      if (data.seats && Array.isArray(data.seats)) {
        data.seats.forEach(s => {
          // Map ESP32 status names to our format
          const status = s.status === 'occupied' ? 'busy' :
                         s.status === 'available' ? 'free' : s.status;
          updateSeatFromESP32(s.label, status);
        });
      }
    } catch (err) {
      console.warn('ESP32 poll error:', err);
    }
  }, 3000);
}

// ---- Toast Notifications ----
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

// ---- Utilities ----
function formatTime(date) {
  if (!(date instanceof Date)) date = new Date(date);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---- Boot ----
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});
