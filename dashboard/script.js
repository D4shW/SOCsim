// --- VARIABLES STATISTIQUES ---
let stats = {
    total: 0,
    warnings: 0,
    criticals: 0,
    blocked: 0,
    score: 0
};

const terminal = document.getElementById('terminal');

// --- FONCTION DE MISE À JOUR DES COMPTEURS ---
function updateDashboard() {
    document.getElementById('total-logs').innerText = stats.total;
    document.getElementById('total-warnings').innerText = stats.warnings;
    document.getElementById('total-criticals').innerText = stats.criticals;
    document.getElementById('total-blocked').innerText = stats.blocked;
    document.getElementById('score').innerText = stats.score;
}

// --- FONCTION POUR ÉCRIRE UN LOG DANS LE TERMINAL ---
function appendLog(level, message, ip = "N/A", showAction = false) {
    stats.total++;
    if (level === "WARNING") stats.warnings++;
    if (level === "CRITICAL") stats.criticals++;

    const now = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `log log-${level.toLowerCase()}`;

    let logHTML = `<span class="log-time">[${now}]</span> <strong>[${level}]</strong> IP: ${ip} - ${message}`;

    // Si c'est critique, on ajoute le bouton d'action pour l'analyste
    if (showAction) {
        logHTML += `<button class="action-btn" onclick="blockIP('${ip}', this)">Bloquer IP</button>`;
    }

    div.innerHTML = logHTML;
    terminal.appendChild(div);

    // Auto-scroll vers le bas
    terminal.scrollTop = terminal.scrollHeight;
    updateDashboard();
}

// --- SIMULATION DES ATTAQUES LORS DU CLIC (Interactif !) ---
function triggerAttack(type) {
    if (type === 'brute') {
        const ip = "192.168.1." + Math.floor(Math.random() * 255);
        appendLog("INFO", "Nouvelle connexion SSH entrante", ip);

        // Simule 5 échecs rapides
        let count = 0;
        const interval = setInterval(() => {
            appendLog("WARNING", "Failed password for root", ip);
            count++;
            if (count >= 5) {
                clearInterval(interval);
                // Déclenche l'alerte critique après 5 échecs
                setTimeout(() => appendLog("CRITICAL", "MULTIPLE LOGIN FAILURES DETECTED. POSSIBLE BRUTE FORCE.", ip, true), 500);
            }
        }, 300);
    }
    else if (type === 'scan') {
        const ip = "10.0.0." + Math.floor(Math.random() * 255);
        appendLog("INFO", "Port 80 (HTTP) accédé", ip);
        setTimeout(() => appendLog("INFO", "Port 443 (HTTPS) accédé", ip), 200);
        setTimeout(() => appendLog("WARNING", "Tentative d'accès Port 22 (SSH)", ip), 400);
        setTimeout(() => appendLog("WARNING", "Tentative d'accès Port 3306 (MySQL)", ip), 600);
        setTimeout(() => appendLog("CRITICAL", "ANOMALOUS PORT SCANNING PATTERN DETECTED", ip, true), 800);
    }
}

// --- ACTION DE L'ANALYSTE ---
function blockIP(ip, buttonElement) {
    stats.blocked++;
    stats.score += 50; // L'analyste gagne 50 points !

    appendLog("INFO", `ACTION SOC: IP ${ip} ajoutée à la blacklist du pare-feu.`, "SOC");

    // On désactive le bouton une fois cliqué
    buttonElement.innerText = "Bloqué ✓";
    buttonElement.style.background = "#10b981";
    buttonElement.style.color = "white";
    buttonElement.style.borderColor = "#10b981";
    buttonElement.disabled = true;

    updateDashboard();
}