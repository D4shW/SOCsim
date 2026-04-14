// --- VARIABLES GLOBALES ---
const API_URL = "http://localhost:8080/api";
let lastSeenLogId = 0;
let allLogs = [];
let stats = { total: 0, warnings: 0, criticals: 0, blocked: 0, score: 0 };

// Variables UX
let lineChart, doughnutChart;
let eventsTimeline = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let currentSecondEvents = 0;
let currentFilter = 'ALL';
let currentSearch = '';
let isPaused = false;
let isCompromised = false;

// Variables Audio
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
let isAudioEnabled = false;

const explanations = {
    'brute': "<strong>Brute Force :</strong> L'attaquant teste des milliers de mots de passe.",
    'scan': "<strong>Scan de Ports :</strong> L'attaquant cherche des portes ouvertes sur le serveur.",
    'sqli': "<strong>Injection SQL :</strong> Tentative de manipulation de la base de données web.",
    'ddos': "<strong>DDoS :</strong> Saturation du serveur par un afflux de requêtes.",
    'malware': "<strong>Malware :</strong> Téléchargement et exécution d'un logiciel malveillant (ex: Ransomware).",
    'fp': "<strong>Faux Positif :</strong> Activité suspecte mais légitime (erreur d'un employé).",
    'compromised': "🚨 <strong>SERVEUR COMPROMIS :</strong> Vous avez ignoré une attaque réelle. Le réseau est tombé. GAME OVER."
};

// ==========================================
// 🖥️ BOOT SCREEN & INITIALISATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Séquence de démarrage du SOC
    setTimeout(() => {
        document.getElementById('boot-text').innerHTML += "> SENSORS ONLINE. INITIALIZING UI...<br>";
    }, 800);
    setTimeout(() => {
        document.getElementById('boot-screen').style.opacity = '0';
        setTimeout(() => document.getElementById('boot-screen').style.display = 'none', 1000);
        initCharts();
    }, 1800);

    setInterval(syncWithBackend, 1000);
    setInterval(() => {
        if (!isPaused) {
            eventsTimeline.shift(); eventsTimeline.push(currentSecondEvents);
            lineChart.update(); currentSecondEvents = 0;
        }
    }, 1000);
});

// ==========================================
// 🔊 SYNTHÉTISEUR AUDIO (Web Audio API)
// ==========================================
function toggleAudio() {
    isAudioEnabled = !isAudioEnabled;
    const btn = document.getElementById('btn-audio');
    if (isAudioEnabled) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        btn.innerText = "🔊 Audio ON";
        btn.style.background = "var(--info)";
        btn.style.color = "white";
    } else {
        btn.innerText = "🔇 Audio OFF";
        btn.style.background = "#334155";
    }
}

function playRadarSound(level) {
    if (!isAudioEnabled || audioCtx.state === 'suspended') return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (level === "INFO") {
        // Petit bip très discret
        osc.type = 'sine'; osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    }
    else if (level === "WARNING") {
        // Bip grave
        osc.type = 'triangle'; osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    }
    else if (level === "CRITICAL") {
        // Double bip strident
        osc.type = 'square'; osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    }
}

function playGameOverAlarm() {
    if (!isAudioEnabled || audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.5);
    osc.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 1);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

    osc.start(); osc.stop(audioCtx.currentTime + 3); // Sonne pendant 3 sec
}

// ==========================================
// 📡 COMMUNICATION BACKEND & LOGIQUE UI
// ==========================================
async function syncWithBackend() {
    try {
        const res = await fetch(`${API_URL}/state`);
        const data = await res.json();

        stats = data.stats;
        updateOverviewDashboard();

        if (stats.compromised && !isCompromised) triggerGameOver();

        const newLogs = (data.logs || []).filter(log => log.id > lastSeenLogId);

        if (newLogs.length > 0 && !isPaused) {
            currentSecondEvents += newLogs.length;
            newLogs.forEach(log => {
                allLogs.push(log);
                appendSingleLogToTerminal(log, true);
                if (log.level === "CRITICAL") addLogToAlertsTable(log);
                addLogToHistoryTable(log);
                lastSeenLogId = log.id;

                playRadarSound(log.level); // Joue le son !
            });
        }
    } catch (e) { }
}

