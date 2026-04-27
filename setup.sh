#!/bin/bash

# NutriTracker Quick Setup Script
# Executa todos os passos necessários para rodar o projeto

echo "🚀 NutriTracker - Quick Setup"
echo "=============================="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não instalado. Instale Docker Desktop."
    exit 1
fi

echo "✅ Docker encontrado"

# Start containers
echo ""
echo "📦 Iniciando containers (PostgreSQL, Redis, Backend)..."
docker-compose up -d

# Wait for services
echo "⏳ Aguardando serviços..."
sleep 10

echo ""
echo "✅ Backend rodando em http://localhost:3000"
echo "✅ PostgreSQL em localhost:5432"
echo "✅ Redis em localhost:6379"

echo ""
echo "📱 Para rodar o app mobile:"
echo "   cd frontend"
echo "   npm install"
echo "   npm run ios   # or npm run android"

echo ""
echo "🔍 Para verificar logs:"
echo "   docker-compose logs -f backend"

echo ""
echo "❌ Para parar:"
echo "   docker-compose down"
