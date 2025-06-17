# 🚀 PRODUCTION SETUP GUIDE

## 📋 CHECKLIST BEFORE DEPLOYMENT

### ✅ **STEP 1: Environment Configuration**

1. **Copy environment file:**

   ```bash
   cp env.example .env
   ```

2. **Configure critical variables in `.env`:**

#### **🔗 Database Settings (CRITICAL)**

```env
DB_HOST=your-postgresql-server
DB_PORT=5432
DB_NAME=your-database
DB_USER=your-username
DB_PASSWORD=your-secure-password

# Connection Pool (for 10K requests support)
DB_POOL_MAX=150
DB_POOL_MIN=20
```

#### **⚡ Redis Cache (HIGHLY RECOMMENDED)**

```env
REDIS_URL=redis://your-redis-server:6379
REDIS_PASSWORD=your-redis-password
```

#### **🛡️ Security (REQUIRED)**

```env
JWT_SECRET=your-256-bit-secret-key-change-this-immediately
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### **🚀 Cluster Mode (for 32 cores)**

```env
CLUSTER_MODE=true
CLUSTER_WORKERS=32
```

### ✅ **STEP 2: Install Dependencies**

```bash
npm install
```

### ✅ **STEP 3: Database Setup**

1. **Create PostgreSQL database**
2. **Configure connection pool limits on DB server**
3. **Set up indexes for performance**

### ✅ **STEP 4: Redis Setup (Optional but Recommended)**

```bash
# Install Redis on Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# Configure Redis for production
sudo nano /etc/redis/redis.conf

# Key settings:
# maxmemory 8gb
# maxmemory-policy allkeys-lru
# save 900 1
```

### ✅ **STEP 5: Server Optimization**

#### **System Limits (for high connections)**

```bash
# Edit /etc/security/limits.conf
* soft nofile 65535
* hard nofile 65535

# Edit /etc/sysctl.conf
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
fs.file-max = 2097152
```

#### **Node.js Optimization**

```bash
# Increase heap size for Node.js
export NODE_OPTIONS="--max-old-space-size=8192"
```

### ✅ **STEP 6: Start Application**

#### **Production Mode (Recommended)**

```bash
npm run start:prod
```

#### **Single Process Mode**

```bash
npm run start:single
```

## 📊 **PERFORMANCE MONITORING**

### **Health Check Endpoint**

```
GET /api/health
```

**Response includes:**

- System uptime
- Memory usage
- Database connection status
- Cache statistics
- Active workers

### **Expected Performance Metrics**

| Metric         | Target Value    |
| -------------- | --------------- |
| Response Time  | < 200ms         |
| Throughput     | 15,000+ req/min |
| Memory Usage   | < 50GB          |
| CPU Usage      | < 80%           |
| DB Connections | < 150           |

## 🔧 **LOAD TESTING**

### **Test 10,000 Concurrent Requests**

```bash
# Using Artillery.js
npm install -g artillery

# Create test file: load-test.yml
artillery quick --count 100 --num 100 http://your-server/api/health
```

### **Test Configuration:**

```yaml
# load-test.yml
config:
  target: "http://your-server"
  phases:
    - duration: 300
      arrivalRate: 100
      name: "Ramp up"
    - duration: 600
      arrivalRate: 200
      name: "Sustained load"
scenarios:
  - name: "API Load Test"
    flow:
      - get:
          url: "/api/health"
      - get:
          url: "/api/game/available"
      - post:
          url: "/api/auth/login"
          json:
            username: "testuser"
            password: "testpass"
```

## 🚨 **TROUBLESHOOTING**

### **High Memory Usage**

```bash
# Check Node.js processes
ps aux | grep node

# Monitor memory per worker
htop -p $(pgrep -f "node.*index.js")
```

### **Database Connection Issues**

```bash
# Check PostgreSQL connections
SELECT count(*) FROM pg_stat_activity;

# Check connection pool status
# Available in /api/health endpoint
```

### **Redis Issues**

```bash
# Check Redis status
redis-cli ping

# Monitor Redis memory
redis-cli info memory
```

## 📈 **SCALING OPTIONS**

### **Vertical Scaling (Current Setup)**

- ✅ Optimized for 32 cores / 64GB RAM
- ✅ Connection pooling configured
- ✅ Multi-process clustering

### **Horizontal Scaling (Next Level)**

1. **Load Balancer (Nginx/HAProxy)**
2. **Multiple App Servers**
3. **Database Read Replicas**
4. **Redis Cluster**

### **Infrastructure Recommendations**

#### **For 5,000 Concurrent Users:**

```
├── Load Balancer (Nginx)
├── App Server 1 (32 cores, 64GB) - Primary
├── App Server 2 (32 cores, 64GB) - Secondary
├── PostgreSQL Primary (16 cores, 32GB)
├── PostgreSQL Read Replica (8 cores, 16GB)
└── Redis Cluster (8GB each, 3 nodes)
```

## 🔐 **SECURITY CHECKLIST**

- ✅ Strong JWT secret (256-bit)
- ✅ Rate limiting enabled
- ✅ Helmet security headers
- ✅ CORS configured properly
- ✅ Environment variables secured
- ✅ Database credentials encrypted
- ✅ Regular security updates

## 📞 **SUPPORT**

If you encounter issues:

1. **Check logs:** `pm2 logs` or `docker logs`
2. **Monitor health:** `curl http://localhost:3000/api/health`
3. **Database status:** Check connection pool in health endpoint
4. **System resources:** `htop`, `free -h`, `df -h`

**Remember: With proper configuration, your server can handle 5,000+ concurrent users!** 🎉
