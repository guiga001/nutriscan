#!/bin/bash

# NutriTracker - Project Structure Summary

echo "📁 NutriTracker Project Structure"
echo "=================================="
echo ""

echo "📦 Backend (NestJS):"
find backend/src -type f -name "*.ts" | head -20
echo ""

echo "📱 Frontend (React Native):"
find frontend/src -type f -name "*.tsx" -o -type f -name "*.ts" | head -15
echo ""

echo "🗄️ Database:"
ls -lh database/
echo ""

echo "🐳 Infrastructure:"
ls -lh *.yml *.sh 2>/dev/null
echo ""

echo "📊 Total Files Created:"
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.sql" -o -name "*.json" \) -not -path "*/node_modules/*" | wc -l

echo ""
echo "✅ Project Structure Complete!"
