#!/bin/bash

# ============================================
# 🔧 Script d'Initialisation Git
# GarageConnect - Git Setup
# ============================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header "🔧 INITIALISATION GIT - GARAGECONNECT"

# Vérifier si Git est déjà initialisé
if [ -d ".git" ]; then
    print_warning "Git est déjà initialisé dans ce répertoire"
    read -p "Voulez-vous réinitialiser ? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Initialisation annulée"
        exit 0
    fi
    rm -rf .git
fi

# 1. Initialiser Git
print_info "Initialisation du dépôt Git..."
git init
print_success "Dépôt Git initialisé"

# 2. Créer .gitignore si nécessaire
if [ ! -f ".gitignore" ]; then
    print_info "Création du fichier .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Misc
.DS_Store
*.pem
.dev-pids

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env*.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# Prisma
prisma/migrations/dev.db*

# Logs
*.log
logs/
backend.log
ngrok.log

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
Thumbs.db
EOF
    print_success ".gitignore créé"
else
    print_success ".gitignore existe déjà"
fi

# 3. Configurer Git (nom et email)
print_info "Configuration Git..."

# Vérifier si l'utilisateur Git est configuré
if ! git config user.name &> /dev/null; then
    read -p "Entrez votre nom : " GIT_NAME
    git config user.name "$GIT_NAME"
fi

if ! git config user.email &> /dev/null; then
    read -p "Entrez votre email : " GIT_EMAIL
    git config user.email "$GIT_EMAIL"
fi

print_success "Configuration Git terminée"
print_info "Utilisateur : $(git config user.name) <$(git config user.email)>"

# 4. Premier commit
print_info "Création du premier commit..."
git add .
git commit -m "feat: initialisation du projet GarageConnect

- Système de paiement automatisé (Stripe Checkout)
- Messages automatiques (remerciement + relances)
- Cron job pour relances après 1h
- Script de déploiement automatisé
- Documentation complète"

print_success "Premier commit créé"

# 5. Configurer le dépôt distant
echo ""
print_info "Configuration du dépôt distant..."
echo ""
echo "Avez-vous déjà créé un dépôt sur GitHub/GitLab ?"
echo "  1. Oui, j'ai l'URL"
echo "  2. Non, je le ferai plus tard"
read -p "Choix (1/2) : " -n 1 -r
echo ""

if [[ $REPLY == "1" ]]; then
    read -p "Entrez l'URL du dépôt (ex: https://github.com/user/repo.git) : " REPO_URL
    
    # Ajouter le remote
    git remote add origin "$REPO_URL"
    print_success "Dépôt distant configuré : $REPO_URL"
    
    # Demander si on veut push
    read -p "Voulez-vous push maintenant ? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Push vers le dépôt distant..."
        
        # Créer la branche main si elle n'existe pas
        if ! git rev-parse --verify main &> /dev/null; then
            git branch -M main
        fi
        
        git push -u origin main
        print_success "Code poussé vers le dépôt distant"
    fi
else
    print_warning "Dépôt distant non configuré"
    print_info "Pour le configurer plus tard :"
    echo "  git remote add origin <URL_DU_DEPOT>"
    echo "  git push -u origin main"
fi

# 6. Résumé
print_header "📊 RÉSUMÉ"

echo "✅ Git initialisé"
echo "✅ .gitignore créé/vérifié"
echo "✅ Configuration Git définie"
echo "✅ Premier commit créé"

if git remote -v &> /dev/null && [ -n "$(git remote -v)" ]; then
    echo "✅ Dépôt distant configuré"
else
    echo "⚠️  Dépôt distant non configuré"
fi

echo ""
print_success "Initialisation Git terminée ! 🎉"
echo ""

# 7. Prochaines étapes
print_header "📋 PROCHAINES ÉTAPES"

echo "1. Si vous n'avez pas configuré le dépôt distant :"
echo "   - Créez un dépôt sur GitHub/GitLab"
echo "   - git remote add origin <URL>"
echo "   - git push -u origin main"
echo ""
echo "2. Pour déployer :"
echo "   ./deploy.sh preview    # Déploiement de test"
echo "   ./deploy.sh production # Déploiement en production"
echo ""

print_success "Vous pouvez maintenant utiliser le script de déploiement ! 🚀"
