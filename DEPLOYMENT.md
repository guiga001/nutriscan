# 🚀 NutriTracker - Deployment Guide (AWS)

## Overview

Deploy completo no **AWS** com:
- **ECS Fargate** (Backend container)
- **RDS PostgreSQL** (Database)
- **ElastiCache Redis** (Cache)
- **ECR** (Container Registry)
- **CloudFront** (CDN para assets)
- **Route53** (DNS)
- **CloudWatch** (Logging & Monitoring)

---

## ⏱️ Tempo Total: ~30-45 minutos

---

## PRÉ-REQUISITOS

```bash
# 1. AWS Account com credenciais configuradas
aws configure

# 2. AWS CLI instalado
aws --version  # v2.13+

# 3. Docker instalado
docker --version

# 4. Node.js 22+
node --version

# 5. Terraform (opcional, para IaC)
terraform --version

# 6. jq (para parsing JSON)
brew install jq  # macOS
apt install jq   # Linux
```

---

## STEP 1: Setup AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Fornecenha:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1 (recomendado)
# - Default format: json

# Verificar credenciais
aws sts get-caller-identity
# Output:
# {
#   "UserId": "...",
#   "Account": "123456789012",
#   "Arn": "arn:aws:iam::123456789012:user/nome"
# }
```

---

## STEP 2: Criar ECR Repository (Container Registry)

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name nutritracker-backend \
  --region us-east-1 \
  --image-tag-mutability MUTABLE

# Resultado:
# {
#   "repository": {
#     "repositoryUri": "123456789012.dkr.ecr.us-east-1.amazonaws.com/nutritracker-backend"
#   }
# }

# Salvar essa URI (você vai usar depois)
export ECR_URI="123456789012.dkr.ecr.us-east-1.amazonaws.com/nutritracker-backend"
```

---

## STEP 3: Build & Push Docker Image

```bash
# 1. Login no ECR
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin $ECR_URI

# 2. Build image localmente
cd backend
docker build -t nutritracker:latest .

# 3. Tag para ECR
docker tag nutritracker:latest $ECR_URI:latest
docker tag nutritracker:latest $ECR_URI:v1.0.0

# 4. Push para ECR
docker push $ECR_URI:latest
docker push $ECR_URI:v1.0.0

# 5. Verificar
aws ecr describe-images \
  --repository-name nutritracker-backend \
  --region us-east-1
```

---

## STEP 4: Setup RDS PostgreSQL

### 4.1 Criar Security Group

```bash
# Create VPC (se não tiver)
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=nutritracker-vpc}]'

# Export VPC_ID
export VPC_ID="vpc-xxxxxxxxx"

# Create Security Group para RDS
aws ec2 create-security-group \
  --group-name nutritracker-rds-sg \
  --description "RDS security group for NutriTracker" \
  --vpc-id $VPC_ID

export RDS_SG_ID="sg-xxxxxxxxx"

# Permitir porta 5432 (PostgreSQL)
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr 10.0.0.0/16
```

### 4.2 Criar RDS Instance

```bash
# Create DB Subnet Group
aws rds create-db-subnet-group \
  --db-subnet-group-name nutritracker-db-subnet \
  --db-subnet-group-description "Subnet group for NutriTracker DB" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# Create RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier nutritracker-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username nutritracker \
  --master-user-password "YourSecurePassword123!" \
  --allocated-storage 20 \
  --vpc-security-group-ids $RDS_SG_ID \
  --db-subnet-group-name nutritracker-db-subnet \
  --backup-retention-period 7 \
  --multi-az \
  --storage-encrypted \
  --enable-iam-database-authentication \
  --enable-cloudwatch-logs-exports postgresql

# Aguardar criação (~10 minutos)
watch -n 5 'aws rds describe-db-instances \
  --db-instance-identifier nutritracker-postgres \
  --query "DBInstances[0].DBInstanceStatus"'

# Quando estiver "available", pegar endpoint
aws rds describe-db-instances \
  --db-instance-identifier nutritracker-postgres \
  --query "DBInstances[0].Endpoint.Address" \
  --output text

# Exportar
export RDS_ENDPOINT="nutritracker-postgres.c123456.us-east-1.rds.amazonaws.com"
```

### 4.3 Aplicar Migrations

```bash
# 1. Instalar tabelas (via SSH tunnel ou client local)
psql -h $RDS_ENDPOINT \
     -U nutritracker \
     -d nutritracker_db \
     -f database/migrations.sql

# Password: YourSecurePassword123!
```

