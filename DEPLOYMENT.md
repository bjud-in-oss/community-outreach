# Community Outreach System - Production Deployment Guide

This document provides comprehensive instructions for deploying the Community Outreach System to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Application Deployment](#application-deployment)
5. [Monitoring Setup](#monitoring-setup)
6. [Security Configuration](#security-configuration)
7. [Backup Configuration](#backup-configuration)
8. [Health Checks](#health-checks)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Ubuntu 20.04 LTS or later, CentOS 8+, or Amazon Linux 2
- **Node.js**: Version 18.x or later
- **Memory**: Minimum 4GB RAM, recommended 8GB+
- **Storage**: Minimum 50GB SSD, recommended 100GB+
- **Network**: Stable internet connection with ports 80, 443, 7687 accessible

### Required Services

- **Neo4j Database**: Version 5.x or later
- **Cloud Storage**: AWS S3, Google Cloud Storage, or Azure Blob Storage
- **Load Balancer**: AWS ALB, Google Cloud Load Balancer, or similar
- **SSL Certificate**: Valid SSL certificate for HTTPS

### Dependencies

```bash
# Install Node.js (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install Docker (optional, for containerized deployment)
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
```

## Environment Setup

### 1. Create Production User

```bash
# Create dedicated user for the application
sudo useradd -m -s /bin/bash cosystem
sudo usermod -aG sudo cosystem

# Switch to application user
sudo su - cosystem
```

### 2. Clone and Setup Application

```bash
# Clone the repository
git clone https://github.com/your-org/community-outreach-system.git
cd community-outreach-system

# Install dependencies
npm ci --production

# Build the application
npm run build
```

### 3. Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Application Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
APP_VERSION=1.0.0

# Database Configuration
NEO4J_URI=bolt://your-neo4j-server:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-secure-password
NEO4J_DATABASE=cosystem

# Security Configuration
JWT_SECRET=your-jwt-secret-key-minimum-32-characters
ENCRYPTION_KEY=your-encryption-key-32-characters

# Cloud Storage Configuration
CLOUD_PROVIDER=aws
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-cos-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# LLM Configuration
LLM_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key

# Monitoring Configuration
LOG_LEVEL=info
LOG_DESTINATION=file
ALERT_EMAIL=admin@yourdomain.com
SLACK_WEBHOOK_URL=your-slack-webhook-url

# Feature Flags
ENABLE_AUTONOMOUS_MODE=true
ENABLE_LEGACY_SYSTEM=true
ENABLE_EMPATIBRYGGAN=true
ENABLE_MINNENAS_BOK=true
ENABLE_ARCHITECT_VIEW=true

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Backup Configuration
BACKUP_S3_BUCKET=your-backup-bucket
ENABLE_CLUSTERING=false
CLUSTER_WORKERS=auto
```

## Database Configuration

### 1. Neo4j Installation

```bash
# Install Neo4j
wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
echo 'deb https://debian.neo4j.com stable 5' | sudo tee -a /etc/apt/sources.list.d/neo4j.list
sudo apt-get update
sudo apt-get install neo4j

# Configure Neo4j
sudo systemctl enable neo4j
sudo systemctl start neo4j
```

### 2. Database Setup

```bash
# Connect to Neo4j and create database
cypher-shell -u neo4j -p your-password

# Create application database
CREATE DATABASE cosystem;
USE cosystem;

# Create indexes for performance
CREATE INDEX user_id_index FOR (u:User) ON (u.id);
CREATE INDEX contact_id_index FOR (c:Contact) ON (c.id);
CREATE INDEX project_id_index FOR (p:Project) ON (p.id);
CREATE INDEX event_timestamp_index FOR (e:Event) ON (e.timestamp);
```

### 3. Database Security

```bash
# Configure Neo4j security
sudo nano /etc/neo4j/neo4j.conf

# Add these configurations:
dbms.security.auth_enabled=true
dbms.connector.bolt.listen_address=0.0.0.0:7687
dbms.connector.http.listen_address=0.0.0.0:7474
dbms.security.procedures.unrestricted=apoc.*
```

## Application Deployment

### 1. Using PM2 (Recommended)

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'community-outreach-system',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '2G',
    node_args: '--max-old-space-size=2048'
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u cosystem --hp /home/cosystem
```

### 2. Using Docker (Alternative)

```bash
# Create Dockerfile
cat > Dockerfile << EOF
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3000

USER node

CMD ["npm", "start"]
EOF

# Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
    depends_on:
      - neo4j

  neo4j:
    image: neo4j:5-community
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      - NEO4J_AUTH=neo4j/your-password
    volumes:
      - neo4j_data:/data
    restart: unless-stopped

volumes:
  neo4j_data:
EOF

# Deploy with Docker Compose
docker-compose up -d
```

## Monitoring Setup

### 1. Application Monitoring

```bash
# Install monitoring dependencies
npm install --save express-prometheus-middleware prom-client

# Setup log rotation
sudo nano /etc/logrotate.d/cosystem

# Add log rotation configuration:
/home/cosystem/community-outreach-system/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 cosystem cosystem
    postrotate
        pm2 reload community-outreach-system
    endscript
}
```

### 2. System Monitoring

```bash
# Install system monitoring tools
sudo apt-get install -y htop iotop nethogs

# Setup system health monitoring script
cat > /home/cosystem/health-check.sh << EOF
#!/bin/bash

# Check application health
curl -f http://localhost:3000/api/health || exit 1

# Check Neo4j health
cypher-shell -u neo4j -p your-password "CALL dbms.components() YIELD name, versions, edition;" || exit 2

# Check disk space
DISK_USAGE=\$(df / | tail -1 | awk '{print \$5}' | sed 's/%//')
if [ \$DISK_USAGE -gt 85 ]; then
    echo "Disk usage is \${DISK_USAGE}%"
    exit 3
fi

echo "All health checks passed"
EOF

chmod +x /home/cosystem/health-check.sh

# Add to crontab for regular health checks
crontab -e
# Add: */5 * * * * /home/cosystem/health-check.sh >> /home/cosystem/logs/health.log 2>&1
```

## Security Configuration

### 1. Firewall Setup

```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow necessary ports
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from your-admin-ip to any port 7474  # Neo4j HTTP (admin only)
sudo ufw allow from your-admin-ip to any port 7687  # Neo4j Bolt (admin only)
```

### 2. SSL Certificate

```bash
# Install Certbot for Let's Encrypt
sudo apt-get install -y certbot

# Obtain SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Setup automatic renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt-get install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cosystem

# Add configuration:
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/cosystem /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Backup Configuration

### 1. Database Backup

```bash
# Create backup script
cat > /home/cosystem/backup-database.sh << EOF
#!/bin/bash

BACKUP_DIR="/home/cosystem/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="neo4j_backup_\${DATE}.dump"

mkdir -p \$BACKUP_DIR

# Create database dump
neo4j-admin database dump --database=cosystem --to-path=\$BACKUP_DIR/\$BACKUP_FILE

# Compress backup
gzip \$BACKUP_DIR/\$BACKUP_FILE

# Upload to S3 (if configured)
if [ ! -z "\$AWS_S3_BUCKET" ]; then
    aws s3 cp \$BACKUP_DIR/\$BACKUP_FILE.gz s3://\$BACKUP_S3_BUCKET/database/\$BACKUP_FILE.gz
fi

# Clean up old backups (keep last 7 days)
find \$BACKUP_DIR -name "neo4j_backup_*.dump.gz" -mtime +7 -delete

echo "Backup completed: \$BACKUP_FILE.gz"
EOF

chmod +x /home/cosystem/backup-database.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /home/cosystem/backup-database.sh >> /home/cosystem/logs/backup.log 2>&1
```

### 2. Application Backup

```bash
# Create application backup script
cat > /home/cosystem/backup-application.sh << EOF
#!/bin/bash

BACKUP_DIR="/home/cosystem/backups"
DATE=\$(date +%Y%m%d_%H%M%S)
APP_BACKUP="app_backup_\${DATE}.tar.gz"

mkdir -p \$BACKUP_DIR

# Create application backup
tar -czf \$BACKUP_DIR/\$APP_BACKUP \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=logs \
    --exclude=backups \
    /home/cosystem/community-outreach-system

# Upload to S3 (if configured)
if [ ! -z "\$AWS_S3_BUCKET" ]; then
    aws s3 cp \$BACKUP_DIR/\$APP_BACKUP s3://\$BACKUP_S3_BUCKET/application/\$APP_BACKUP
fi

# Clean up old backups
find \$BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete

echo "Application backup completed: \$APP_BACKUP"
EOF

chmod +x /home/cosystem/backup-application.sh
```

## Health Checks

### 1. Application Health Endpoint

The application provides health check endpoints:

- `GET /api/health` - Basic health check
- `GET /api/system/health` - Detailed system health with metrics

### 2. Load Balancer Health Check

Configure your load balancer to use the health endpoint:

```yaml
# AWS ALB Target Group Health Check
HealthCheckPath: /api/health
HealthCheckIntervalSeconds: 30
HealthCheckTimeoutSeconds: 5
HealthyThresholdCount: 2
UnhealthyThresholdCount: 3
```

### 3. Monitoring Alerts

Setup monitoring alerts for:

- Application response time > 2 seconds
- Error rate > 5%
- Memory usage > 80%
- Disk usage > 85%
- Database connection failures
- SSL certificate expiration (< 30 days)

## Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check application logs
pm2 logs community-outreach-system

# Check system resources
htop
df -h

# Check port availability
sudo netstat -tlnp | grep :3000
```

#### Database Connection Issues

```bash
# Check Neo4j status
sudo systemctl status neo4j

# Check Neo4j logs
sudo journalctl -u neo4j -f

# Test database connection
cypher-shell -u neo4j -p your-password "RETURN 1;"
```

#### High Memory Usage

```bash
# Check memory usage by process
ps aux --sort=-%mem | head

# Restart application if needed
pm2 restart community-outreach-system

# Check for memory leaks
pm2 monit
```

#### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Test SSL configuration
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Renew certificate manually
sudo certbot renew --force-renewal
```

### Emergency Procedures

#### Complete System Recovery

1. **Assess the situation**
   ```bash
   # Check system status
   systemctl status
   df -h
   free -h
   ```

2. **Restore from backup**
   ```bash
   # Stop services
   pm2 stop all
   sudo systemctl stop neo4j

   # Restore database
   neo4j-admin database load --from-path=/path/to/backup cosystem --overwrite-destination=true

   # Restore application
   tar -xzf /path/to/app_backup.tar.gz -C /

   # Start services
   sudo systemctl start neo4j
   pm2 start ecosystem.config.js
   ```

3. **Verify system integrity**
   ```bash
   # Run health checks
   /home/cosystem/health-check.sh

   # Check application functionality
   curl -f https://yourdomain.com/api/health
   ```

### Support Contacts

- **System Administrator**: admin@yourdomain.com
- **Development Team**: dev@yourdomain.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX

### Useful Commands

```bash
# View application status
pm2 status

# View real-time logs
pm2 logs --lines 100

# Restart application
pm2 restart community-outreach-system

# View system resources
htop

# Check disk usage
df -h

# Check network connections
sudo netstat -tlnp

# View system logs
sudo journalctl -f
```

## Maintenance Schedule

- **Daily**: Automated backups, log rotation
- **Weekly**: Security updates, performance review
- **Monthly**: Full system backup test, disaster recovery drill
- **Quarterly**: Security audit, dependency updates
- **Annually**: SSL certificate renewal, infrastructure review