package main

import (
	"fmt"
	"math/rand"
	"time"
)

// Génère une IP externe (Internet)
func randomWAN() string {
	return fmt.Sprintf("%d.%d.%d.%d", rand.Intn(150)+11, rand.Intn(255), rand.Intn(255), rand.Intn(254)+1)
}

// Génère une IP interne (Réseau de l'entreprise)
func randomLAN() string {
	return fmt.Sprintf("192.168.1.%d", rand.Intn(200)+10)
}

func SimulateAttack(attackType string) {
	if Stats.Compromised {
		return
	}

	wanIP := randomWAN()
	lanIP := randomLAN()

	switch attackType {
	case "brute":
		AddLog("INFO", "Nouvelle connexion SSH entrante", wanIP, "brute", false)
		for i := 0; i < 4; i++ {
			time.Sleep(300 * time.Millisecond)
			AddLog("WARNING", "sshd: Failed password for root", wanIP, "brute", false)
		}
		time.Sleep(200 * time.Millisecond)
		AddLog("CRITICAL", "BRUTE FORCE SSH DÉTECTÉ", wanIP, "brute", false)

	case "scan":
		AddLog("INFO", "TCP SYN Packet received port 80", wanIP, "scan", false)
		time.Sleep(200 * time.Millisecond)
		AddLog("WARNING", "Connexion suspecte port 22", wanIP, "scan", false)
		time.Sleep(400 * time.Millisecond)
		AddLog("CRITICAL", "SCAN DE PORTS HORIZONTAL DÉTECTÉ", wanIP, "scan", false)

	case "sqli":
		AddLog("INFO", "GET /store.php?id=1 HTTP/1.1", wanIP, "sqli", false)
		time.Sleep(800 * time.Millisecond)
		AddLog("WARNING", "GET /store.php?id=1' HTTP/1.1 500 ERROR", wanIP, "sqli", false)
		time.Sleep(800 * time.Millisecond)
		AddLog("CRITICAL", "INJECTION SQL RÉUSSIE", wanIP, "sqli", false)

	case "ddos":
		AddLog("WARNING", "Détection pic de requêtes (Botnet)", "Multiple IPs", "ddos", false)
		for i := 0; i < 15; i++ {
			time.Sleep(50 * time.Millisecond)
			AddLog("INFO", "GET / HTTP/1.1", fmt.Sprintf("%d.x.x.x", rand.Intn(200)), "ddos", false)
		}
		time.Sleep(400 * time.Millisecond)
		AddLog("CRITICAL", "ATTAQUE DDoS VOLUMÉTRIQUE", "Multiple IPs", "ddos", false)

	case "malware":
		AddLog("INFO", "Téléchargement fichier : invoice.pdf.exe", lanIP, "malware", false)
		time.Sleep(1500 * time.Millisecond)
		AddLog("WARNING", "Processus suspect : cmd.exe", lanIP, "malware", false)
		time.Sleep(1500 * time.Millisecond)
		AddLog("CRITICAL", "ALERTE EDR : EXECUTION RANSOMWARE", lanIP, "malware", false)

	case "false_positive":
		AddLog("INFO", "Connexion VPN initiée par 'Directeur_Finance'", lanIP, "fp", true)
		for i := 0; i < 3; i++ {
			time.Sleep(1500 * time.Millisecond)
			AddLog("WARNING", "Erreur d'authentification (Bad Password)", lanIP, "fp", true)
		}
		time.Sleep(500 * time.Millisecond)
		AddLog("CRITICAL", "ALERTE : Multiples échecs de connexion (Directeur)", lanIP, "fp", true)
	}
}
