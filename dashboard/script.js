// --- VARIABLES GLOBALES ---
let stats = { total: 0, warnings: 0, criticals: 0, blocked: 0, score: 0 };
let allLogs = [];
let logIdCounter = 1;

// Variables pour les graphiques
let lineChart, doughnutChart;
let eventsTimeline = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let currentSecondEvents = 0;

// --- INITIALISATION AU CHARGEMENT ---
document.addEventListener("DOMContentLoaded", () => {
    initCharts();

    // Timer qui pousse les données dans le graph chaque seconde
    setInterval(() => {
        eventsTimeline.shift();
        eventsTimeline.push(currentSecondEvents);
        lineChart.update();
        currentSecondEvents = 0;
    }, 1000);
});

// --- GESTION DES VUES (ONGLETS) ---
function switchView(viewName, element) {
    document.querySelectorAll('#nav-menu li').forEach(li => li.classList.remove('active'));
    element.classList.add('active');

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
    document.getElementById('view-' + viewName).classList.add('active-view');

    const titles = {
        'overview': 'Global Threat Dashboard',
        'alerts': 'Incident Response & Alerts',
        'history': 'Event Database'
    };
    document.getElementById('page-title').innerText = titles[viewName];
}

// --- GRAPHIQUES (CHART.JS) ---
function initCharts() {
    const ctxLine = document.getElementById('lineChart').getContext('2d');
    lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: ['-9s', '-8s', '-7s', '-6s', '-5s', '-4s', '-3s', '-2s', '-1s', 'Live'],
            datasets: [{
                label: 'Events/sec',
                data: eventsTimeline,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2, fill: true, tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true, suggestedMax: 10 } }, plugins: { legend: { display: false } } }
    });

    const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');
    doughnutChart = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: ['INFO', 'WARNING', 'CRITICAL'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } } }
    });
}

// --- FONCTION PRINCIPALE DE LOGGING ---
function createLog(level, message, ip = "N/A") {
    stats.total++;
    currentSecondEvents++;
    if (level === "WARNING") stats.warnings++;
    if (level === "CRITICAL") stats.criticals++;

    const now = new Date().toLocaleTimeString();
    const logEntry = { id: logIdCounter++, time: now, level: level, ip: ip, message: message };
    allLogs.push(logEntry);

    updateOverviewDashboard();
    addLogToTerminal(logEntry);

    if (level === "CRITICAL") {
        addLogToAlertsTable(logEntry);
    }

    addLogToHistoryTable(logEntry);
}

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

function addLogToTerminal(log) {
    const terminal = document.getElementById('terminal');
    const div = document.createElement('div');
    div.className = `log log-${log.level.toLowerCase()}`;

    let logHTML = `<span class="log-time">[${log.time}]</span> <strong>[${log.level}]</strong> IP: ${log.ip} - ${log.message}`;

    // RETOUR DE L'INTERACTIVITÉ : Ajout du bouton directement dans le terminal !
    if (log.level === "CRITICAL" && log.ip !== "SOC_ADMIN") {
        logHTML += ` <button class="btn-block" style="margin-left: 10px; padding: 2px 8px; font-size: 0.8rem;" onclick="blockIP('${log.ip}', ${log.id}, this)">Bloquer IP</button>`;
    }

    div.innerHTML = logHTML;
    terminal.appendChild(div);
    terminal.scrollTop = terminal.scrollHeight;
}

// --- GESTION DES TABLES (ALERTES & HISTORIQUE) ---
function addLogToAlertsTable(log) {
    const tbody = document.getElementById('alerts-table-body');
    const tr = document.createElement('tr');
    tr.id = `alert-${log.id}`;
    tr.innerHTML = `
        <td>${log.time}</td>
        <td><span class="badge badge-critical">${log.level}</span></td>
        <td class="ip-font">${log.ip}</td>
        <td>${log.message}</td>
        <td><button class="btn-block" onclick="blockIP('${log.ip}', ${log.id}, this)">Bloquer IP</button></td>
    `;
    tbody.insertBefore(tr, tbody.firstChild);
}