// Génère le Tag réseau (LAN/WAN/SYS) en fonction de l'IP
function getNetworkTag(ip) {
    if (ip === "SYSTEM" || ip === "SOC") return `<span class="net-tag tag-sys">SYS</span>`;
    if (ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) return `<span class="net-tag tag-lan">LAN</span>`;
    if (ip === "Multiple IPs") return `<span class="net-tag tag-wan">WAN</span>`;
    return `<span class="net-tag tag-wan">WAN</span>`;
}

function appendSingleLogToTerminal(log, autoScroll = true) {
    if (currentFilter !== 'ALL' && log.level !== currentFilter) return;
    if (currentSearch && !log.message.toLowerCase().includes(currentSearch) && !log.ip.includes(currentSearch)) return;

    const terminal = document.getElementById('terminal');
    const div = document.createElement('div');
    div.className = `log log-${log.level.toLowerCase()}`;

    const netTag = getNetworkTag(log.ip);

    let logHTML = `<span class="log-time">[${log.time}]</span> ${netTag} <strong>[${log.level}]</strong> IP: <span class="ip-link" onclick="analyzeIP('${log.ip}')">${log.ip}</span> - ${log.message}`;

    if (log.level === "CRITICAL" && log.ip !== "SOC" && log.ip !== "SYSTEM") {
        logHTML += `<br><button class="btn-block" style="margin-top:5px;" onclick="handleAlert('${log.ip}', ${log.isFP}, 'block', this)">Bloquer IP</button>
                    <button class="btn-ignore" style="margin-top:5px; margin-left:5px;" onclick="handleAlert('${log.ip}', ${log.isFP}, 'ignore', this)">Ignorer (FP)</button>`;
    }

    div.innerHTML = logHTML;
    terminal.appendChild(div);
    if (autoScroll) terminal.scrollTop = terminal.scrollHeight;
}

