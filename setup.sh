#!/bin/bash

set -e

echo "🚀 Setting up Multi-User Movie & Series Tracker..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "🐳 Starting Docker services (PostgreSQL + OAuth mock)..."
docker-compose up -d

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

echo "🗄️  Running database migrations..."
cd backend
PGPASSWORD=postgres psql -h localhost -U postgres -d movietracker -f src/infrastructure/persistence/migrations/001_initial_schema.sql
PGPASSWORD=postgres psql -h localhost -U postgres -d movietracker -f src/infrastructure/persistence/migrations/002_seed_data.sql
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Services:"
echo "  Backend API:    http://localhost:3000"
echo "  Frontend:       http://localhost:5173"
echo "  PostgreSQL:     localhost:5432"
echo "  OAuth Mock:     http://localhost:3001"
