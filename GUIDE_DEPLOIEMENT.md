# 🚀 Guide de Déploiement Automatisé - GarageConnect

## 📋 Présentation

Le script `deploy.sh` automatise complètement le processus de déploiement sur Vercel, incluant :
- ✅ Vérifications pré-déploiement
- ✅ Gestion des commits Git
- ✅ Migrations de base de données
- ✅ Tests automatiques
- ✅ Build de vérification
- ✅ Push Git automatique
- ✅ Déploiement Vercel
- ✅ Vérifications post-déploiement

---

## 🛠️ Prérequis

### 1. Installer Vercel CLI
```bash
npm install -g vercel
```

### 2. Se connecter à Vercel
```bash
vercel login
```

### 3. Lier le projet (première fois uniquement)
```bash
cd GarageConnectBackend
vercel link
# Suivre les instructions pour lier le projet
cd ..
```

---

## 🚀 Utilisation

### Déploiement en Production
```bash
./deploy.sh production
```

**Workflow :**
1. Vérification des prérequis
2. Détection des changements non commités
3. Prompt pour commit si nécessaire
4. Migration de la base de données
5. Exécution des tests
6. Build du projet
7. Push vers Git
8. **Déploiement sur Vercel PRODUCTION**
9. Health check automatique
10. Affichage du résumé

### Déploiement en Preview (Staging)
```bash
./deploy.sh preview
```

ou simplement :

```bash
./deploy.sh
```

**Différences avec Production :**
- ❌ Pas de confirmation requise
- ✅ URL de preview unique
- ✅ Parfait pour tester avant la prod

---

## 📝 Options Interactives

### 1. Commit des Changements
Si le script détecte des changements non commités :
```
⚠️  Uncommitted changes detected:
 M GarageConnectBackend/lib/order-service.ts
 M GarageConnectBackend/prisma/schema.prisma

Do you want to commit these changes? (y/n)
```

**Répondre `y` :**
- Prompt pour entrer un message de commit
- Commit automatique des changements
- Continue le déploiement

**Répondre `n` :**
- Continue sans commiter
- Les changements seront dans le prochain commit

### 2. Confirmation de Production
Pour un déploiement production :
```
⚠️  This will update the live site!
Are you sure? (y/n)
```

**Répondre `y` :** Déploie en production
**Répondre `n` :** Annule le déploiement

### 3. Tests Échoués
Si des tests échouent :
```
❌ Tests failed!
Continue anyway? (y/n)
```

**Répondre `y` :** Continue malgré les erreurs
**Répondre `n` :** Annule le déploiement

### 4. Ouverture du Navigateur
À la fin du déploiement :
```
Open deployment in browser? (y/n)
```

**Répondre `y` :** Ouvre le site dans le navigateur par défaut
**Répondre `n` :** Affiche seulement l'URL

---

## 🔍 Détails des Étapes

### 1. 🔍 Pre-flight Checks
- Vérification du répertoire `GarageConnectBackend`
- Vérification de l'installation de Git
- Vérification/Installation de Vercel CLI
- Vérification du dépôt Git

### 2. 📝 Git Status
- Détection des changements non commités
- Option de commit interactif
- Validation de l'état du repository

### 3. 🗄️ Database Migration
```bash
npx prisma generate    # Génère le client Prisma
npx prisma db push     # Synchronise le schéma
```

**Attention :** Utilise `--accept-data-loss` pour forcer la synchronisation

### 4. 🧪 Tests
- Recherche de scripts de test dans `package.json`
- Exécution de `npm test` si disponible
- Option de continuer si les tests échouent

### 5. 🔨 Build Check
```bash
npm run build
```
- Vérifie que le projet compile sans erreurs
- **Bloquant** : Le déploiement s'arrête si le build échoue

### 6. 📤 Git Push
```bash
git push origin <current-branch>
```
- Détection automatique de la branche courante
- Push vers le dépôt distant

