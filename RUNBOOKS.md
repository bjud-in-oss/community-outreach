# Community Outreach System - Operational Runbooks

This document contains step-by-step procedures for common operational tasks and incident response for the Community Outreach System.

## Table of Contents

1. [System Startup and Shutdown](#system-startup-and-shutdown)
2. [Incident Response](#incident-response)
3. [Performance Issues](#performance-issues)
4. [Database Operations](#database-operations)
5. [Backup and Recovery](#backup-and-recovery)
6. [Security Incidents](#security-incidents)
7. [Maintenance Procedures](#maintenance-procedures)
8. [Monitoring and Alerting](#monitoring-and-alerting)

## System Startup and Shutdown

### Normal System Startup

**Objective**: Start all system components in the correct order

**Prerequisites**: 
- System administrator access
- All required services installed
- Environment variables configured

**Procedure**:

1. **Start Database Services**
   ```bash
   # Start Neo4j database
   sudo systemctl start neo4j
   
   # Verify database is running
   sudo systemctl status neo4j
   
   # Test database connectivity
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "RETURN 1 as test;"
   ```

2. **Start Application Services**
   ```bash
   # Navigate to application directory
   cd /home/cosystem/community-outreach-system
   
   # Start application with PM2
   pm2 start ecosystem.config.js
   
   # Verify application status
   pm2 status
   ```

3. **Start Web Server**
   ```bash
   # Start Nginx reverse proxy
   sudo systemctl start nginx
   
   # Verify Nginx status
   sudo systemctl status nginx
   ```

4. **Verify System Health**
   ```bash
   # Run health check script
   /home/cosystem/health-check.sh
   
   # Check application endpoint
   curl -f https://yourdomain.com/api/health
   
   # Check system metrics endpoint
   curl -f https://yourdomain.com/api/system/health
   ```

**Expected Results**: All services running, health checks passing

**Rollback**: If startup fails, stop services in reverse order and investigate logs

### Graceful System Shutdown

**Objective**: Safely shutdown all system components

**Procedure**:

1. **Stop Web Traffic**
   ```bash
   # Stop Nginx to prevent new requests
   sudo systemctl stop nginx
   ```

2. **Drain Application Connections**
   ```bash
   # Gracefully stop application
   pm2 stop community-outreach-system
   
   # Wait for connections to drain (30 seconds)
   sleep 30
   ```

3. **Stop Database**
   ```bash
   # Stop Neo4j database
   sudo systemctl stop neo4j
   ```

4. **Verify Shutdown**
   ```bash
   # Check that no processes are listening on application ports
   sudo netstat -tlnp | grep -E ':(3000|7474|7687)'
   ```

## Incident Response

### High Error Rate Alert

**Trigger**: Error rate > 5% for 5 minutes
**Severity**: High
**Response Time**: 15 minutes

**Immediate Actions**:

1. **Assess Impact**
   ```bash
   # Check current error rate
   curl -s https://yourdomain.com/api/system/health | jq '.metrics.error_rate_percentage'
   
   # Check recent error logs
   pm2 logs community-outreach-system --lines 50 | grep -i error
   ```

2. **Identify Root Cause**
   ```bash
   # Check system resources
   htop
   df -h
   free -h
   
   # Check database connectivity
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "CALL dbms.listConnections();"
   
   # Check external service dependencies
   curl -f $OPENAI_API_ENDPOINT || echo "OpenAI API unreachable"
   ```

3. **Immediate Mitigation**
   ```bash
   # If memory issue, restart application
   if [ $(free | grep Mem | awk '{print ($3/$2) * 100.0}' | cut -d. -f1) -gt 90 ]; then
       pm2 restart community-outreach-system
   fi
   
   # If database issue, restart Neo4j
   if ! cypher-shell -u neo4j -p $NEO4J_PASSWORD "RETURN 1;" > /dev/null 2>&1; then
       sudo systemctl restart neo4j
       sleep 30
   fi
   ```

4. **Monitor Recovery**
   ```bash
   # Watch error rate for 10 minutes
   for i in {1..10}; do
       ERROR_RATE=$(curl -s https://yourdomain.com/api/system/health | jq '.metrics.error_rate_percentage')
       echo "$(date): Error rate: $ERROR_RATE%"
       sleep 60
   done
   ```

**Escalation**: If error rate doesn't improve within 30 minutes, escalate to development team

### Application Unresponsive

**Trigger**: Health check failures for 3 consecutive attempts
**Severity**: Critical
**Response Time**: 5 minutes

**Immediate Actions**:

1. **Verify Unresponsiveness**
   ```bash
   # Test application endpoint with timeout
   timeout 10 curl -f https://yourdomain.com/api/health || echo "Application unresponsive"
   
   # Check if process is running
   pm2 status community-outreach-system
   ```

2. **Check System Resources**
   ```bash
   # Check CPU and memory usage
   top -b -n 1 | head -20
   
   # Check disk space
   df -h
   
   # Check for out-of-memory kills
   dmesg | grep -i "killed process"
   ```

3. **Restart Application**
   ```bash
   # Force restart application
   pm2 restart community-outreach-system
   
   # Wait for startup
   sleep 30
   
   # Verify recovery
   curl -f https://yourdomain.com/api/health
   ```

4. **If Still Unresponsive**
   ```bash
   # Check system logs
   sudo journalctl -u nginx -n 50
   sudo journalctl -n 50
   
   # Restart all services
   sudo systemctl restart nginx
   pm2 restart all
   sudo systemctl restart neo4j
   ```

### Database Connection Failures

**Trigger**: Database connection errors in application logs
**Severity**: High
**Response Time**: 10 minutes

**Procedure**:

1. **Verify Database Status**
   ```bash
   # Check Neo4j service status
   sudo systemctl status neo4j
   
   # Check Neo4j logs
   sudo journalctl -u neo4j -n 50
   
   # Test direct connection
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "RETURN datetime() as current_time;"
   ```

2. **Check Connection Pool**
   ```bash
   # Check active connections
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "CALL dbms.listConnections();"
   
   # Check for connection leaks in application logs
   pm2 logs community-outreach-system | grep -i "connection"
   ```

3. **Restart Database if Needed**
   ```bash
   # If database is unresponsive
   sudo systemctl restart neo4j
   
   # Wait for startup
   sleep 60
   
   # Verify database is accessible
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "MATCH (n) RETURN count(n) LIMIT 1;"
   ```

4. **Restart Application**
   ```bash
   # Restart application to reset connection pool
   pm2 restart community-outreach-system
   
   # Monitor for connection recovery
   pm2 logs community-outreach-system --lines 20
   ```

## Performance Issues

### High Response Time

**Trigger**: Average response time > 2 seconds for 10 minutes
**Severity**: Medium
**Response Time**: 20 minutes

**Investigation Steps**:

1. **Identify Bottlenecks**
   ```bash
   # Check system load
   uptime
   
   # Check I/O wait
   iostat -x 1 5
   
   # Check memory usage
   free -h
   
   # Check swap usage
   swapon -s
   ```

2. **Database Performance**
   ```bash
   # Check slow queries
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "CALL dbms.listQueries();"
   
   # Check database metrics
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "CALL dbms.queryJmx('org.neo4j:instance=kernel#0,name=Store file sizes');"
   ```

3. **Application Performance**
   ```bash
   # Check for memory leaks
   pm2 monit
   
   # Check garbage collection
   pm2 logs community-outreach-system | grep -i "gc"
   
   # Check for blocked event loop
   pm2 logs community-outreach-system | grep -i "blocked"
   ```

**Optimization Actions**:

1. **Database Optimization**
   ```bash
   # Update database statistics
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "CALL db.stats.retrieve('GRAPH COUNTS');"
   
   # Check and create missing indexes
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "SHOW INDEXES;"
   ```

2. **Application Optimization**
   ```bash
   # Increase Node.js memory limit if needed
   pm2 delete community-outreach-system
   pm2 start ecosystem.config.js --node-args="--max-old-space-size=4096"
   
   # Enable application-level caching
   # (This would be done through configuration)
   ```

### High Memory Usage

**Trigger**: Memory usage > 80% for 15 minutes
**Severity**: Medium
**Response Time**: 15 minutes

**Procedure**:

1. **Identify Memory Consumers**
   ```bash
   # Check memory usage by process
   ps aux --sort=-%mem | head -10
   
   # Check Node.js heap usage
   pm2 show community-outreach-system
   ```

2. **Check for Memory Leaks**
   ```bash
   # Monitor memory growth over time
   for i in {1..10}; do
       ps -p $(pgrep -f "community-outreach-system") -o pid,vsz,rss,pmem,comm
       sleep 60
   done
   ```

3. **Immediate Actions**
   ```bash
   # If memory usage is critical (>95%)
   MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
   if [ $MEMORY_USAGE -gt 95 ]; then
       echo "Critical memory usage: ${MEMORY_USAGE}%"
       pm2 restart community-outreach-system
   fi
   ```

4. **Long-term Solutions**
   ```bash
   # Configure memory limits in PM2
   pm2 delete community-outreach-system
   pm2 start ecosystem.config.js --max-memory-restart 2G
   
   # Enable swap if not already enabled (temporary solution)
   sudo swapon -s || sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
   ```

## Database Operations

### Database Backup

**Frequency**: Daily at 2 AM
**Retention**: 30 days local, 90 days cloud

**Manual Backup Procedure**:

1. **Create Backup**
   ```bash
   # Navigate to backup directory
   cd /home/cosystem/backups
   
   # Create timestamped backup
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_FILE="neo4j_backup_${DATE}.dump"
   
   # Stop database for consistent backup (optional for online backup)
   # sudo systemctl stop neo4j
   
   # Create backup
   neo4j-admin database dump --database=cosystem --to-path=./$BACKUP_FILE
   
   # Restart database if stopped
   # sudo systemctl start neo4j
   
   # Compress backup
   gzip $BACKUP_FILE
   ```

2. **Verify Backup**
   ```bash
   # Check backup file size and integrity
   ls -lh ${BACKUP_FILE}.gz
   gunzip -t ${BACKUP_FILE}.gz && echo "Backup integrity verified"
   ```

3. **Upload to Cloud Storage**
   ```bash
   # Upload to S3 (if configured)
   aws s3 cp ${BACKUP_FILE}.gz s3://$BACKUP_S3_BUCKET/database/${BACKUP_FILE}.gz
   
   # Verify upload
   aws s3 ls s3://$BACKUP_S3_BUCKET/database/${BACKUP_FILE}.gz
   ```

### Database Restore

**Use Case**: Disaster recovery, data corruption, rollback

**Procedure**:

1. **Prepare for Restore**
   ```bash
   # Stop application to prevent data changes
   pm2 stop community-outreach-system
   
   # Stop database
   sudo systemctl stop neo4j
   
   # Backup current database (if not corrupted)
   DATE=$(date +%Y%m%d_%H%M%S)
   cp -r /var/lib/neo4j/data/databases/cosystem /var/lib/neo4j/data/databases/cosystem_backup_$DATE
   ```

2. **Restore from Backup**
   ```bash
   # Download backup from cloud (if needed)
   aws s3 cp s3://$BACKUP_S3_BUCKET/database/neo4j_backup_YYYYMMDD_HHMMSS.dump.gz ./
   
   # Decompress backup
   gunzip neo4j_backup_YYYYMMDD_HHMMSS.dump.gz
   
   # Load backup into database
   neo4j-admin database load --from-path=./neo4j_backup_YYYYMMDD_HHMMSS.dump cosystem --overwrite-destination=true
   ```

3. **Verify Restore**
   ```bash
   # Start database
   sudo systemctl start neo4j
   
   # Wait for startup
   sleep 30
   
   # Verify data integrity
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "MATCH (n) RETURN count(n) as total_nodes;"
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "MATCH ()-[r]->() RETURN count(r) as total_relationships;"
   
   # Start application
   pm2 start community-outreach-system
   
   # Verify application functionality
   curl -f https://yourdomain.com/api/health
   ```

### Database Maintenance

**Frequency**: Weekly during maintenance window

**Procedure**:

1. **Update Statistics**
   ```bash
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "CALL db.stats.retrieve('GRAPH COUNTS');"
   ```

2. **Check Index Usage**
   ```bash
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "SHOW INDEXES YIELD name, state, populationPercent, type;"
   ```

3. **Cleanup Temporary Data**
   ```bash
   # Remove old conversation logs (older than 60 days)
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "
   MATCH (c:ConversationLog) 
   WHERE c.timestamp < datetime() - duration('P60D') 
   DETACH DELETE c;"
   ```

4. **Optimize Database**
   ```bash
   # Compact database (if needed)
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "CALL db.checkpoint();"
   ```

## Security Incidents

### Suspected Breach

**Trigger**: Unusual access patterns, failed authentication attempts
**Severity**: Critical
**Response Time**: Immediate

**Immediate Actions**:

1. **Isolate System**
   ```bash
   # Block all external traffic (emergency only)
   sudo ufw deny in
   
   # Or block specific IPs
   sudo ufw deny from SUSPICIOUS_IP
   ```

2. **Assess Damage**
   ```bash
   # Check authentication logs
   sudo grep -i "failed\|invalid\|authentication" /var/log/auth.log | tail -50
   
   # Check application access logs
   pm2 logs community-outreach-system | grep -E "(401|403|500)" | tail -50
   
   # Check for unauthorized database access
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "CALL dbms.listConnections();"
   ```

3. **Preserve Evidence**
   ```bash
   # Create forensic backup
   DATE=$(date +%Y%m%d_%H%M%S)
   sudo cp -r /var/log /home/cosystem/forensic_logs_$DATE
   pm2 logs community-outreach-system > /home/cosystem/app_logs_$DATE.log
   ```

4. **Change Credentials**
   ```bash
   # Change database password
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "ALTER CURRENT USER SET PASSWORD FROM '$NEO4J_PASSWORD' TO '$NEW_PASSWORD';"
   
   # Rotate JWT secret (requires application restart)
   # Update .env.production with new JWT_SECRET
   pm2 restart community-outreach-system
   
   # Rotate API keys
   # Update OpenAI API key and other external service keys
   ```

### SSL Certificate Expiration

**Trigger**: Certificate expires in < 30 days
**Severity**: Medium
**Response Time**: 24 hours

**Procedure**:

1. **Check Certificate Status**
   ```bash
   # Check current certificate
   sudo certbot certificates
   
   # Check expiration date
   openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout | grep "Not After"
   ```

2. **Renew Certificate**
   ```bash
   # Renew certificate
   sudo certbot renew --force-renewal
   
   # Verify renewal
   sudo certbot certificates
   ```

3. **Update Web Server**
   ```bash
   # Test Nginx configuration
   sudo nginx -t
   
   # Reload Nginx to use new certificate
   sudo systemctl reload nginx
   
   # Verify SSL is working
   openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null
   ```

## Maintenance Procedures

### Planned Maintenance Window

**Frequency**: Monthly, first Sunday 2-4 AM
**Duration**: 2 hours maximum

**Pre-Maintenance Checklist**:

- [ ] Notify users 48 hours in advance
- [ ] Create full system backup
- [ ] Prepare rollback plan
- [ ] Test procedures in staging environment

**Maintenance Procedure**:

1. **System Backup**
   ```bash
   # Create full backup before maintenance
   /home/cosystem/backup-database.sh
   /home/cosystem/backup-application.sh
   ```

2. **Update System Packages**
   ```bash
   # Update system packages
   sudo apt-get update
   sudo apt-get upgrade -y
   
   # Update Node.js if needed
   # (Follow Node.js upgrade procedure)
   ```

3. **Update Application Dependencies**
   ```bash
   # Navigate to application directory
   cd /home/cosystem/community-outreach-system
   
   # Update dependencies
   npm audit fix
   npm update
   
   # Rebuild application
   npm run build
   
   # Restart application
   pm2 restart community-outreach-system
   ```

4. **Database Maintenance**
   ```bash
   # Run database maintenance tasks
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "CALL db.checkpoint();"
   
   # Update database statistics
   cypher-shell -u neo4j -p $NEO4J_PASSWORD "CALL db.stats.retrieve('GRAPH COUNTS');"
   ```

5. **Verify System Health**
   ```bash
   # Run comprehensive health check
   /home/cosystem/health-check.sh
   
   # Test all major functionality
   curl -f https://yourdomain.com/api/health
   curl -f https://yourdomain.com/api/system/health
   ```

**Post-Maintenance**:

- [ ] Verify all services are running
- [ ] Monitor system for 1 hour
- [ ] Update maintenance log
- [ ] Notify users of completion

### Emergency Maintenance

**Trigger**: Critical security patch, system instability
**Response Time**: As soon as possible

**Procedure**:

1. **Assess Urgency**
   ```bash
   # Check system status
   /home/cosystem/health-check.sh
   
   # Review security advisories
   # Check vendor notifications
   ```

2. **Create Emergency Backup**
   ```bash
   # Quick backup
   /home/cosystem/backup-database.sh
   ```

3. **Apply Fix**
   ```bash
   # Apply security patches
   sudo apt-get update
   sudo apt-get install --only-upgrade PACKAGE_NAME
   
   # Or apply application fix
   git pull origin main
   npm run build
   pm2 restart community-outreach-system
   ```

4. **Verify Fix**
   ```bash
   # Test system functionality
   /home/cosystem/health-check.sh
   
   # Monitor for issues
   pm2 logs community-outreach-system --lines 50
   ```

## Monitoring and Alerting

### Alert Response Matrix

| Alert Type | Severity | Response Time | Escalation |
|------------|----------|---------------|------------|
| Application Down | Critical | 5 minutes | Immediate |
| High Error Rate | High | 15 minutes | 30 minutes |
| Database Issues | High | 10 minutes | 30 minutes |
| High Response Time | Medium | 20 minutes | 1 hour |
| SSL Expiration | Medium | 24 hours | 48 hours |
| Disk Space Low | Low | 4 hours | 24 hours |

### Monitoring Checklist

**Daily**:
- [ ] Check system health dashboard
- [ ] Review error logs
- [ ] Verify backup completion
- [ ] Check SSL certificate status

**Weekly**:
- [ ] Review performance metrics
- [ ] Check security logs
- [ ] Verify monitoring alerts
- [ ] Test disaster recovery procedures

**Monthly**:
- [ ] Full system health review
- [ ] Update monitoring thresholds
- [ ] Review and update runbooks
- [ ] Conduct disaster recovery drill

### Contact Information

**Primary On-Call**: +1-XXX-XXX-XXXX
**Secondary On-Call**: +1-XXX-XXX-XXXX
**Development Team**: dev@yourdomain.com
**Infrastructure Team**: ops@yourdomain.com
**Management Escalation**: management@yourdomain.com

### Useful Commands Reference

```bash
# System Status
systemctl status neo4j nginx
pm2 status
df -h
free -h
uptime

# Logs
pm2 logs community-outreach-system --lines 100
sudo journalctl -u neo4j -f
sudo tail -f /var/log/nginx/error.log

# Network
sudo netstat -tlnp
ss -tulpn

# Process Management
pm2 restart community-outreach-system
pm2 reload community-outreach-system
pm2 stop community-outreach-system

# Database
cypher-shell -u neo4j -p $NEO4J_PASSWORD
neo4j-admin database dump --database=cosystem --to-path=backup.dump

# SSL
sudo certbot certificates
sudo certbot renew
openssl x509 -in /path/to/cert.pem -text -noout
```