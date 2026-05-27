#!/usr/bin/env bash
# ============================================================
# AI Job Hunter - Setup Script
# ============================================================

set -e
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
CYAN="\033[0;36m"
NC="\033[0m"

echo ""
echo -e "${CYAN}  ⚡ AI Job Hunter Setup${NC}"
echo "  ================================"
echo ""

# Check prerequisites
check_cmd() {
    command -v "$1" >/dev/null 2>&1 || { echo "  ✗ $1 is required but not installed."; exit 1; }
    echo -e "  ${GREEN}✓${NC} $1 found"
}

echo "Checking prerequisites..."
check_cmd docker
check_cmd docker-compose || check_cmd "docker compose"
check_cmd node
check_cmd python3
echo ""

# Copy env file
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "  ${YELLOW}⚠ Please edit .env and add your API keys before continuing${NC}"
    echo ""
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..
echo -e "  ${GREEN}✓${NC} Frontend dependencies installed"
echo ""

# Install backend dependencies (local dev)
echo "Installing backend dependencies..."
cd backend
python3 -m pip install -r requirements.txt -q
python3 -m playwright install chromium
cd ..
echo -e "  ${GREEN}✓${NC} Backend dependencies installed"
echo ""

echo "  ================================"
echo -e "  ${GREEN}Setup complete!${NC}"
echo ""
echo "  Next steps:"
echo "  1. Edit .env with your API keys (OPENAI_API_KEY, TELEGRAM_BOT_TOKEN, etc.)"
echo "  2. Run:  docker-compose up --build"
echo "  3. Open: http://localhost:3000"
echo ""
echo "  Or for local development without Docker:"
echo "  Backend:  cd backend && uvicorn main:app --reload"
echo "  Frontend: cd frontend && npm run dev"
echo "  Worker:   cd backend && celery -A workers.celery_app worker --loglevel=info"
echo ""
