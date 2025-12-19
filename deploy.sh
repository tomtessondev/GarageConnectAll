#!/bin/bash

# ============================================
# 🚀 Script de Déploiement Automatisé
# GarageConnect - Vercel Deployment
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="GarageConnectBackend"
DEPLOY_ENV=${1:-production}  # production or preview

# ============================================
# Helper Functions
# ============================================

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

# ============================================
# Pre-flight Checks
# ============================================

print_header "🔍 PRE-FLIGHT CHECKS"

# Check if we're in the right directory
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Directory $PROJECT_DIR not found!"
    exit 1
fi
print_success "Project directory found"

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed!"
    exit 1
fi
print_success "Git is installed"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
fi
print_success "Vercel CLI is ready"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "Not a git repository!"
    exit 1
fi
print_success "Git repository detected"

# ============================================
# Check Git Status
# ============================================

print_header "📝 GIT STATUS"

cd $PROJECT_DIR

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    print_info "Uncommitted changes detected:"
    git status -s
    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " COMMIT_MSG
        git add .
        git commit -m "$COMMIT_MSG"
        print_success "Changes committed"
    else
        print_warning "Continuing without committing..."
    fi
else
    print_success "Working directory is clean"
fi

cd ..

# ============================================
# Database Migration
# ============================================

print_header "🗄️  DATABASE MIGRATION"

cd $PROJECT_DIR

print_info "Generating Prisma Client..."
npx prisma generate
print_success "Prisma Client generated"

print_info "Checking database schema..."
if npx prisma db push --accept-data-loss; then
    print_success "Database schema synchronized"
else
    print_error "Database migration failed!"
    exit 1
fi

cd ..

# ============================================
# Run Tests (Optional)
# ============================================

print_header "🧪 TESTS"

cd $PROJECT_DIR

if [ -f "package.json" ] && grep -q "\"test\":" package.json; then
    print_info "Running tests..."
    if npm test; then
        print_success "All tests passed"
    else
        print_error "Tests failed!"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    print_warning "No tests found, skipping..."
fi

cd ..

# ============================================
# Build Check
# ============================================

print_header "🔨 BUILD CHECK"

cd $PROJECT_DIR

print_info "Running build check..."
if npm run build; then
    print_success "Build successful"
else
    print_error "Build failed!"
    exit 1
fi

cd ..

# ============================================
# Push to Git
# ============================================

print_header "📤 GIT PUSH"

cd $PROJECT_DIR

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_info "Current branch: $CURRENT_BRANCH"

# Push to remote
print_info "Pushing to origin/$CURRENT_BRANCH..."
if git push origin $CURRENT_BRANCH; then
    print_success "Pushed to Git successfully"
else
    print_error "Git push failed!"
    exit 1
fi

cd ..

# ============================================
# Deploy to Vercel
# ============================================

print_header "🚀 VERCEL DEPLOYMENT"

cd $PROJECT_DIR

if [ "$DEPLOY_ENV" = "production" ]; then
    print_info "Deploying to PRODUCTION..."
    print_warning "This will update the live site!"
    read -p "Are you sure? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi
    
    VERCEL_CMD="vercel --prod"
else
    print_info "Deploying to PREVIEW..."
    VERCEL_CMD="vercel"
fi

# Deploy
print_info "Running: $VERCEL_CMD"
if $VERCEL_CMD; then
    print_success "Deployment successful!"
else
    print_error "Deployment failed!"
    exit 1
fi

cd ..

# ============================================
# Post-Deployment Checks
# ============================================

print_header "✅ POST-DEPLOYMENT CHECKS"

print_info "Waiting 10 seconds for deployment to propagate..."
sleep 10

# Get deployment URL from Vercel
cd $PROJECT_DIR
DEPLOY_URL=$(vercel ls | grep "Ready" | head -1 | awk '{print $2}')
cd ..

if [ -n "$DEPLOY_URL" ]; then
    print_success "Deployment URL: https://$DEPLOY_URL"
    
    # Health check
    print_info "Running health check..."
    if curl -s -o /dev/null -w "%{http_code}" "https://$DEPLOY_URL/api/health" | grep -q "200"; then
        print_success "Health check passed"
    else
        print_warning "Health check failed or endpoint not found"
    fi
else
    print_warning "Could not retrieve deployment URL"
fi

# ============================================
# Summary
# ============================================

print_header "📊 DEPLOYMENT SUMMARY"

echo "Environment: $DEPLOY_ENV"
echo "Branch: $CURRENT_BRANCH"
echo "Deployment URL: https://$DEPLOY_URL"
echo ""

print_success "Deployment completed successfully! 🎉"
echo ""

# ============================================
# Next Steps
# ============================================

print_header "📋 NEXT STEPS"

echo "1. Verify deployment at: https://$DEPLOY_URL"
echo "2. Check Vercel logs: vercel logs"
echo "3. Monitor cron jobs: https://vercel.com/dashboard/crons"
echo "4. Configure Stripe webhook if needed"
echo ""

# Open browser (optional)
read -p "Open deployment in browser? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "https://$DEPLOY_URL" 2>/dev/null || xdg-open "https://$DEPLOY_URL" 2>/dev/null || print_info "Please open manually: https://$DEPLOY_URL"
fi

print_success "All done! 🚀"
