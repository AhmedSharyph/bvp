const SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzcGFP-oVgvh5tnWldFqwYaMRhVZootEhxwnlTRhw5UATLfS9S-wMqtOv9agkMOYU6a5g/exec"; // Replace later

let clients = JSON.parse(localStorage.getItem('clients')) || [];
let selectedClient = null;

// Load client list on start
document.addEventListener('DOMContentLoaded', () => {
  renderClientList();
  registerServiceWorker();
  window.addEventListener('online', syncData);
});

function renderClientList() {
  const list = document.getElementById('clientList');
  list.innerHTML = '';
  clients.forEach((c, idx) => {
    const div = document.createElement('div');
    div.className = 'client-card';
    div.textContent = c.name;
    div.onclick = () => openClient(idx);
    list.appendChild(div);
  });
}

function showAddClientForm() {
  document.getElementById('addClientForm').style.display = 'block';
}

function addClient() {
  const name = document.getElementById('newClientName').value.trim();
  if (!name) return;
  clients.push({ name, visits: [] });
  saveLocal();
  renderClientList();
  document.getElementById('newClientName').value = '';
  document.getElementById('addClientForm').style.display = 'none';
}

function openClient(index) {
  selectedClient = index;
  document.getElementById('homePage').style.display = 'none';
  document.getElementById('clientPage').style.display = 'block';
  document.getElementById('clientNameTitle').textContent = clients[index].name;
  renderVisitHistory();
}

function goHome() {
  selectedClient = null;
  document.getElementById('clientPage').style.display = 'none';
  document.getElementById('homePage').style.display = 'block';
}

function renderVisitHistory() {
  const historyDiv = document.getElementById('visitHistory');
  historyDiv.innerHTML = '';
  const visits = clients[selectedClient].visits;
  visits.sort((a,b) => new Date(b.date) - new Date(a.date));
  visits.forEach(v => {
    const div = document.createElement('div');
    div.className = 'visit-card';
    div.textContent = `Visit on ${v.date} ${v.synced ? '✓' : '(offline)'}`;
    historyDiv.appendChild(div);
  });
}

function showAddVisitForm() {
  document.getElementById('addForm').style.display = 'block';
}

function addVisit() {
  const date = document.getElementById('visitDate').value;
  if (!date) return;
  clients[selectedClient].visits.push({ date, synced: false });
  saveLocal();
  renderVisitHistory();
  document.getElementById('visitDate').value = '';
  document.getElementById('addForm').style.display = 'none';
}

function saveLocal() {
  localStorage.setItem('clients', JSON.stringify(clients));
}

async function syncData() {
  for (const client of clients) {
    for (const visit of client.visits) {
      if (!visit.synced) {
        try {
          await fetch(SHEET_WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({ name: client.name, date: visit.date }),
            headers: { 'Content-Type': 'application/json' }
          });
          visit.synced = true;
        } catch (e) {
          console.log('Sync failed for', client.name, e);
        }
      }
    }
  }
  saveLocal();
  if (selectedClient !== null) renderVisitHistory();
}

// PWA: Service Worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js');
  }
}