### 7. 🚀 Vercel Deployment
**Production :**
```bash
vercel --prod
```

**Preview :**
```bash
vercel
```

### 8. ✅ Post-Deployment Checks
- Attente de 10s pour propagation
- Récupération de l'URL de déploiement
- Health check sur `/api/health`
- Affichage du résumé

---

## 📊 Exemple de Sortie

```bash
$ ./deploy.sh production

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 PRE-FLIGHT CHECKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Project directory found
✅ Git is installed
✅ Vercel CLI is ready
✅ Git repository detected

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 GIT STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Working directory is clean

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗄️  DATABASE MIGRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  Generating Prisma Client...
✅ Prisma Client generated
ℹ️  Checking database schema...
✅ Database schema synchronized

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  No tests found, skipping...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔨 BUILD CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  Running build check...
✅ Build successful

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 GIT PUSH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  Current branch: main
ℹ️  Pushing to origin/main...
✅ Pushed to Git successfully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 VERCEL DEPLOYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  Deploying to PRODUCTION...
⚠️  This will update the live site!
Are you sure? (y/n) y
ℹ️  Running: vercel --prod
✅ Deployment successful!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ POST-DEPLOYMENT CHECKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  Waiting 10 seconds for deployment to propagate...
✅ Deployment URL: https://garage-connect.vercel.app
ℹ️  Running health check...
✅ Health check passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DEPLOYMENT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Environment: production
Branch: main
Deployment URL: https://garage-connect.vercel.app

✅ Deployment completed successfully! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Verify deployment at: https://garage-connect.vercel.app
2. Check Vercel logs: vercel logs
3. Monitor cron jobs: https://vercel.com/dashboard/crons
4. Configure Stripe webhook if needed

Open deployment in browser? (y/n) y

✅ All done! 🚀
```

---

## 🐛 Résolution de Problèmes

### Erreur : "Directory GarageConnectBackend not found"
**Cause :** Vous n'êtes pas dans le bon répertoire

**Solution :**
```bash
cd /Users/tesson/Desktop/Freelance/GarageConnectAll
./deploy.sh
```

### Erreur : "Not a git repository"
**Cause :** Le projet n'est pas initialisé avec Git

**Solution :**
```bash
git init
git remote add origin <your-repo-url>
```

### Erreur : "Vercel CLI not found"
**Cause :** Vercel CLI n'est pas installé

**Solution :**
```bash
npm install -g vercel
```

### Erreur : "Database migration failed"
**Cause :** Problème de connexion à la base de données

**Solution :**
```bash
# Vérifier les variables d'environnement
cd GarageConnectBackend
cat .env | grep DATABASE_URL

# Tester la connexion manuellement
npx prisma db push
```

### Erreur : "Build failed"
**Cause :** Erreurs de compilation

**Solution :**
```bash
cd GarageConnectBackend
npm run build
# Corriger les erreurs affichées
```

### Erreur : "Git push failed"
**Cause :** Conflit ou pas d'accès au dépôt

**Solution :**
```bash
# Vérifier l'état Git
git status
git pull --rebase

# Vérifier les credentials
git remote -v
```

### Erreur : "Deployment failed"
**Cause :** Erreur Vercel (variables env, build, etc.)

**Solution :**
```bash
# Vérifier les logs Vercel
vercel logs

# Vérifier les variables d'environnement
vercel env ls
```

---

## 🔧 Configuration Avancée

### Modifier le Répertoire du Projet
Éditer `deploy.sh` :
```bash
PROJECT_DIR="MonAutreRepertoire"
```

### Désactiver les Tests
Commenter la section tests dans `deploy.sh` :
```bash
# ============================================
# Run Tests (Optional)
# ============================================
# ... Commenter tout le bloc
```

### Ajouter des Checks Personnalisés
Ajouter avant le déploiement dans `deploy.sh` :
```bash
# Custom health check
print_info "Running custom checks..."
if [ -f "custom-check.sh" ]; then
    ./custom-check.sh
fi
```

