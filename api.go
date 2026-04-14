package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func SetupRoutes() {
	// 1. Envoi des données (Logs + Stats) au Dashboard
	http.HandleFunc("/api/state", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json")

		Mutex.Lock()
		defer Mutex.Unlock()

		response := map[string]interface{}{
			"logs":  Logs,
			"stats": Stats,
		}
		json.NewEncoder(w).Encode(response)
	})

	// 2. Déclenchement d'une attaque
	http.HandleFunc("/api/attack", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		attackType := r.URL.Query().Get("type")

		go SimulateAttack(attackType) // Lancé en tâche de fond !
		w.Write([]byte("Attaque lancée"))
	})

	// 3. Gestion des décisions du joueur (Bloquer / Ignorer)
	http.HandleFunc("/api/action", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		ip := r.URL.Query().Get("ip")
		action := r.URL.Query().Get("action")
		isFP := r.URL.Query().Get("isFP") == "true"

		Mutex.Lock()
		if !Stats.Compromised {
			if action == "block" {
				if isFP {
					Stats.Score -= 50
					go AddLog("CRITICAL", fmt.Sprintf("ERREUR SOC : Plainte RH, vous avez bloqué l'employé %s", ip), "SOC", "general", false)
				} else {
					Stats.Score += 50
					Stats.Blocked++
					go AddLog("INFO", fmt.Sprintf("Succès SOC : Attaquant %s bloqué par le pare-feu", ip), "SOC", "general", false)
				}
			} else if action == "ignore" {
				if isFP {
					Stats.Score += 50
					go AddLog("INFO", fmt.Sprintf("Succès SOC : Faux positif identifié pour %s", ip), "SOC", "general", false)
				} else {
					Stats.Score -= 500
					Stats.Compromised = true
					go AddLog("CRITICAL", fmt.Sprintf("[FATAL] Alerte ignorée. L'attaquant %s a infiltré le réseau !", ip), "SYSTEM", "general", false)
				}
			}
		}
		Mutex.Unlock()
		w.Write([]byte("Action traitée"))
	})
}