---

## STEP 5: Setup ElastiCache Redis

```bash
# Create Security Group para Redis
aws ec2 create-security-group \
  --group-name nutritracker-redis-sg \
  --description "Redis security group" \
  --vpc-id $VPC_ID

export REDIS_SG_ID="sg-yyyyyyyyy"

# Allow port 6379
aws ec2 authorize-security-group-ingress \
  --group-id $REDIS_SG_ID \
  --protocol tcp \
  --port 6379 \
  --cidr 10.0.0.0/16

# Create Cache Subnet Group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name nutritracker-redis-subnet \
  --cache-subnet-group-description "Redis subnet group" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# Create Redis Cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id nutritracker-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name nutritracker-redis-subnet \
  --security-group-ids $REDIS_SG_ID \
  --auto-failover-enabled \
  --multi-az-enabled

# Obter endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id nutritracker-redis \
  --show-cache-node-info \
  --query "CacheClusters[0].CacheNodes[0].Endpoint"

export REDIS_ENDPOINT="nutritracker-redis.xxxxx.ng.0001.use1.cache.amazonaws.com:6379"
```

---

## STEP 6: Criar ECS Cluster & Task Definition

### 6.1 Criar ECS Cluster

```bash
# Create Cluster
aws ecs create-cluster \
  --cluster-name nutritracker-cluster \
  --configuration name=containerInsights,value=enabled

# Create CloudWatch Log Group
aws logs create-log-group \
  --log-group-name /ecs/nutritracker-backend
```

### 6.2 Criar Task Definition

```bash
# Criar arquivo task-definition.json
cat > task-definition.json << 'EOF'
{
  "family": "nutritracker-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "nutritracker-backend",
      "image": "ECR_URI:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DB_HOST",
          "value": "RDS_ENDPOINT"
        },
        {
          "name": "DB_PORT",
          "value": "5432"
        },
        {
          "name": "DB_USER",
          "value": "nutritracker"
        },
        {
          "name": "REDIS_HOST",
          "value": "REDIS_ENDPOINT"
        },
        {
          "name": "REDIS_PORT",
          "value": "6379"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:nutritracker/db-password:password::"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:nutritracker/jwt-secret:jwt-secret::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/nutritracker-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Substituir placeholders
sed -i "s|ECR_URI|$ECR_URI|g" task-definition.json
sed -i "s|RDS_ENDPOINT|$RDS_ENDPOINT|g" task-definition.json
sed -i "s|REDIS_ENDPOINT|$REDIS_ENDPOINT|g" task-definition.json

# Registrar Task Definition
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json
```

---

## STEP 7: Armazenar Secrets no AWS Secrets Manager

```bash
# Create DB Password Secret
aws secretsmanager create-secret \
  --name nutritracker/db-password \
  --secret-string "YourSecurePassword123!" \
  --description "RDS Database Password"

# Create JWT Secret
aws secretsmanager create-secret \
  --name nutritracker/jwt-secret \
  --secret-string "your-very-long-random-secret-key-here-min-32-chars" \
  --description "JWT Signing Secret"

# Atualizar IAM Role para ECS Task acessar secrets
# (Isso é complexo, recomendo usar console AWS ou Terraform)
```

---

## STEP 8: Criar ECS Service

```bash
# Get Subnets da VPC
export SUBNET_ID=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query "Subnets[0].SubnetId" \
  --output text)

# Create Service
aws ecs create-service \
  --cluster nutritracker-cluster \
  --service-name nutritracker-backend-service \
  --task-definition nutritracker-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ID],securityGroups=$RDS_SG_ID,assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/nutritracker/xxxxx,containerName=nutritracker-backend,containerPort=3000" \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100"

# Aguardar service estar running
watch -n 5 'aws ecs describe-services \
  --cluster nutritracker-cluster \
  --services nutritracker-backend-service \
  --query "services[0].deployments"'
```

---

## STEP 9: Setup Application Load Balancer (ALB)

```bash
# Create Target Group
aws elbv2 create-target-group \
  --name nutritracker-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-protocol HTTP \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

export TARGET_GROUP_ARN="arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/nutritracker/xxxxx"

# Create ALB
aws elbv2 create-load-balancer \
  --name nutritracker-alb \
  --subnets $SUBNET_ID subnet-yyyyy \
  --security-groups $RDS_SG_ID \
  --scheme internet-facing \
  --type application

export ALB_ARN="arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/nutritracker-alb/xxxxx"

# Create Listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions "Type=forward,TargetGroupArn=$TARGET_GROUP_ARN"

# Get ALB DNS
aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query "LoadBalancers[0].DNSName" \
  --output text
```

