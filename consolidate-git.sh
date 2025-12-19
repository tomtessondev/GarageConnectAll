#!/bin/bash

# ============================================
# 🔧 Script de Consolidation Git
# GarageConnect - Monorepo Unification
# ============================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header "🔧 CONSOLIDATION MONOREPO - GARAGECONNECT"

# Vérifier qu'on est dans le bon répertoire
if [ ! -d "GarageConnectBackend" ]; then
    print_error "Dossier GarageConnectBackend introuvable!"
    exit 1
fi

# 1. Vérifier si GarageConnectBackend a un .git
print_header "🔍 ANALYSE"

if [ -d "GarageConnectBackend/.git" ]; then
    print_warning "GarageConnectBackend contient un dépôt Git"
    print_info "Ce dépôt sera supprimé pour l'intégrer au monorepo"
    
    read -p "Continuer ? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Opération annulée"
        exit 0
    fi
else
    print_success "GarageConnectBackend ne contient pas de .git"
fi

# 2. Créer une sauvegarde
print_header "💾 SAUVEGARDE"

BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
print_info "Création d'une sauvegarde dans $BACKUP_DIR..."

if [ -d "GarageConnectBackend/.git" ]; then
    mkdir -p "$BACKUP_DIR"
    cp -r GarageConnectBackend/.git "$BACKUP_DIR/"
    print_success "Sauvegarde créée : $BACKUP_DIR"
fi

# 3. Supprimer le .git de GarageConnectBackend
print_header "🗑️  SUPPRESSION DU .GIT"

if [ -d "GarageConnectBackend/.git" ]; then
    print_info "Suppression de GarageConnectBackend/.git..."
    rm -rf GarageConnectBackend/.git
    print_success ".git supprimé"
else
    print_success "Pas de .git à supprimer"
fi

# 4. Mettre à jour le .gitignore principal
print_header "📝 MISE À JOUR .GITIGNORE"

print_info "Mise à jour du .gitignore principal..."

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

# Backups
backup_*/

# Git
.git/
EOF

print_success ".gitignore principal mis à jour"

# 5. Vérifier le .gitignore de GarageConnectBackend
print_info "Vérification du .gitignore de GarageConnectBackend..."

if [ ! -f "GarageConnectBackend/.gitignore" ]; then
    print_warning ".gitignore de GarageConnectBackend manquant, création..."
    
    cat > GarageConnectBackend/.gitignore << 'EOF'
# Dependencies
node_modules/

# Next.js
.next/
out/

# Environment
.env
.env*.local

# Debug
npm-debug.log*

# Vercel
.vercel

# Prisma
prisma/migrations/

# Build
dist/
build/
EOF
    
    print_success ".gitignore de GarageConnectBackend créé"
else
    print_success ".gitignore de GarageConnectBackend existe"
fi

# 6. Vérifier le statut Git
print_header "📊 STATUT GIT"

print_info "Vérification du statut Git..."
git status --short

# 7. Ajouter GarageConnectBackend
print_header "➕ AJOUT AU DÉPÔT"

print_info "Ajout de GarageConnectBackend au dépôt principal..."

# Forcer l'ajout même s'il était ignoré
if git add -f GarageConnectBackend/; then
    print_success "GarageConnectBackend ajouté"
else
    print_error "Erreur lors de l'ajout"
    exit 1
fi

# Ajouter aussi les autres fichiers
print_info "Ajout des autres fichiers..."
git add .gitignore
git add *.sh 2>/dev/null || true
git add *.md 2>/dev/null || true

# 8. Afficher le statut après ajout
print_info "Statut après ajout:"
git status

# 9. Créer le commit
print_header "💾 COMMIT"

read -p "Voulez-vous créer le commit maintenant? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git commit -m "feat: consolidation monorepo

- Intégration de GarageConnectBackend dans le monorepo principal
- Suppression du .git de GarageConnectBackend
- Mise à jour des .gitignore
- Scripts de déploiement et paiement automatisé ajoutés"
    
    print_success "Commit créé"
else
    print_info "Commit non créé (vous pouvez le faire manuellement)"
fi

# 10. Résumé
print_header "📊 RÉSUMÉ"

echo "✅ GarageConnectBackend intégré au monorepo"
echo "✅ .gitignore mis à jour"
echo "✅ Sauvegarde créée: $BACKUP_DIR"
echo ""

print_info "Vérifiez le résultat avec: git status"
print_info "Pour annuler: git reset HEAD --hard && cp -r $BACKUP_DIR/.git GarageConnectBackend/"

print_success "Consolidation terminée ! 🎉"
