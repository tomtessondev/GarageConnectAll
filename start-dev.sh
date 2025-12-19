#!/bin/bash

# ============================================
# 🚀 GARAGECONNECT - SCRIPT DE DÉMARRAGE DEV
# ============================================
# Lance Backend Next.js + Ngrok en parallèle
# Usage: ./start-dev.sh

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="GarageConnectBackend"
BACKEND_PORT=3000
PID_FILE=".dev-pids"

# ============================================
# FUNCTIONS
# ============================================

print_header() {
    echo -e "${CYAN}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🚗 GARAGECONNECT - MODE DÉVELOPPEMENT"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}[${1}]${NC} ${2}"
}

print_success() {
    echo -e "${GREEN}✓${NC} ${1}"
}

print_error() {
    echo -e "${RED}✗${NC} ${1}"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} ${1}"
}

print_info() {
    echo -e "${PURPLE}ℹ${NC} ${1}"
}

# Vérifier les dépendances
check_dependencies() {
    print_step "1/5" "Vérification des dépendances..."
    
    local missing_deps=0
    
    # Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js n'est pas installé"
        missing_deps=1
    else
        print_success "Node.js $(node --version)"
    fi
    
    # npm
    if ! command -v npm &> /dev/null; then
        print_error "npm n'est pas installé"
        missing_deps=1
    else
        print_success "npm $(npm --version)"
    fi
    
    # Ngrok (optionnel)
    if ! command -v ngrok &> /dev/null; then
        print_warning "Ngrok n'est pas installé (optionnel pour webhooks WhatsApp)"
        print_info "Installation: brew install ngrok"
    else
        print_success "Ngrok $(ngrok version | head -n 1)"
    fi
    
    if [ $missing_deps -eq 1 ]; then
        print_error "Dépendances manquantes. Veuillez les installer."
        exit 1
    fi
    
    echo ""
}

# Vérifier si le port est disponible
check_port() {
    if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_error "Le port $BACKEND_PORT est déjà utilisé"
        print_info "Arrêtez le processus avec: lsof -ti:$BACKEND_PORT | xargs kill -9"
        exit 1
    fi
}

# Installer les dépendances si nécessaire
install_dependencies() {
    if [ ! -d "$BACKEND_DIR/node_modules" ]; then
        print_step "2/5" "Installation des dépendances npm..."
        cd "$BACKEND_DIR"
        npm install
        cd ..
        print_success "Dépendances installées"
        echo ""
    else
        print_step "2/5" "Dépendances déjà installées"
        echo ""
    fi
}

# Vérifier le fichier .env
check_env() {
    print_step "3/5" "Vérification de la configuration..."
    
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        print_warning "Fichier .env non trouvé"
        
        if [ -f "$BACKEND_DIR/.env.example" ]; then
            print_info "Copie de .env.example vers .env"
            cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
            print_warning "⚠️  Pensez à configurer vos variables d'environnement dans $BACKEND_DIR/.env"
        else
            print_error "Aucun fichier .env ou .env.example trouvé"
            print_info "Créez un fichier .env avec vos variables d'environnement"
        fi
    else
        print_success "Fichier .env présent"
    fi
    echo ""
}

# Démarrer le backend
start_backend() {
    print_step "4/5" "Démarrage du Backend Next.js..."
    
    cd "$BACKEND_DIR"
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    echo $BACKEND_PID > "$PID_FILE"
    
    # Attendre que le serveur soit prêt
    echo -n "   En attente du serveur"
    for i in {1..30}; do
        if curl -s http://localhost:$BACKEND_PORT > /dev/null 2>&1; then
            echo ""
            print_success "Backend démarré sur http://localhost:$BACKEND_PORT (PID: $BACKEND_PID)"
            break
        fi
        echo -n "."
        sleep 1
    done
    echo ""
}

# Démarrer Ngrok
start_ngrok() {
    print_step "5/5" "Démarrage de Ngrok..."
    
    if command -v ngrok &> /dev/null; then
        ngrok http $BACKEND_PORT > ngrok.log 2>&1 &
        NGROK_PID=$!
        echo $NGROK_PID >> "$PID_FILE"
        
        # Attendre que Ngrok soit prêt
        sleep 3
        
        # Récupérer l'URL Ngrok
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -n1)
        
        if [ -n "$NGROK_URL" ]; then
            print_success "Ngrok démarré: $NGROK_URL (PID: $NGROK_PID)"
        else
            print_warning "Ngrok démarré mais URL non disponible (PID: $NGROK_PID)"
            print_info "Vérifiez http://localhost:4040 pour l'interface Ngrok"
        fi
    else
        print_warning "Ngrok non installé - continuez sans tunnel"
    fi
    echo ""
}

# Afficher les informations finales
show_info() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Tous les services sont démarrés !${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}📌 URLS:${NC}"
    echo -e "   🌐 Backend:      ${GREEN}http://localhost:$BACKEND_PORT${NC}"
    echo -e "   🔗 Admin:        ${GREEN}http://localhost:$BACKEND_PORT/admin${NC}"
    
    if [ -n "$NGROK_URL" ]; then
        echo -e "   🚀 Ngrok Public: ${GREEN}$NGROK_URL${NC}"
        echo -e "   🎛️  Ngrok Panel:  ${GREEN}http://localhost:4040${NC}"
        echo ""
        echo -e "${YELLOW}💡 WEBHOOK TWILIO:${NC}"
        echo -e "   ${CYAN}$NGROK_URL/api/whatsapp/webhook${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}📋 LOGS:${NC}"
    echo -e "   Backend: ${CYAN}tail -f backend.log${NC}"
    echo -e "   Ngrok:   ${CYAN}tail -f ngrok.log${NC}"
    echo ""
    echo -e "${YELLOW}🛑 ARRÊTER:${NC}"
    echo -e "   ${CYAN}./stop-dev.sh${NC} ou ${CYAN}Ctrl+C${NC}"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Cleanup à l'arrêt
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Arrêt des services...${NC}"
    
    if [ -f "$PID_FILE" ]; then
        while read pid; do
            if ps -p $pid > /dev/null 2>&1; then
                print_info "Arrêt du processus $pid"
                kill $pid 2>/dev/null || true
            fi
        done < "$PID_FILE"
        rm "$PID_FILE"
    fi
    
    print_success "Services arrêtés"
    echo -e "${CYAN}👋 À bientôt !${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# ============================================
# MAIN
# ============================================

clear
print_header

check_dependencies
check_port
install_dependencies
check_env
start_backend
start_ngrok
show_info

# Garder le script actif
echo -e "${PURPLE}Appuyez sur Ctrl+C pour arrêter tous les services${NC}"
echo ""

# Afficher les logs du backend en temps réel
tail -f backend.log
