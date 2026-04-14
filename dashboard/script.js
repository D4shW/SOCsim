// --- VARIABLES GLOBALES ---
const API_URL = "http://localhost:8080/api";
let lastSeenLogId = 0;
let allLogs = [];
let stats = { total: 0, warnings: 0, criticals: 0, blocked: 0, score: 0 };

// Variables UX & Graphiques
let lineChart, doughnutChart;
let eventsTimeline = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let currentSecondEvents = 0;
let currentFilter = 'ALL';
let currentSearch = '';
let isPaused = false;
let isCompromised = false;

// Dictionnaire Pédagogique
const explanations = {
    'brute': "<strong>Brute Force :</strong> L'attaquant teste des milliers de mots de passe.",
    'scan': "<strong>Scan de Ports :</strong> L'attaquant cherche des portes ouvertes sur le serveur.",
    'sqli': "<strong>Injection SQL :</strong> Tentative de manipulation de la base de données web.",
    'ddos': "<strong>DDoS :</strong> Saturation du serveur par un afflux de requêtes.",
    'malware': "<strong>Malware :</strong> Téléchargement et exécution d'un logiciel malveillant (ex: Ransomware).",
    'fp': "<strong>Faux Positif :</strong> Activité suspecte mais légitime (erreur d'un employé).",
    'compromised': "🚨 <strong>SERVEUR COMPROMIS :</strong> Vous avez ignoré une attaque réelle. Le réseau est tombé. GAME OVER."
};

// --- INITIALISATION ET BOUCLE PRINCIPALE ---
document.addEventListener("DOMContentLoaded", () => {
    initCharts();

    // 1. Synchronisation avec le Backend Go toutes les secondes
    setInterval(syncWithBackend, 1000);

    // 2. Mise à jour du graphique linéaire
    setInterval(() => {
        if (!isPaused) {
            eventsTimeline.shift();
            eventsTimeline.push(currentSecondEvents);
            lineChart.update();
            currentSecondEvents = 0;
        }
    }, 1000);
});

// ==========================================
// 📡 COMMUNICATION AVEC LE BACKEND GO
// ==========================================

async function syncWithBackend() {
    try {
        const res = await fetch(`${API_URL}/state`);
        const data = await res.json();

        // 1. Mettre à jour les KPI
        stats = data.stats;
        updateOverviewDashboard();

        // 2. Vérifier le Game Over
        if (stats.compromised && !isCompromised) {
            triggerGameOver();
        }

        // 3. Traiter les NOUVEAUX logs reçus
        const newLogs = (data.logs || []).filter(log => log.id > lastSeenLogId);

        if (newLogs.length > 0 && !isPaused) {
            currentSecondEvents += newLogs.length;
            newLogs.forEach(log => {
                allLogs.push(log);
                appendSingleLogToTerminal(log, true);
                if (log.level === "CRITICAL") addLogToAlertsTable(log);
                addLogToHistoryTable(log);
                lastSeenLogId = log.id;
            });
        }
    } catch (error) {
        console.error("Erreur de connexion au SOC Backend :", error);
    }
}

async function triggerAttack(type) {
    if (isCompromised) return;
    await fetch(`${API_URL}/attack?type=${type}`);
    console.log(`Ordre envoyé au serveur : Lancer ${type}`);
}

async function handleAlert(ip, isFP, action, btnElement) {
    if (isCompromised) return;

    // Met à jour l'interface locale immédiatement
    btnElement.parentElement.innerHTML = `<span style="font-weight:bold; color:${action === 'block' ? 'var(--critical)' : 'var(--warning)'}">Action : ${action.toUpperCase()}</span>`;

    // Envoie l'action au serveur Go qui calculera le score
    await fetch(`${API_URL}/action?ip=${ip}&action=${action}&isFP=${isFP}`);
}

// ==========================================
// 🖥️ GESTION DE L'INTERFACE (UI)
// ==========================================

function updateOverviewDashboard() {
    document.getElementById('total-logs').innerText = stats.total;
    document.getElementById('total-warnings').innerText = stats.warnings;
    document.getElementById('total-criticals').innerText = stats.criticals;
    document.getElementById('total-blocked').innerText = stats.blocked;
    document.getElementById('score').innerText = stats.score;

    doughnutChart.data.datasets[0].data = [
        stats.total - stats.warnings - stats.criticals,
        stats.warnings,
        stats.criticals
    ];
    doughnutChart.update();
}

function appendSingleLogToTerminal(log, autoScroll = true) {
    // Application des filtres locaux
    if (currentFilter !== 'ALL' && log.level !== currentFilter) return;
    if (currentSearch && !log.message.toLowerCase().includes(currentSearch) && !log.ip.includes(currentSearch)) return;

    const terminal = document.getElementById('terminal');
    const div = document.createElement('div');
    div.className = `log log-${log.level.toLowerCase()}`;

    let logHTML = `<span class="log-time">[${log.time}]</span> <strong>[${log.level}]</strong> IP: <span class="ip-link" onclick="analyzeIP('${log.ip}')">${log.ip}</span> - ${log.message}`;

    if (log.level === "CRITICAL" && log.ip !== "SOC" && log.ip !== "SYSTEM") {
        logHTML += `<br><button class="btn-block" style="margin-top:5px;" onclick="handleAlert('${log.ip}', ${log.isFP}, 'block', this)">Bloquer IP</button>
                    <button class="btn-ignore" style="margin-top:5px; margin-left:5px;" onclick="handleAlert('${log.ip}', ${log.isFP}, 'ignore', this)">Ignorer (FP)</button>`;
    }

    div.innerHTML = logHTML;
    terminal.appendChild(div);
    if (autoScroll) terminal.scrollTop = terminal.scrollHeight;
}

