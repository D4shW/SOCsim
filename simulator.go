package main

import (
	"fmt"
	"math/rand"
	"time"
)

func randomIP() string {
	return fmt.Sprintf("%d.%d.%d.1", rand.Intn(255), rand.Intn(255), rand.Intn(255))
}

func SimulateAttack(attackType string) {
	if Stats.Compromised {
		return // On arrête tout si le serveur est piraté (Game Over)
	}

	ip := randomIP()

	switch attackType {
	case "brute":
		AddLog("INFO", "Nouvelle connexion SSH entrante", ip, "brute", false)
		for i := 0; i < 4; i++ {
			time.Sleep(300 * time.Millisecond)
			AddLog("WARNING", "sshd: Failed password for root", ip, "brute", false)
		}
		time.Sleep(200 * time.Millisecond)
		AddLog("CRITICAL", "BRUTE FORCE SSH DÉTECTÉ", ip, "brute", false)

	case "scan":
		AddLog("INFO", "TCP SYN Packet received port 80", ip, "scan", false)
		time.Sleep(200 * time.Millisecond)
		AddLog("WARNING", "Connexion suspecte port 22", ip, "scan", false)
		time.Sleep(400 * time.Millisecond)
		AddLog("CRITICAL", "SCAN DE PORTS HORIZONTAL DÉTECTÉ", ip, "scan", false)

	case "sqli":
		AddLog("INFO", "GET /store.php?id=1 HTTP/1.1", ip, "sqli", false)
		time.Sleep(800 * time.Millisecond)
		AddLog("WARNING", "GET /store.php?id=1' HTTP/1.1 500 ERROR", ip, "sqli", false)
		time.Sleep(800 * time.Millisecond)
		AddLog("CRITICAL", "INJECTION SQL RÉUSSIE", ip, "sqli", false)

	case "ddos":
		AddLog("WARNING", "Détection pic de requêtes", "Multiple IPs", "ddos", false)
		for i := 0; i < 15; i++ {
			time.Sleep(50 * time.Millisecond)
			AddLog("INFO", "GET / HTTP/1.1", fmt.Sprintf("Botnet_%d", i), "ddos", false)
		}
		time.Sleep(400 * time.Millisecond)
		AddLog("CRITICAL", "ATTAQUE DDoS VOLUMÉTRIQUE", "Multiple IPs", "ddos", false)

	case "malware":
		targetIp := "10.0.5.42"
		AddLog("INFO", "Téléchargement fichier : invoice.pdf.exe", targetIp, "malware", false)
		time.Sleep(1500 * time.Millisecond)
		AddLog("WARNING", "Processus suspect : cmd.exe", targetIp, "malware", false)
		time.Sleep(1500 * time.Millisecond)
		AddLog("CRITICAL", "ALERTE EDR : EXECUTION RANSOMWARE", targetIp, "malware", false)

	case "false_positive":
		fpIP := "192.168.1.55"
		AddLog("INFO", "Connexion VPN initiée par 'Directeur_Finance'", fpIP, "fp", true)
		for i := 0; i < 3; i++ {
			time.Sleep(1500 * time.Millisecond)
			AddLog("WARNING", "Erreur d'authentification (Bad Password)", fpIP, "fp", true)
		}
		time.Sleep(500 * time.Millisecond)
		AddLog("CRITICAL", "ALERTE : Multiples échecs de connexion (Directeur)", fpIP, "fp", true)
	}
}
