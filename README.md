# Middleware Service

Service untuk mengelola Redis Cache, RabbitMQ Queue, dan Background Workers dalam Sistem SIAKAD Terdistribusi.

## Fitur

- ✅ **Redis Management** - Cache, Lock, Hash, List, Set operations
- ✅ **RabbitMQ Queue Management** - Publish, Consume, Stats
- ✅ **Background Workers** - Email notifications, Report generation
- ✅ **Health Check API** - Monitor Redis & RabbitMQ status
- ✅ **Email Service** - SMTP integration untuk notifikasi

## Konfigurasi

Port: **3004**  
IP VM: **192.168.10.15**

## Environment Variables

```env
PORT=3004

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=SIAKAD System <noreply@siakad.ac.id>

# Worker
WORKER_CONCURRENCY=5
```

## Install Dependencies

```bash
npm install
```

## Run Service

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Run Workers (Background Process)

Worker terpisah untuk memproses queue secara asynchronous:

```bash
# Development
ts-node src/workers/queue-worker.ts

# Production
npm run build
npm run worker
```

## API Endpoints

### Health Check

- `GET /api/health` - Overall health check
- `GET /api/health/redis` - Redis health & stats
- `GET /api/health/queue` - RabbitMQ health & queue stats

### Redis Management

- `GET /api/redis/stats` - Redis statistics
- `GET /api/redis/health` - Redis health check
- `GET /api/redis/keys?pattern=*` - Get keys by pattern
- `GET /api/redis/cache/:key` - Get cache value
- `POST /api/redis/cache` - Set cache value
  ```json
  {
    "key": "student:2024001",
    "value": "{\"name\":\"Ahmad\"}",
    "ttl": 3600
  }
  ```
- `DELETE /api/redis/cache/:key` - Delete cache
- `POST /api/redis/lock/acquire` - Acquire distributed lock
  ```json
  {
    "key": "enrollment:1",
    "ttl": 10000
  }
  ```
- `POST /api/redis/lock/release` - Release lock
  ```json
  {
    "key": "enrollment:1"
  }
  ```

### RabbitMQ Queue Management

- `GET /api/queue/stats` - All queues statistics
- `GET /api/queue/stats/:queue` - Specific queue stats
- `GET /api/queue/health` - RabbitMQ health check
- `POST /api/queue/publish` - Publish message to queue
  ```json
  {
    "queue": "grade_notifications",
    "message": {
      "studentNim": "2024001",
      "courseName": "Pemrograman Dasar",
      "letterGrade": "A",
      "finalScore": 87.5
    }
  }
  ```
- `DELETE /api/queue/purge/:queue` - Purge queue

## Available Queues

### 1. `grade_notifications`

Notifikasi nilai ke mahasiswa via email.

```json
{
  "studentNim": "2024001",
  "courseName": "Pemrograman Dasar",
  "letterGrade": "A",
  "finalScore": 87.5
}
```

### 2. `report_generation`

Generate transkrip atau report akademik.

```json
{
  "type": "transcript",
  "studentNim": "2024001",
  "timestamp": "2025-12-06T00:00:00Z"
}
```

### 3. `email_queue`

Queue untuk email custom.

```json
{
  "to": "student@example.com",
  "subject": "Test Email",
  "html": "<h1>Hello</h1>"
}
```

### 4. `log_queue`

Logging events.

```json
{
  "level": "info",
  "message": "User logged in",
  "timestamp": "2025-12-06T00:00:00Z"
}
```

## Request Examples

### Health Check

```bash
curl http://192.168.10.15:3004/api/health
```

### Set Cache

```bash
curl -X POST http://192.168.10.15:3004/api/redis/cache \
  -H "Content-Type: application/json" \
  -d '{
    "key": "student:2024001",
    "value": "{\"name\":\"Ahmad Fauzi\",\"major\":\"Informatika\"}",
    "ttl": 3600
  }'
```

### Get Cache

```bash
curl http://192.168.10.15:3004/api/redis/cache/student:2024001
```

### Acquire Lock