// Les fonctions de table (Alertes et Historique)
function addLogToAlertsTable(log) {
    if (log.ip === "SYSTEM" || log.ip === "SOC") return;
    const tbody = document.getElementById('alerts-table-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${log.time}</td>
        <td><span class="badge badge-critical">${log.level}</span></td>
        <td><span class="ip-link" onclick="analyzeIP('${log.ip}')">${log.ip}</span></td>
        <td>${log.message}</td>
        <td><button class="btn-edu" onclick="openExplanation('${log.type}')">🎓 Comprendre</button></td>
        <td>
            <button class="btn-block" onclick="handleAlert('${log.ip}', ${log.isFP}, 'block', this)">Bloquer</button>
            <button class="btn-ignore" onclick="handleAlert('${log.ip}', ${log.isFP}, 'ignore', this)">Ignorer</button>
        </td>
    `;
    tbody.insertBefore(tr, tbody.firstChild);
}

function addLogToHistoryTable(log) {
    const tbody = document.getElementById('history-table-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>#${log.id}</td><td>${log.time}</td><td><span class="badge badge-${log.level.toLowerCase()}">${log.level}</span></td><td>${log.ip}</td><td>${log.message}</td>`;
    tbody.insertBefore(tr, tbody.firstChild);
}

// ==========================================
// 🚨 GAME OVER ET MÉCANIQUES UX
// ==========================================

function triggerGameOver() {
    isCompromised = true;
    document.getElementById('score').style.color = "var(--critical)";
    document.body.classList.add('compromised-flash');

    const badge = document.getElementById('global-status');
    badge.className = "status-badge compromised";
    badge.innerText = "🚨 SYSTÈME COMPROMIS 🚨";

    setTimeout(() => {
        openExplanation('compromised');
        document.getElementById('modal-title').innerText = "💀 INCIDENT MAJEUR DE SÉCURITÉ";
        document.querySelector('.modal-header').style.background = "#7f1d1d";
    }, 1500);
}

function filterLogs() {
    currentSearch = document.getElementById('search-logs').value.toLowerCase();
    currentFilter = document.getElementById('filter-level').value;

    const terminal = document.getElementById('terminal');
    terminal.innerHTML = '';
    const filteredLogs = allLogs.filter(log => {
        if (currentFilter !== 'ALL' && log.level !== currentFilter) return false;
        if (currentSearch && !log.message.toLowerCase().includes(currentSearch) && !log.ip.includes(currentSearch)) return false;
        return true;
    }).slice(-100);

    filteredLogs.forEach(log => appendSingleLogToTerminal(log, false));
    terminal.scrollTop = terminal.scrollHeight;
}

function togglePause() {
    isPaused = !isPaused;
    const btn = document.getElementById('btn-pause');
    if (isPaused) {
        btn.innerText = "▶️ Reprendre"; btn.classList.add('paused');
    } else {
        btn.innerText = "⏸️ Pause"; btn.classList.remove('paused');
        filterLogs(); // Réaffiche tout ce qui manquait
    }
}

function changeSpeed() {
    alert("Mode vitesse : Avec un vrai Backend, les vitesses sont gérées différemment. Restez en x1 pour la stabilité serveur.");
    document.getElementById('sim-speed').value = "1";
}

function startMission(id) {
    if (isCompromised) return alert("Système compromis. Relancez le serveur Go !");
    switchView('overview', document.querySelector('#nav-menu li:first-child'));

    if (id === 1) {
        setTimeout(() => triggerAttack('scan'), 1000);
        setTimeout(() => triggerAttack('false_positive'), 3000);
    }
    else if (id === 2) {
        setTimeout(() => triggerAttack('ddos'), 1000);
        setTimeout(() => triggerAttack('brute'), 2000);
    }
}

// Routines UI Modales & Graphes
function switchView(v, e) { document.querySelectorAll('#nav-menu li').forEach(l => l.classList.remove('active')); e.classList.add('active'); document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view')); document.getElementById('view-' + v).classList.add('active-view'); }
function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }
function analyzeIP(ip) {
    const ipLogs = allLogs.filter(l => l.ip === ip);
    let html = `<div class="threat-intel"><p><strong>Threat Intel pour ${ip}</strong></p><p>🌍 Geo: Fictive</p></div><div class="timeline">`;
    ipLogs.forEach(l => { html += `<div class="timeline-item"><strong>[${l.time}]</strong> <span class="badge badge-${l.level.toLowerCase()}">${l.level}</span> : ${l.message}</div>`; });
    html += `</div>`;
    document.getElementById('modal-title').innerText = `Analyse : ${ip}`; document.getElementById('modal-body').innerHTML = html; document.getElementById('modal-overlay').classList.remove('hidden');
}
function openExplanation(t) { document.getElementById('modal-title').innerText = `🎓 Comprendre`; document.getElementById('modal-body').innerHTML = `<p>${explanations[t] || explanations['fp']}</p>`; document.getElementById('modal-overlay').classList.remove('hidden'); }

function initCharts() {
    const ctxLine = document.getElementById('lineChart').getContext('2d');
    lineChart = new Chart(ctxLine, { type: 'line', data: { labels: ['-9s', '-8s', '-7s', '-6s', '-5s', '-4s', '-3s', '-2s', '-1s', 'Live'], datasets: [{ label: 'Events', data: eventsTimeline, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 2, fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } } });
    const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');
    doughnutChart = new Chart(ctxDoughnut, { type: 'doughnut', data: { labels: ['INFO', 'WARNING', 'CRITICAL'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } } } });
}