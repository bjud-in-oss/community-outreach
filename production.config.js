/**
 * Production Configuration for Community Outreach System
 * 
 * This file contains production-specific configuration settings
 * for deployment, monitoring, and operational requirements.
 */

const productionConfig = {
  // Application Configuration
  app: {
    name: 'Community Outreach System',
    version: process.env.APP_VERSION || '1.0.0',
    environment: 'production',
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0'
  },

  // Database Configuration
  database: {
    neo4j: {
      uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
      username: process.env.NEO4J_USERNAME || 'neo4j',
      password: process.env.NEO4J_PASSWORD,
      database: process.env.NEO4J_DATABASE || 'neo4j',
      maxConnectionPoolSize: 50,
      connectionTimeout: 30000,
      maxTransactionRetryTime: 15000
    }
  },

  // Storage Configuration
  storage: {
    cloudProvider: process.env.CLOUD_PROVIDER || 'aws',
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      s3Bucket: process.env.AWS_S3_BUCKET,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    maxFileSize: '10MB',
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'video/mp4']
  },

  // LLM Configuration
  llm: {
    provider: process.env.LLM_PROVIDER || 'openai',
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      defaultModel: 'gpt-4',
      maxTokens: 4096,
      temperature: 0.7,
      timeout: 30000
    },
    rateLimits: {
      requestsPerMinute: 60,
      tokensPerMinute: 100000,
      requestsPerDay: 1000
    }
  },

  // Security Configuration
  security: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyDerivation: 'pbkdf2',
      iterations: 100000
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '24h',
      issuer: 'community-outreach-system',
      audience: 'cos-users'
    },
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP'
    }
  },

  // Monitoring Configuration
  monitoring: {
    healthCheck: {
      enabled: true,
      interval: 30000, // 30 seconds
      timeout: 5000,
      endpoints: ['/api/health', '/api/system/health']
    },
    metrics: {
      enabled: true,
      retention: '7d',
      aggregationInterval: '1m'
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: 'json',
      destination: process.env.LOG_DESTINATION || 'stdout',
      maxFileSize: '100MB',
      maxFiles: 10
    },
    alerts: {
      enabled: true,
      channels: {
        email: process.env.ALERT_EMAIL,
        slack: process.env.SLACK_WEBHOOK_URL,
        webhook: process.env.ALERT_WEBHOOK_URL
      },
      thresholds: {
        errorRate: 5, // percentage
        responseTime: 2000, // milliseconds
        memoryUsage: 80, // percentage
        diskUsage: 85 // percentage
      }
    }
  },

  // Resource Limits
  resources: {
    memory: {
      heapLimit: '2GB',
      warningThreshold: '1.5GB'
    },
    cpu: {
      maxUsage: 80, // percentage
      warningThreshold: 70
    },
    agents: {
      maxConcurrent: 100,
      maxRecursionDepth: 5,
      timeoutMs: 300000 // 5 minutes
    }
  },

  // Backup Configuration
  backup: {
    enabled: true,
    schedule: '0 2 * * *', // Daily at 2 AM
    retention: '30d',
    destinations: {
      s3: {
        bucket: process.env.BACKUP_S3_BUCKET,
        prefix: 'backups/community-outreach'
      }
    },
    encryption: true
  },

  // Feature Flags
  features: {
    autonomousMode: process.env.ENABLE_AUTONOMOUS_MODE === 'true',
    legacySystem: process.env.ENABLE_LEGACY_SYSTEM === 'true',
    empatibryggan: process.env.ENABLE_EMPATIBRYGGAN === 'true',
    minnenasBok: process.env.ENABLE_MINNENAS_BOK === 'true',
    architectView: process.env.ENABLE_ARCHITECT_VIEW === 'true'
  },

  // Performance Configuration
  performance: {
    caching: {
      enabled: true,
      ttl: 300, // 5 minutes
      maxSize: '100MB'
    },
    compression: {
      enabled: true,
      level: 6,
      threshold: 1024 // bytes
    },
    clustering: {
      enabled: process.env.ENABLE_CLUSTERING === 'true',
      workers: process.env.CLUSTER_WORKERS || 'auto'
    }
  }
};

module.exports = productionConfig;