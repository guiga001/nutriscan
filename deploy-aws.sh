#!/bin/bash
set -e

# NutriTracker - Automated AWS Deployment Script
# Usage: ./deploy-aws.sh <environment>
# Example: ./deploy-aws.sh staging

ENVIRONMENT=${1:-staging}
REGION="us-east-1"
PROJECT_NAME="nutritracker"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🚀 NutriTracker AWS Deployment"
echo "=============================="
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "AWS Account: $ACCOUNT_ID"
echo ""

# Step 1: Build Docker Image
echo "1️⃣ Building Docker image..."
cd backend
docker build -t $PROJECT_NAME:latest .
cd ..

# Step 2: Login to ECR
echo "2️⃣ Authenticating with ECR..."
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$PROJECT_NAME"
aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin $ECR_URI

# Step 3: Tag and Push
echo "3️⃣ Pushing image to ECR..."
docker tag $PROJECT_NAME:latest $ECR_URI:latest
docker tag $PROJECT_NAME:latest $ECR_URI:$(date +%Y%m%d-%H%M%S)
docker push $ECR_URI:latest

# Step 4: Update ECS Service
echo "4️⃣ Updating ECS service..."
SERVICE_NAME="$PROJECT_NAME-backend-service"
CLUSTER_NAME="$PROJECT_NAME-cluster"

aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --force-new-deployment \
  --region $REGION

# Step 5: Wait for deployment
echo "5️⃣ Waiting for deployment to complete..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $REGION

# Step 6: Get ALB DNS
echo "6️⃣ Deployment complete! ✅"
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names "$PROJECT_NAME-alb" \
  --query "LoadBalancers[0].DNSName" \
  --output text \
  --region $REGION)

echo ""
echo "✨ Application deployed successfully!"
echo "📍 Access at: http://$ALB_DNS"
echo ""
echo "📊 Check status:"
echo "   aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION"
echo ""
echo "📋 View logs:"
echo "   aws logs tail /ecs/$PROJECT_NAME-backend --follow --region $REGION"