```bash
curl -X POST http://192.168.10.15:3004/api/redis/lock/acquire \
  -H "Content-Type: application/json" \
  -d '{
    "key": "enrollment:course:1",
    "ttl": 5000
  }'
```

### Publish to Queue

```bash
curl -X POST http://192.168.10.15:3004/api/queue/publish \
  -H "Content-Type: application/json" \
  -d '{
    "queue": "grade_notifications",
    "message": {
      "studentNim": "2024001",
      "courseName": "Pemrograman Dasar",
      "letterGrade": "A",
      "finalScore": 87.5
    }
  }'
```

### Queue Stats

```bash
curl http://192.168.10.15:3004/api/queue/stats
```

## Setup Redis di VM5

### Install Redis

```bash
sudo apt update
sudo apt install redis-server -y
```

### Konfigurasi Redis

Edit `/etc/redis/redis.conf`:

```conf
bind 0.0.0.0
protected-mode no
port 6379
```

### Start Redis

```bash
sudo systemctl start redis-server
sudo systemctl enable redis-server
sudo systemctl status redis-server
```

### Test Redis

```bash
redis-cli ping
# Response: PONG
```

## Setup RabbitMQ di VM5

### Install RabbitMQ

```bash
sudo apt update
sudo apt install rabbitmq-server -y
```

### Start RabbitMQ

```bash
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server
sudo systemctl status rabbitmq-server
```

### Enable Management Plugin

```bash
sudo rabbitmq-plugins enable rabbitmq_management
```

### Access Management UI

- URL: `http://192.168.10.15:15672`
- Username: `guest`
- Password: `guest`

### Create User (Optional)

```bash
sudo rabbitmqctl add_user siakad_user admin
sudo rabbitmqctl set_user_tags siakad_user administrator
sudo rabbitmqctl set_permissions -p / siakad_user ".*" ".*" ".*"
```

## Deployment ke VM5

1. **Install Redis & RabbitMQ** (lihat di atas)

2. **Deploy Middleware Service**

```bash
cd /opt
sudo mkdir middleware-service
sudo chown $USER:$USER middleware-service
# Copy files
npm install
npm run build
```

3. **Run Service**

```bash
npm run start:prod
```

4. **Run Worker (sebagai background process)**

```bash
# Install PM2
npm install -g pm2

# Start worker
pm2 start dist/workers/queue-worker.js --name middleware-worker

# Start main service
pm2 start dist/main.js --name middleware-service

# Save PM2 process
pm2 save
pm2 startup
```

## Monitoring

### Check Redis Stats

```bash
redis-cli info stats
redis-cli dbsize
redis-cli keys '*'
```

### Check RabbitMQ Stats

```bash
sudo rabbitmqctl list_queues name messages consumers
sudo rabbitmqctl list_connections
```

### PM2 Monitoring

```bash
pm2 status
pm2 logs middleware-worker
pm2 logs middleware-service
pm2 monit
```

## Architecture Flow

```
Course Service → Redis Lock → Middleware Service (Redis)
    ↓
Grades Service → RabbitMQ → Middleware Service (Queue)
    ↓
Middleware Worker → Email Service → SMTP
```

## Integration dengan Service Lain

### Course Service

```typescript
// Acquire lock sebelum enrollment
const lockAcquired = await redisService.acquireLock(`enrollment:${courseId}`);
```

### Grades Service

```typescript
// Publish notifikasi setelah finalize
await rabbitmqService.publishGradeNotification({
  studentNim: "2024001",
  courseName: "Pemrograman Dasar",
  letterGrade: "A",
  finalScore: 87.5,
});
```

## Troubleshooting

**Redis tidak bisa diakses dari service lain:**

```bash
# Edit /etc/redis/redis.conf
bind 0.0.0.0
protected-mode no

# Restart Redis
sudo systemctl restart redis-server
```

**RabbitMQ connection refused:**

```bash
# Check firewall
sudo ufw allow 5672
sudo ufw allow 15672

# Restart RabbitMQ
sudo systemctl restart rabbitmq-server
```

## License

Educational Project - Sistem Terdistribusi 2025/2026
