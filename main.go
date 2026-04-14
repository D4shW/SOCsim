package main

import (
	"fmt"
	"net/http"
)

func main() {
	fmt.Println("🚀 Démarrage du SOC Backend V4 sur le port 8080...")

	// Initialisation des statistiques à zéro
	Stats = SystemStats{Score: 0}

	// On crée le tout premier log système
	AddLog("INFO", "Démarrage du système SIEM et des capteurs", "SYSTEM", "general", false)

	// On allume les routes de communication avec le Dashboard
	SetupRoutes()

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		fmt.Println("Erreur du serveur :", err)
	}
}
