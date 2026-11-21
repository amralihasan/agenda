#!/usr/bin/env bash
# ==============================================================================
# DIGITAL PAPER AGENDA - Production Deployment Script
# ==============================================================================
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Custom environment variables (optional):
#   BRANCH=dev (default)
#   PORT=3001 (default)
#   APP_NAME="agenda-app" (default)
# ==============================================================================

set -e # Exit immediately if any command returns a non-zero exit code

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}   📜 Digital Paper Agenda - Production Deployment    ${NC}"
echo -e "${CYAN}=====================================================${NC}"

# Absolute application root directory
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANCH="${BRANCH:-dev}"
PORT="${PORT:-3001}"
APP_NAME="${APP_NAME:-agenda-app}"

cd "$APP_DIR"
echo -e "${BLUE}▶ Working directory: ${APP_DIR}${NC}"
echo -e "${BLUE}▶ Target git branch: ${BRANCH}${NC}"
echo -e "${BLUE}▶ Application port:  ${PORT}${NC}"

# ------------------------------------------------------------------------------
# 1. Environment & Tools Verification
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[1/7] Verifying Node.js and runtime prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}✘ Node.js is not installed. Please install Node.js (version 18 or higher).${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✘ npm is not installed. Please install npm.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✔ Detected Node: ${NODE_VERSION} | npm: ${NPM_VERSION}${NC}"

# ------------------------------------------------------------------------------
# 2. Git Synchronization
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[2/7] Pulling latest code changes from Git repository...${NC}"

if [ -d ".git" ]; then
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
    echo -e "${GREEN}✔ Successfully updated branch '${BRANCH}' to latest commit: $(git rev-parse --short HEAD)${NC}"
else
    echo -e "${YELLOW}⚠ .git folder not found. Skipping git pull.${NC}"
fi

# ------------------------------------------------------------------------------
# 3. Environment Configuration (.env)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[3/7] Checking server environment variables (.env)...${NC}"

if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}Creating server/.env with standard production configuration...${NC}"
    cat <<EOF > server/.env
NODE_ENV=production
PORT=${PORT}
DATABASE_URL="file:./dev.db"
EOF
    echo -e "${GREEN}✔ server/.env created.${NC}"
else
    echo -e "${GREEN}✔ server/.env found.${NC}"
fi

# Ensure a JWT signing secret exists (auth sessions survive restarts).
if ! grep -q '^JWT_SECRET=' server/.env; then
    printf 'JWT_SECRET="%s"\n' "$(openssl rand -hex 32)" >> server/.env
    echo -e "${GREEN}✔ JWT_SECRET generated and added to server/.env.${NC}"
fi

# ------------------------------------------------------------------------------
# 4. Dependency Installation
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[4/7] Installing npm workspace dependencies...${NC}"
npm install --prefer-offline --no-audit

echo -e "${GREEN}✔ Dependencies installed successfully.${NC}"

# ------------------------------------------------------------------------------
# 5. Database Schema Synchronization (Prisma)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[5/7] Synchronizing SQLite Prisma database...${NC}"
cd server
npx prisma generate
npx prisma db push --skip-generate
cd "$APP_DIR"
echo -e "${GREEN}✔ Database schema synchronized successfully.${NC}"

# ------------------------------------------------------------------------------
# 6. Production Build (Server TypeScript & Client Vite)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[6/7] Building production bundles (Server & Client)...${NC}"
npm run build
echo -e "${GREEN}✔ Server and Client built successfully.${NC}"

# ------------------------------------------------------------------------------
# 7. Process Management (PM2 or Node)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[7/7] Starting/Reloading application process...${NC}"

if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "$APP_NAME"; then
        echo -e "${BLUE}Reloading active PM2 process '${APP_NAME}'...${NC}"
        pm2 reload "$APP_NAME" --update-env || pm2 restart "$APP_NAME" --update-env
    else
        echo -e "${BLUE}Starting new PM2 process '${APP_NAME}' on port ${PORT}...${NC}"
        pm2 start server/dist/index.js --name "$APP_NAME" --env production
    fi
    pm2 save
    echo -e "${GREEN}✔ PM2 process '${APP_NAME}' is active.${NC}"
else
    echo -e "${YELLOW}⚠ PM2 is not installed globally.${NC}"
    echo -e "${CYAN}Tip: For zero-downtime reloads and automatic restarts, install PM2: npm install -g pm2${NC}"
    echo -e "${BLUE}Starting server via node in background...${NC}"
    # Stop existing background node process if running on port
    PID=$(lsof -ti :"$PORT" || true)
    if [ -n "$PID" ]; then
        echo -e "${YELLOW}Stopping existing process on port ${PORT} (PID: ${PID})...${NC}"
        kill -9 "$PID" || true
        sleep 1
    fi
    NODE_ENV=production PORT="$PORT" nohup node server/dist/index.js > server.log 2>&1 &
    echo -e "${GREEN}✔ Application started in background (PID: $!). Output logged to server.log${NC}"
fi

# ------------------------------------------------------------------------------
# Verification & Health Check
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}=====================================================${NC}"
echo -e "${CYAN}   🔍 Verifying Application Health...                ${NC}"
echo -e "${CYAN}=====================================================${NC}"
sleep 2

HEALTH_CHECK=$(curl -s "http://localhost:${PORT}/api/health" || echo "")

if [[ "$HEALTH_CHECK" == *"ok"* ]]; then
    echo -e "${GREEN}✔ Health Check Passed: ${HEALTH_CHECK}${NC}"
    echo -e "\n${GREEN}🚀 Deployment Succeeded!${NC}"
    echo -e "${GREEN}The Digital Paper Agenda is live at: http://localhost:${PORT}${NC}"
else
    echo -e "${YELLOW}⚠ Could not immediately reach http://localhost:${PORT}/api/health.${NC}"
    echo -e "${YELLOW}Please inspect the application logs for details.${NC}"
fi

echo -e "\n${BLUE}Management commands:${NC}"
echo -e "  pm2 status             - Show status of all services"
echo -e "  pm2 logs ${APP_NAME}       - Stream real-time production logs"
echo -e "  pm2 restart ${APP_NAME}    - Restart application"
echo -e "${CYAN}=====================================================${NC}"
