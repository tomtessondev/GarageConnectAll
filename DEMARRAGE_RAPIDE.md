# 🚀 DÉMARRAGE RAPIDE - GARAGECONNECT

Guide ultra-rapide pour lancer tout le projet en une commande.

---

## 💻 PRÉREQUIS

- ✅ Node.js 18+ installé
- ✅ npm installé
- ✅ Ngrok installé (optionnel) : `brew install ngrok`

---

## 🎯 DÉMARRAGE EN 1 COMMANDE

### Option 1 : Script Bash (Recommandé)

```bash
# Depuis la racine du projet
./start-dev.sh
```

### Option 2 : Via npm

```bash
# Depuis GarageConnectBackend/
npm run dev:all
```

---

## 📺 CE QUE ÇA FAIT

Le script va automatiquement :

1. ✅ Vérifier Node.js, npm, Ngrok
2. ✅ Installer les dépendances si besoin
3. ✅ Vérifier le fichier .env
4. ✅ Démarrer le Backend Next.js (port 3000)
5. ✅ Démarrer Ngrok pour les webhooks
6. ✅ Afficher toutes les URLs

**Résultat affiché :**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Tous les services sont démarrés !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 URLS:
   🌐 Backend:      http://localhost:3000
   🔗 Admin:        http://localhost:3000/admin
   🚀 Ngrok Public: https://abc123.ngrok.io
   🎛️  Ngrok Panel:  http://localhost:4040

💡 WEBHOOK TWILIO:
   https://abc123.ngrok.io/api/whatsapp/webhook

📋 LOGS:
   Backend: tail -f backend.log
   Ngrok:   tail -f ngrok.log

🛑 ARRÊTER:
   ./stop-dev.sh ou Ctrl+C
```

---

## 🛑 ARRÊTER LES SERVICES

### Option 1 : Ctrl+C

Dans le terminal où tourne `./start-dev.sh`, appuyer sur `Ctrl+C`

### Option 2 : Script Stop

```bash
# Depuis la racine du projet
./stop-dev.sh
```

### Option 3 : Via npm

```bash
# Depuis GarageConnectBackend/
npm run stop
```

---

## 📋 VOIR LES LOGS

### En temps réel

Les logs backend s'affichent automatiquement après le démarrage.

### Dans des fichiers séparés

```bash
# Backend
tail -f backend.log

# Ngrok
tail -f ngrok.log
```

---

## 🔧 OPTIONS AVANCÉES

### Démarrer sans Ngrok

Si vous ne voulez pas Ngrok (pas besoin de webhooks) :

1. Éditer `start-dev.sh`
2. Commenter la ligne `start_ngrok`
3. Ou désinstaller Ngrok temporairement

### Changer le port

```bash
# Éditer start-dev.sh
BACKEND_PORT=3001  # Au lieu de 3000
```

### Mode Debug

```bash
# Ajouter avant ./start-dev.sh
DEBUG=* ./start-dev.sh
```

---

## ❓ PROBLÈMES COURANTS

### "Port 3000 already in use"

```bash
# Tuer le processus sur le port
lsof -ti:3000 | xargs kill -9

# Puis relancer
./start-dev.sh
```

### "Ngrok not found"

```bash
# Installer Ngrok
brew install ngrok

# Configurer (première fois)
ngrok config add-authtoken VOTRE_TOKEN
```

### ".env not found"

```bash
# Copier le template
cd GarageConnectBackend
cp .env.example .env

# Éditer avec vos variables
nano .env
```

### "npm: command not found"

```bash
# Installer Node.js (inclut npm)
brew install node

# Vérifier
node --version
npm --version
```

---

## 📦 STRUCTURE DES FICHIERS

```
GarageConnectAll/
├── start-dev.sh          ← Script de démarrage
├── stop-dev.sh           ← Script d'arrêt
├── backend.log           ← Logs backend (auto-créé)
├── ngrok.log             ← Logs Ngrok (auto-créé)
├── .dev-pids             ← PIDs des process (auto-créé)
└── GarageConnectBackend/
    ├── package.json      ← Scripts npm ajoutés
    └── .env              ← Configuration
```

---

## 🎓 COMMANDES UTILES

### Lancement

```bash
./start-dev.sh              # Démarre tout
npm run dev:all             # Depuis GarageConnectBackend/
```

### Arrêt

```bash
./stop-dev.sh               # Arrête tout
npm run stop                # Depuis GarageConnectBackend/
Ctrl+C                      # Dans le terminal actif
```

### Vérification

```bash
# Vérifier si le backend répond
curl http://localhost:3000/api

# Vérifier les processus
ps aux | grep "next dev"
ps aux | grep ngrok

# Vérifier les ports
lsof -i :3000
lsof -i :4040
```

### Logs

```bash
# Voir logs en temps réel
tail -f backend.log
tail -f ngrok.log

# Voir dernières lignes
tail -n 50 backend.log

# Chercher erreur
grep -i "error" backend.log
```

---

## 🌟 WORKFLOW DÉVELOPPEMENT

### Démarrage typique

```bash
# 1. Ouvrir un terminal
cd /path/to/GarageConnectAll

# 2. Lancer tout
./start-dev.sh

# 3. Attendre que tout soit prêt (30 secondes)

# 4. Copier l'URL Ngrok affichée

# 5. Mettre à jour webhook Twilio avec cette URL

# 6. Tester via WhatsApp

# 7. Développer en voyant les logs en temps réel

# 8. Arrêter avec Ctrl+C quand terminé
```

### Redémarrage après modification

```bash
# Le script détecte automatiquement les changements
# Pas besoin de redémarrer manuellement !

# Mais si besoin de restart complet :
./stop-dev.sh
./start-dev.sh
```

---

## 🚀 PROCHAINES ÉTAPES

Une fois le projet lancé :

1. **Configurer Twilio Webhook** avec l'URL Ngrok affichée
2. **Tester le bot** via WhatsApp
3. **Accéder à l'admin** sur http://localhost:3000/admin
4. **Consulter la doc** dans `/DOCUMENTATION/`

---

## 📚 RESSOURCES

- **Documentation complète :** `/DOCUMENTATION/00_INDEX.md`
- **Installation détaillée :** `/DOCUMENTATION/13_INSTALLATION.md`
- **Architecture :** `/DOCUMENTATION/02_ARCHITECTURE_TECHNIQUE.md`
- **Guide utilisateur :** `/DOCUMENTATION/12_GUIDE_UTILISATEUR.md`

---

## 💡 TIPS

**Gain de temps :**
- Créer un alias : `alias gc-start='cd /path/to/GarageConnectAll && ./start-dev.sh'`
- Ajouter au `.zshrc` ou `.bashrc`

**Productivité :**
- Ouvrir 2 terminals : un pour le script, un pour les commandes
- Utiliser tmux/screen pour plusieurs fenêtres
- Configurer votre éditeur pour auto-reload

**Monitoring :**
- Interface Ngrok : http://localhost:4040
- Logs temps réel : `tail -f backend.log`
- Prisma Studio : `npx prisma studio` (dans GarageConnectBackend/)

---

**🇬🇵 Fait avec ❤️ en Guadeloupe**

**Besoin d'aide ?** Consultez `/DOCUMENTATION/README.md`