function addLogToAlertsTable(log) {
    if (log.ip === "SYSTEM" || log.ip === "SOC") return;
    const tbody = document.getElementById('alerts-table-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${log.time}</td><td><span class="badge badge-critical">${log.level}</span></td><td>${getNetworkTag(log.ip)}</td><td><span class="ip-link" onclick="analyzeIP('${log.ip}')">${log.ip}</span></td><td>${log.message}</td><td><button class="btn-edu" onclick="openExplanation('${log.type}')">🎓</button></td><td><button class="btn-block" onclick="handleAlert('${log.ip}', ${log.isFP}, 'block', this)">Bloquer</button> <button class="btn-ignore" onclick="handleAlert('${log.ip}', ${log.isFP}, 'ignore', this)">Ignorer</button></td>`;
    tbody.insertBefore(tr, tbody.firstChild);
}

function addLogToHistoryTable(log) {
    const tbody = document.getElementById('history-table-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>#${log.id}</td><td>${log.time}</td><td><span class="badge badge-${log.level.toLowerCase()}">${log.level}</span></td><td>${getNetworkTag(log.ip)}</td><td>${log.ip}</td><td>${log.message}</td>`;
    tbody.insertBefore(tr, tbody.firstChild);
}

function triggerGameOver() {
    isCompromised = true;
    document.getElementById('score').style.color = "var(--critical)";
    document.body.classList.add('compromised-flash');
    document.getElementById('global-status').className = "status-badge compromised";
    document.getElementById('global-status').innerText = "🚨 SYSTÈME COMPROMIS";

    playGameOverAlarm();

    setTimeout(() => {
        openExplanation('compromised');
        document.getElementById('modal-title').innerText = "💀 INCIDENT MAJEUR";
        document.querySelector('.modal-header').style.background = "#7f1d1d";
    }, 1500);
}

// Les fonctions standards inchangées
async function triggerAttack(type) { if (isCompromised) return; await fetch(`${API_URL}/attack?type=${type}`); }
async function handleAlert(ip, isFP, action, btnElement) { if (isCompromised) return; btnElement.parentElement.innerHTML = `<span style="font-weight:bold; color:${action === 'block' ? 'var(--critical)' : 'var(--warning)'}">Action : ${action.toUpperCase()}</span>`; await fetch(`${API_URL}/action?ip=${ip}&action=${action}&isFP=${isFP}`); }
function updateOverviewDashboard() { document.getElementById('total-logs').innerText = stats.total; document.getElementById('total-warnings').innerText = stats.warnings; document.getElementById('total-criticals').innerText = stats.criticals; document.getElementById('total-blocked').innerText = stats.blocked; document.getElementById('score').innerText = stats.score; doughnutChart.data.datasets[0].data = [stats.total - stats.warnings - stats.criticals, stats.warnings, stats.criticals]; doughnutChart.update(); }
function filterLogs() { currentSearch = document.getElementById('search-logs').value.toLowerCase(); currentFilter = document.getElementById('filter-level').value; const terminal = document.getElementById('terminal'); terminal.innerHTML = ''; const filteredLogs = allLogs.filter(log => { if (currentFilter !== 'ALL' && log.level !== currentFilter) return false; if (currentSearch && !log.message.toLowerCase().includes(currentSearch) && !log.ip.includes(currentSearch)) return false; return true; }).slice(-100); filteredLogs.forEach(log => appendSingleLogToTerminal(log, false)); terminal.scrollTop = terminal.scrollHeight; }
function togglePause() { isPaused = !isPaused; const btn = document.getElementById('btn-pause'); if (isPaused) { btn.innerText = "▶️ Reprendre"; btn.classList.add('paused'); } else { btn.innerText = "⏸️ Pause"; btn.classList.remove('paused'); filterLogs(); } }
function startMission(id) { if (isCompromised) return alert("Système compromis."); switchView('overview', document.querySelector('#nav-menu li:first-child')); if (id === 1) { setTimeout(() => triggerAttack('scan'), 1000); setTimeout(() => triggerAttack('false_positive'), 3000); } else if (id === 2) { setTimeout(() => triggerAttack('ddos'), 1000); setTimeout(() => triggerAttack('brute'), 2000); } }
function switchView(v, e) { document.querySelectorAll('#nav-menu li').forEach(l => l.classList.remove('active')); e.classList.add('active'); document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view')); document.getElementById('view-' + v).classList.add('active-view'); }
function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }
function analyzeIP(ip) { const ipLogs = allLogs.filter(l => l.ip === ip); let html = `<div class="threat-intel"><p><strong>Threat Intel pour ${ip}</strong></p></div><div class="timeline">`; ipLogs.forEach(l => { html += `<div class="timeline-item"><strong>[${l.time}]</strong> <span class="badge badge-${l.level.toLowerCase()}">${l.level}</span> : ${l.message}</div>`; }); html += `</div>`; document.getElementById('modal-title').innerText = `Analyse : ${ip}`; document.getElementById('modal-body').innerHTML = html; document.getElementById('modal-overlay').classList.remove('hidden'); }
function openExplanation(t) { document.getElementById('modal-title').innerText = `🎓 Comprendre`; document.getElementById('modal-body').innerHTML = `<p>${explanations[t] || explanations['fp']}</p>`; document.getElementById('modal-overlay').classList.remove('hidden'); }
function initCharts() { const ctxLine = document.getElementById('lineChart').getContext('2d'); lineChart = new Chart(ctxLine, { type: 'line', data: { labels: ['-9s', '-8s', '-7s', '-6s', '-5s', '-4s', '-3s', '-2s', '-1s', 'Live'], datasets: [{ label: 'Events', data: eventsTimeline, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 2, fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } } }); const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d'); doughnutChart = new Chart(ctxDoughnut, { type: 'doughnut', data: { labels: ['INFO', 'WARNING', 'CRITICAL'], datasets: [{ data: [0, 0, 0], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } } } }); }