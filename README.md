# SOCsim

Bienvenue dans le projet **SOCsim**

## 1. Description simple du projet

Imaginez que vous êtes le gardien virtuel d'une entreprise. Votre travail consiste à surveiller un écran radar pour repérer les intrus et les bloquer avant qu'ils ne fassent des dégâts.

C'est exactement ce que fait ce projet. C'est un simulateur interactif qui reproduit le fonctionnement d'une tour de contrôle de cybersécurité.

* **Le moteur (Backend) en Go** crée de fausses attaques informatiques.

* **L'interface (Frontend) en Node.js** vous affiche ce qui se passe en temps réel sur une belle page web.

* **Vous (l'Analyste)** devez repérer les alertes rouges et prendre les bonnes décisions pour protéger le système !

## 2. Fonctionnalités

Voici ce que ce simulateur vous permet de faire :

* 🎯 Simulation d'attaques réalistes : Des boutons vous permettent de déclencher de fausses attaques informatiques (comme essayer de deviner un mot de passe en boucle ou scanner le système).

* 👩‍💻 Mode Analyste Interactif : Face à une alerte, c'est à vous de jouer. Vous pouvez choisir de "Bloquer" l'attaquant ou de l'"Ignorer". Chaque bonne décision vous rapporte des points !

* 📊 Dashboard Web en temps réel : Une interface moderne (aux couleurs sombres) qui affiche les événements du système avec un code couleur simple (Vert = Normal, Orange = Attention, Rouge = Critique).

* 📝 Génération de rapports : À la fin de votre session, le simulateur crée un résumé complet de l'attaque et évalue vos décisions.

## 3. Installation

Avant de commencer, vous avez besoin de deux outils gratuits installés sur votre ordinateur.
### Prérequis

* Go (le langage de programmation du moteur) : [Télécharger Go](https://go.dev/dl/)

* Node.js (pour faire tourner la page web) : [Télécharger Node.js](https://nodejs.org/)

### Étapes d'installation

* Récupérez le projet sur votre ordinateur (téléchargez le dossier du projet).

* Ouvrez votre terminal (ou Invite de commandes sous Windows).

* Allez dans le dossier de l'interface (dashboard) pour installer les outils nécessaires en copiant-collant ces commandes :

```Bash

cd chemin/vers/le/dossier/dashboard
npm install express
```

(Cette commande installe "Express", un petit outil qui permet d'afficher notre page web facilement).

## 4. Lancement du projet

Pour que le simulateur fonctionne, nous devons allumer le moteur (Go) ET l'écran (Node.js). Vous allez avoir besoin d'ouvrir **deux fenêtres de terminal.**

### Terminal 1 : Allumer le moteur (Backend)
Allez dans le dossier principal du projet et tapez :
```Bash

go run .
```

Si tout va bien, vous verrez : "🚀 Démarrage du Simulateur SOC Backend..."

### Terminal 2 : Allumer l'écran (Frontend)
Allez dans le sous-dossier dashboard et tapez :
```Bash

node server.js
```

Si tout va bien, vous verrez : "🖥️ Frontend SOC disponible..."

### Accéder au simulateur :
Ouvrez votre navigateur internet (Chrome, Firefox, Safari...) et allez à l'adresse suivante : **http://localhost:3000**

## 5. Structure du projet

Voici à quoi servent les fichiers du projet, expliqués simplement :

### Le Moteur (Backend en Go) :

* ```main.go``` : Le point d'entrée. Initialise les statistiques et lance le serveur sur le port 8080.

* ```simulator.go``` : Le générateur d'attaques. Fait tourner des tâches en arrière-plan (Goroutines) pour créer des menaces avec des adresses IP réalistes (LAN et WAN).

* ```api.go``` : Le pont de communication (API REST). Fournit les données à la page web et reçoit les ordres de l'analyste (Bloquer/Ignorer).

* ```database.go``` : La mémoire centralisée. Stocke les scores, les logs et l'état du système en temps réel (protégée par des Mutex).

### L'Écran (Frontend en Node.js) : dossier ```/dashboard/```

* ```server.js``` : Un mini-serveur qui sert juste à afficher votre page web.

* ```index.html``` : L'ossature de la page (Barre latérale, Terminal, Onglets, Écran de boot).

* ```style.css``` : Le design sombre et professionnel (style SIEM), les animations de piratage.

* ```script.js``` : Le client dynamique. Interroge le serveur Go toutes les secondes, dessine les graphiques (Chart.js) et génère les alertes sonores (Web Audio API).

## 6. Comment utiliser le simulateur

1. **Surveillez l'écran** : Au lancement, tout est calme.

2. **Lancez une attaque** : Cliquez sur le bouton "Lancer Brute Force SSH".

3. **Lisez les logs** : Vous allez voir apparaître des lignes oranges (des tentatives de connexion échouées).

4. **Répondez à l'alerte** : Au bout de plusieurs échecs, une alerte ROUGE apparaît. Des boutons s'affichent à côté. Cliquez sur Bloquer IP.

5. **Vérifiez votre score** : Regardez en haut de l'écran, vos points ont augmenté car vous avez pris la bonne décision !

6. **Générez le rapport** : Cliquez sur "Générer Rapport" pour voir le bilan de l'attaque et comprendre ce qui s'est passé.

## 7. Exemple d'utilisation : Le scénario du "Malware"

**Ce qu'il se passe en coulisses :** Un employé de l'entreprise télécharge sans faire exprès un Ransomware caché dans une fausse facture. Le virus s'exécute et essaie de contacter son créateur sur Internet.

**Dans votre simulateur :**

1. Vous lancez l'attaque "Malware / EDR".

2. Un log `INFO` apparaît avec un badge bleu [LAN]. L'IP locale `10.0.5.42` vient de télécharger invoice.pdf.exe.

3. Quelques secondes plus tard, un `WARNING` orange retentit : un processus suspect s'est lancé sur cette machine.

4. Soudain, une double alarme stridente retentit ! Une alerte `CRITICAL` apparaît :**ALERTE EDR : EXECUTION RANSOMWARE.**

5. En tant qu'analyste, vous avez quelques secondes pour réagir. Vous cliquez sur "Bloquer".

6. Le simulateur envoie l'ordre au backend Go, qui valide votre action. Vous gagnez 50 points et sauvez le réseau de l'entreprise !

## 8. Lexique (pour tout comprendre)

La cybersécurité utilise beaucoup de jargon. Voici la traduction en français simple avec des analogies :

* **SOC (Security Operations Center) :** C'est une équipe de vigiles informatiques. Imaginez la salle de vidéosurveillance d'un grand magasin, mais pour protéger des ordinateurs.

* **SIEM :** C'est l'écran géant qu'utilise le SOC. Il regroupe toutes les alarmes de l'entreprise au même endroit pour faciliter la surveillance. C'est exactement le tableau de bord web que vous venez de lancer !

* **Brute force (Attaque par force brute) :** C'est comme un voleur qui essaierait toutes les clés d'un énorme trousseau de clés une par une, très vite, jusqu'à ce que la porte s'ouvre.

* **Logs (Journaux d'événements) :** C'est le journal intime de l'ordinateur. L'ordinateur y note tout : "À 14h, Paul s'est connecté", "À 14h05, une erreur s'est produite".

* **API (Interface de Programmation) :** C'est le serveur au restaurant. Vous (la page web) lui donnez votre commande ("Je veux voir les alertes"), le serveur (API) va en cuisine le demander au cuisinier (le programme Go), et vous rapporte votre plat.

* **WebSocket :** Contrairement à l'API classique où il faut demander l'information, le WebSocket est comme un appel téléphonique. La ligne reste ouverte en continu, et les informations arrivent en direct, sans avoir à rafraîchir la page.

* **Faux Positif (FP) :** Une fausse alarme. Le système croit voir une attaque, mais c'est en fait une action normale (ex: un employé qui oublie son mot de passe).

* **DDoS :** *Distributed Denial of Service*. Comme si 10 000 personnes voulaient rentrer par la même porte en même temps pour faire s'effondrer le bâtiment.

* **Injection SQL (SQLi) :** Une technique de piratage où l'on pose une "question truquée" à la base de données web pour lui faire cracher des mots de passe.

* **Threat Intelligence :** Le fait de se renseigner sur l'ennemi (savoir de quel pays vient l'IP, si elle est déjà connue de la police, etc.).

* **Malware (Logiciel Malveillant) :** Terme global pour désigner tous les virus informatiques (Ransomware, Cheval de Troie).
Il s'introduit souvent sur le réseau en se déguisant en fichier légitime (comme une fausse facture par email).
Une fois ouvert, il s'installe en cachette pour voler des données ou bloquer le système contre une rançon.

* **LAN / WAN** : Local Area Network (Le réseau interne, privé) / Wide Area Network (Internet, public).

## 9. FAQ (Foire Aux Questions)

**Faut-il installer une vraie base de données (comme MySQL) ?**

Non. Pour que ce projet soit facile à utiliser par les débutants, la "base de données" (database.go) garde tout dans la mémoire vive temporaire (RAM). Si vous coupez le programme, l'historique repart à zéro.

**Est-ce que ça peut protéger mon propre ordinateur ?**

Non, c'est un simulateur à but éducatif. Il ne lit pas les vraies attaques sur votre ordinateur, il génère de fausses attaques pour vous apprendre à réagir.

**Pourquoi utiliser Go et Node.js en même temps ?**

C'est pour vous montrer une architecture "moderne" très utilisée en entreprise. Go est très puissant pour analyser des milliers de lignes (les logs) sans ralentir, tandis que Node.js et JavaScript sont parfaits pour créer des pages web jolies et dynamiques.