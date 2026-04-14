package main

import (
	"sync"
	"time"
)

// LogEntry représente un log au format JSON pour la page Web
type LogEntry struct {
	ID      int    `json:"id"`
	Time    string `json:"time"`
	Level   string `json:"level"`
	IP      string `json:"ip"`
	Message string `json:"message"`
	Type    string `json:"type"`
	IsFP    bool   `json:"isFP"`
}

// SystemStats représente les compteurs en haut du Dashboard
type SystemStats struct {
	Total       int  `json:"total"`
	Warnings    int  `json:"warnings"`
	Criticals   int  `json:"criticals"`
	Blocked     int  `json:"blocked"`
	Score       int  `json:"score"`
	Compromised bool `json:"compromised"`
}

var (
	Logs         []LogEntry
	Stats        SystemStats
	Mutex        sync.Mutex // Le cadenas pour éviter les crashs de mémoire
	LogIDCounter = 1
)

// AddLog crée un log et met à jour les statistiques globales
func AddLog(level, message, ip, logType string, isFP bool) {
	Mutex.Lock()
	defer Mutex.Unlock()

	now := time.Now().Format("15:04:05")

	Stats.Total++
	if level == "WARNING" {
		Stats.Warnings++
	} else if level == "CRITICAL" {
		Stats.Criticals++
	}

	Logs = append(Logs, LogEntry{
		ID:      LogIDCounter,
		Time:    now,
		Level:   level,
		IP:      ip,
		Message: message,
		Type:    logType,
		IsFP:    isFP,
	})
	LogIDCounter++
}