function addLogToHistoryTable(log) {
    const tbody = document.getElementById('history-table-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>#${log.id}</td>
        <td>${log.time}</td>
        <td><span class="badge badge-${log.level.toLowerCase()}">${log.level}</span></td>
        <td class="ip-font">${log.ip}</td>
        <td>${log.message}</td>
    `;
    tbody.insertBefore(tr, tbody.firstChild);
}

// --- ACTION SOC (RÉSOLUTION ET DÉFENSE) ---
function blockIP(ip, logId, btnElement) {
    stats.blocked++;
    stats.score += 50;

    // Met à jour le bouton sur lequel on a cliqué (pour montrer que ça a marché)
    btnElement.innerText = "Bloqué ✓";
    btnElement.style.background = "#10b981";
    btnElement.style.color = "white";
    btnElement.style.border = "none";
    btnElement.onclick = null; // Désactive le bouton pour éviter de cliquer 2 fois

    // Crée un log d'information pour confirmer l'action !
    createLog("INFO", `[ACTION SOC] IP ${ip} bloquée et ajoutée au pare-feu.`, "SOC_ADMIN");
}

// --- GÉNÉRATEUR D'ATTAQUES ---
function triggerAttack(type) {
    const ip = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.1`;

    switch (type) {
        case 'brute':
            createLog("INFO", "Nouvelle connexion SSH entrante", ip);
            let count = 0;
            const bInt = setInterval(() => {
                createLog("WARNING", "sshd: Failed password for root", ip);
                if (++count >= 4) {
                    clearInterval(bInt);
                    setTimeout(() => createLog("CRITICAL", "BRUTE FORCE SSH DÉTECTÉ", ip), 200);
                }
            }, 300);
            break;

        case 'scan':
            createLog("INFO", "TCP SYN Packet received port 80", ip);
            setTimeout(() => createLog("INFO", "TCP SYN Packet received port 443", ip), 100);
            setTimeout(() => createLog("WARNING", "Connexion suspecte port 22", ip), 250);
            setTimeout(() => createLog("WARNING", "Connexion suspecte port 3306", ip), 350);
            setTimeout(() => createLog("WARNING", "Connexion suspecte port 21", ip), 450);
            setTimeout(() => createLog("CRITICAL", "SCAN DE PORTS HORIZONTAL DÉTECTÉ", ip), 600);
            break;

        case 'sqli':
            createLog("INFO", "GET /store/items.php?id=1 HTTP/1.1 200 OK", ip);
            setTimeout(() => createLog("WARNING", "GET /store/items.php?id=1' HTTP/1.1 500 ERROR", ip), 800);
            setTimeout(() => createLog("WARNING", "GET /store/items.php?id=1' OR '1'='1 HTTP/1.1 200 OK", ip), 1600);
            setTimeout(() => createLog("CRITICAL", "INJECTION SQL RÉUSSIE (Bypass Authentification)", ip), 2000);
            break;

        case 'ddos':
            createLog("WARNING", "Détection pic de requêtes inexpliqué", "Multiple IPs");
            for (let i = 0; i < 15; i++) {
                setTimeout(() => createLog("INFO", "GET / HTTP/1.1", `Botnet Node ${i}`), i * 50);
            }
            setTimeout(() => createLog("CRITICAL", "ATTAQUE DDoS VOLUMÉTRIQUE DÉTECTÉE (Saturation)", "Multiple IPs"), 800);
            break;

        case 'malware':
            const targetIp = "10.0.5.42";
            createLog("INFO", "Téléchargement fichier : invoice_urgent.pdf.exe", targetIp);
            setTimeout(() => createLog("WARNING", "Processus enfant suspect créé (cmd.exe)", targetIp), 1500);
            setTimeout(() => createLog("WARNING", "Connexion réseau vers un domaine C2 (Tor)", targetIp), 2200);
            setTimeout(() => createLog("CRITICAL", "ALERTE EDR : EXECUTION RANSOMWARE (WannaCry)", targetIp), 3000);
            break;
    }
}