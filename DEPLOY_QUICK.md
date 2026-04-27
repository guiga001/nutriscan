# 🚀 NutriTracker - Deploy Checklist Rápido

## 3 Opções de Deploy

---

## ✅ Opção 1: Local (Desenvolvimento)

```bash
chmod +x setup.sh
./setup.sh

# Acesso: http://localhost:3000
```

**Melhor para**: Desenvolvimento local, testes

---

## ✅ Opção 2: Linux Server (Staging)

```bash
chmod +x deploy-staging.sh
./deploy-staging.sh

# Acesso: http://seu-servidor:3000
```

**Melhor para**: Staging, testes pré-produção

**Custos**: ~$5-10/mês (t2.micro EC2)

---

## ✅ Opção 3: AWS (Produção)

**Arquivos necessários:**

1. `DEPLOYMENT.md` - Guia passo a passo completo (30-45 min)
2. `deploy-aws.sh` - Script automatizado de deploy

### Passo Rápido:

```bash
# 1. Ler guia completo
cat DEPLOYMENT.md

# 2. Setup AWS (primeiro deploy apenas)
# - Criar ECR repository
# - Criar RDS database  
# - Criar ElastiCache Redis
# - Criar ECS cluster

# 3. Deploy
chmod +x deploy-aws.sh
./deploy-aws.sh production

# Acesso: http://seu-dominio.com
```

**Melhor para**: Produção, alta disponibilidade

**Custos**: ~$100-200/mês

---

## 📋 Arquivos de Deploy

| Arquivo | Descrição | Tempo |
|---------|-----------|-------|
| `DEPLOYMENT.md` | Guia passo a passo AWS (completo) | 45 min |
| `deploy-aws.sh` | Script automatizado (imagem + ECS) | 5 min |
| `deploy-staging.sh` | Script para staging server | 5 min |
| `docker-compose.yml` | Local development | 1 min |
| `backend/Dockerfile` | Build da imagem | Incluído |

---

## 🛣️ Roadmap de Deploy

### Semana 1: Local
```
Desenvolvimento local (docker-compose)
└─ Testar funcionalidades
```

### Semana 2: Staging
```
EC2 + RDS + ElastiCache
└─ Beta testing com 10-20 usuários
```

### Semana 3-4: Produção
```
ECS Fargate + RDS Multi-AZ + ElastiCache + CloudFront
└─ Launch público
```

---

## 🆘 Troubleshooting

### Backend não inicia
```bash
# Ver logs
docker-compose logs -f backend
# ou (AWS)
aws logs tail /ecs/nutritracker-backend --follow
```

### Database connection failed
```bash
# Verificar credenciais
cat backend/.env | grep DB_

# Testar conexão
psql -h RDS_ENDPOINT -U nutritracker -d nutritracker_db
```

### Redis unreachable
```bash
# Testar conexão
redis-cli -h REDIS_ENDPOINT ping
# Resposta: PONG ✅
```

---

## 📊 Monitoramento

### Local
```bash
docker-compose logs -f
```

### AWS
```bash
# Logs
aws logs tail /ecs/nutritracker-backend --follow

# Performance
aws cloudwatch get-metric-statistics \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --start-time 2024-04-27T00:00:00Z \
  --end-time 2024-04-27T23:59:59Z \
  --period 300 \
  --statistics Average
```

---

## 🔐 Segurança Checklist

- [ ] Environment variables não em git
- [ ] SSL/HTTPS configurado
- [ ] Database backups automáticos
- [ ] Security groups configurados
- [ ] Secrets em AWS Secrets Manager
- [ ] Rate limiting ativo
- [ ] Logs centralizados (CloudWatch)
- [ ] Alertas configurados

---

## 📈 Performance

Após deploy, testar:

```bash
# Load test
ab -n 1000 -c 100 http://seu-url/api/v1/health

# Resultado esperado:
# - < 200ms latency (p95)
# - 99.9% success rate
```

---

**Próximo passo:** 

- Desenvolvimento? → `setup.sh`
- Staging? → `deploy-staging.sh`  
- Produção? → Ler `DEPLOYMENT.md` + `deploy-aws.sh`