---

## STEP 10: Setup CloudFront CDN (Optional)

```bash
# Create S3 bucket para assets
aws s3 mb s3://nutritracker-assets-$(date +%s) \
  --region us-east-1

# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name nutritracker-alb-xxxxx.us-east-1.elb.amazonaws.com \
  --default-cache-behavior ForwardedValues={QueryString=true,Cookies={Forward=all}},ViewerProtocolPolicy=redirect-to-https,TargetOriginId=MyOrigin,TrustedSigners=self
```

---

## STEP 11: Setup Domain & HTTPS (Route53 + ACM)

```bash
# 1. Request Certificate no ACM
aws acm request-certificate \
  --domain-name api.nutritracker.com \
  --validation-method DNS \
  --subject-alternative-names api.*.nutritracker.com

# 2. Validar no Route53 (manual ou automático)

# 3. Create Hosted Zone no Route53
aws route53 create-hosted-zone \
  --name nutritracker.com \
  --caller-reference $(date +%s)

# 4. Create Alias Record
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.nutritracker.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "nutritracker-alb-xxxxx.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

---

## STEP 12: Monitoramento & Logs

```bash
# View CloudWatch Logs
aws logs tail /ecs/nutritracker-backend --follow

# Setup CloudWatch Alarms
aws cloudwatch put-metric-alarm \
  --alarm-name nutritracker-high-error-rate \
  --alarm-description "Alert if error rate > 1%" \
  --metric-name ErrorCount \
  --namespace AWS/ECS \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

---

## 📋 CHECKLIST DE PRODUÇÃO

- [ ] AWS Account criada
- [ ] ECR Repository criado
- [ ] Docker image built e pushed
- [ ] RDS PostgreSQL rodando
- [ ] Database migrations aplicadas
- [ ] ElastiCache Redis rodando
- [ ] ECS Cluster criado
- [ ] Task Definition registrada
- [ ] ECS Service rodando
- [ ] ALB criado e saudável
- [ ] Security Groups confirmadas
- [ ] CloudWatch Logs configurado
- [ ] Secrets armazenados no Secrets Manager
- [ ] Domain & SSL configurados
- [ ] DNS apontando para ALB
- [ ] Testes de carga passando
- [ ] Monitoring & Alarms configurados
- [ ] Backup automático ativado
- [ ] Disaster recovery testado
- [ ] Production ready ✅

---

## 🔄 DEPLOYMENT CONTÍNUO (CI/CD via GitHub Actions)

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS ECS

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker Image
        run: docker build -t ${{ secrets.ECR_URI }}:latest ./backend
      
      - name: Push to ECR
        run: |
          aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${{ secrets.ECR_URI }}
          docker push ${{ secrets.ECR_URI }}:latest
      
      - name: Update ECS Service
        run: |
          aws ecs update-service \
            --cluster nutritracker-cluster \
            --service nutritracker-backend-service \
            --force-new-deployment
```

---

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| Task falha ao iniciar | Ver logs: `aws logs tail /ecs/nutritracker-backend` |
| Conexão RDS recusada | Check Security Groups, porta 5432 |
| Redis unreachable | Verify ElastiCache security group |
| High latency | Enable cache, check ALB health |
| Out of memory | Aumentar CPU/Memory no ECS (de 256MB para 512MB) |

---

## 💰 CUSTO ESTIMADO (USA - us-east-1)

| Serviço | Tier | Custo/mês |
|---------|------|-----------|
| ECS Fargate | 256 CPU, 512 MB | $30 |
| RDS PostgreSQL | db.t3.micro, 20GB | $40 |
| ElastiCache Redis | cache.t3.micro | $20 |
| ALB | 1 balancer | $16 |
| Data transfer | 100GB/mês | $10 |
| **TOTAL** | | **~$116/mês** |

---

## 📚 Documentação AWS

- [ECS Fargate](https://docs.aws.amazon.com/ecs/latest/developerguide/launch_types.html)
- [RDS PostgreSQL](https://docs.aws.amazon.com/rds/latest/userguide/Welcome.html)
- [ElastiCache Redis](https://docs.aws.amazon.com/elasticache/latest/userguide/CacheNodes.html)
- [Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [CloudWatch Monitoring](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/)

---

**Happy Deploying! 🚀**