### Notifications Slack/Discord
Ajouter à la fin de `deploy.sh` :
```bash
# Send notification
curl -X POST YOUR_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"Deployment successful: $DEPLOY_URL\"}"
```

---

## 📋 Checklist Avant Déploiement

### Première Fois
- [ ] Installer Vercel CLI : `npm install -g vercel`
- [ ] Se connecter : `vercel login`
- [ ] Lier le projet : `cd GarageConnectBackend && vercel link`
- [ ] Configurer les variables d'environnement sur Vercel
- [ ] Configurer le webhook Stripe

### À Chaque Déploiement
- [ ] Tester localement : `npm run dev`
- [ ] Vérifier les migrations : `npx prisma db push`
- [ ] Commiter les changements : `git add . && git commit -m "..."`
- [ ] Lancer le script : `./deploy.sh production`
- [ ] Vérifier le déploiement
- [ ] Tester les fonctionnalités critiques

---

## 🎯 Bonnes Pratiques

### 1. Toujours Tester en Preview d'Abord
```bash
# Deploy en preview
./deploy.sh preview

# Tester sur l'URL de preview
# Si OK, alors déployer en production
./deploy.sh production
```

### 2. Messages de Commit Clairs
```bash
✅ GOOD:
- "feat: ajout système de paiement automatisé"
- "fix: correction bug webhook Stripe"
- "refactor: optimisation requêtes DB"

❌ BAD:
- "updates"
- "fix"
- "changes"
```

### 3. Vérifier les Logs Après Déploiement
```bash
# Logs en temps réel
vercel logs --follow

# Logs d'une fonction spécifique
vercel logs --function=api/webhook/stripe
```

### 4. Rollback en Cas de Problème
```bash
# Lister les déploiements
vercel ls

# Promouvoir un ancien déploiement
vercel promote <deployment-url>
```

### 5. Variables d'Environnement
```bash
# Lister les variables
vercel env ls

# Ajouter une variable
vercel env add STRIPE_SECRET_KEY

# Supprimer une variable
vercel env rm STRIPE_SECRET_KEY
```

---

## 🚀 Raccourcis Utiles

### Alias Bash (Optionnel)
Ajouter à `~/.bashrc` ou `~/.zshrc` :
```bash
alias deploy-prod='cd /Users/tesson/Desktop/Freelance/GarageConnectAll && ./deploy.sh production'
alias deploy-preview='cd /Users/tesson/Desktop/Freelance/GarageConnectAll && ./deploy.sh preview'
alias deploy-logs='vercel logs --follow'
```

Puis :
```bash
source ~/.bashrc  # ou source ~/.zshrc
```

Utilisation :
```bash
deploy-prod      # Déploie en production
deploy-preview   # Déploie en preview
deploy-logs      # Affiche les logs
```

---

## 📞 Support

### Logs du Script
Le script affiche des logs colorés :
- 🔵 **Bleu** : Information
- 🟢 **Vert** : Succès
- 🟡 **Jaune** : Avertissement
- 🔴 **Rouge** : Erreur

### Obtenir de l'Aide
```bash
# Documentation Vercel
vercel --help

# Status du déploiement
vercel inspect <deployment-url>

# Logs détaillés
vercel logs --debug
```

---

## 📊 Monitoring Post-Déploiement

### 1. Vérifier le Site
```bash
curl https://your-domain.vercel.app/api/health
```

### 2. Tester les Webhooks
```bash
# Stripe CLI
stripe trigger checkout.session.completed
```

### 3. Monitorer les Cron Jobs
Dashboard Vercel → Crons → Voir l'historique d'exécution

### 4. Vérifier les Analytics
Dashboard Vercel → Analytics → Voir les métriques

---

**Version :** 1.0
**Date :** 19 Décembre 2025
**Auteur :** GarageConnect Team
