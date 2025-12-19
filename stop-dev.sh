#!/bin/bash

# ============================================
# 🛑 GARAGECONNECT - SCRIPT D'ARRÊT DEV
# ============================================
# Arrête tous les services lancés par start-dev.sh
# Usage: ./stop-dev.sh

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PID_FILE=".dev-pids"
BACKEND_PORT=3000

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🛑 Arrêt des services GarageConnect${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Arrêter via le fichier PID
if [ -f "$PID_FILE" ]; then
    echo -e "${YELLOW}📋 Arrêt des processus via $PID_FILE...${NC}"
    
    while read pid; do
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "   ${GREEN}✓${NC} Arrêt du processus $pid"
            kill $pid 2>/dev/null || kill -9 $pid 2>/dev/null
        else
            echo -e "   ${YELLOW}⚠${NC} Processus $pid déjà arrêté"
        fi
    done < "$PID_FILE"
    
    rm "$PID_FILE"
    echo ""
else
    echo -e "${YELLOW}⚠${NC} Fichier $PID_FILE non trouvé"
    echo ""
fi

# Arrêter les processus sur le port (au cas où)
echo -e "${YELLOW}🔍 Vérification du port $BACKEND_PORT...${NC}"
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} Arrêt des processus sur le port $BACKEND_PORT"
    lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null
else
    echo -e "   ${GREEN}✓${NC} Port $BACKEND_PORT libre"
fi
echo ""

# Arrêter Ngrok
echo -e "${YELLOW}🌐 Vérification de Ngrok...${NC}"
if pgrep -x "ngrok" > /dev/null; then
    echo -e "   ${GREEN}✓${NC} Arrêt de Ngrok"
    pkill -9 ngrok 2>/dev/null
else
    echo -e "   ${GREEN}✓${NC} Ngrok non actif"
fi
echo ""

# Nettoyer les fichiers de log
if [ -f "backend.log" ] || [ -f "ngrok.log" ]; then
    echo -e "${YELLOW}🗑️  Nettoyage des logs...${NC}"
    rm -f backend.log ngrok.log
    echo -e "   ${GREEN}✓${NC} Logs supprimés"
    echo ""
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Tous les services sont arrêtés !${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}💡 Pour redémarrer:${NC} ${CYAN}./start-dev.sh${NC}"
echo ""
