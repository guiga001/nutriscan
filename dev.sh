#!/bin/bash

# Start development environment

echo "🚀 Starting NutriTracker Development Environment"
echo "==============================================="
echo ""

# Check prerequisites
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install Node.js 22+."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Install Docker Desktop."
    exit 1
fi

echo "✅ Prerequisites OK"
echo ""

# Start Docker services
echo "📦 Starting Docker containers..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services (10s)..."
sleep 10

echo ""
echo "✅ Backend running at: http://localhost:3000"
echo "✅ PostgreSQL at: localhost:5432 (user: nutritracker, pwd: dev123456)"
echo "✅ Redis at: localhost:6379"
echo ""

echo "📱 To start mobile app:"
echo "   cd frontend"
echo "   npm install"
echo "   npm run ios"
echo ""

echo "🔍 To view logs:"
echo "   docker-compose logs -f backend"
echo ""

echo "❌ To stop all services:"
echo "   docker-compose down"
