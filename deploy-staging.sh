#!/bin/bash

# NutriTracker - Staging Server Quick Setup
# For development/testing on a single EC2 instance

set -e

echo "🚀 NutriTracker - Staging Server Setup"
echo "======================================"

# Update system
echo "📦 Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER

# Install Node.js
echo "📦 Installing Node.js..."
curl -sL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL Client (for migrations)
echo "🗄️ Installing PostgreSQL client..."
sudo apt install -y postgresql-client

# Clone repo
echo "📥 Cloning NutriTracker..."
git clone https://github.com/guiga001/nutriscan.git
cd nutriscan

# Create environment file
echo "⚙️ Creating .env file..."
cat > backend/.env << EOF
NODE_ENV=production
PORT=3000
DB_HOST=db.example.com
DB_PORT=5432
DB_USER=nutritracker
DB_PASSWORD=your-secure-password
DB_NAME=nutritracker_db
REDIS_HOST=redis.example.com
REDIS_PORT=6379
JWT_SECRET=$(openssl rand -base64 32)
OPENFOODFACTS_API_URL=https://world.openfoodfacts.org/api/v0
EOF

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services..."
sleep 10

# Check health
echo "✅ Service status:"
curl -s http://localhost:3000/health || echo "Still starting..."

echo ""
echo "✨ Staging server ready!"
echo "📍 Backend: http://localhost:3000"
echo "📋 View logs: docker-compose logs -f backend"
echo "❌ Stop: docker-compose down"
