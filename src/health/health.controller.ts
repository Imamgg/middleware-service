import { Controller, Get } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { QueueService } from '../queue/queue.service';

@Controller('api/health')
export class HealthController {
  constructor(
    private redisService: RedisService,
    private queueService: QueueService,
  ) {}

  @Get()
  async checkHealth() {
    const redisHealthy = await this.redisService.isHealthy();
    const queueHealthy = await this.queueService.isHealthy();

    const overall = redisHealthy && queueHealthy;

    return {
      status: overall ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: {
          status: redisHealthy ? 'up' : 'down',
        },
        rabbitmq: {
          status: queueHealthy ? 'up' : 'down',
        },
      },
    };
  }

  @Get('redis')
  async checkRedis() {
    const healthy = await this.redisService.isHealthy();
    const stats = healthy ? await this.redisService.getStats() : null;

    return {
      status: healthy ? 'up' : 'down',
      stats,
    };
  }

  @Get('queue')
  async checkQueue() {
    const healthy = await this.queueService.isHealthy();
    const stats = healthy ? await this.queueService.getAllQueuesStats() : null;

    return {
      status: healthy ? 'up' : 'down',
      queues: stats,
    };
  }
}
