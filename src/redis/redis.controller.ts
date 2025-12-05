import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('api/redis')
export class RedisController {
  constructor(private redisService: RedisService) {}

  @Get('stats')
  async getStats() {
    return this.redisService.getStats();
  }

  @Get('health')
  async checkHealth() {
    const healthy = await this.redisService.isHealthy();
    return { healthy, status: healthy ? 'OK' : 'ERROR' };
  }

  @Get('keys')
  async getKeys(@Query('pattern') pattern: string = '*') {
    const keys = await this.redisService.keys(pattern);
    return { keys, count: keys.length };
  }

  @Get('cache/:key')
  async getCache(@Param('key') key: string) {
    const value = await this.redisService.get(key);
    const exists = await this.redisService.exists(key);
    const ttl = await this.redisService.ttl(key);
    
    return { key, value, exists, ttl };
  }

  @Post('cache')
  async setCache(
    @Body() body: { key: string; value: string; ttl?: number },
  ) {
    await this.redisService.set(body.key, body.value, body.ttl);
    return { success: true, key: body.key };
  }

  @Delete('cache/:key')
  async deleteCache(@Param('key') key: string) {
    await this.redisService.del(key);
    return { success: true, key };
  }

  @Post('lock/acquire')
  async acquireLock(@Body() body: { key: string; ttl?: number }) {
    const acquired = await this.redisService.acquireLock(body.key, body.ttl || 10000);
    return { acquired, key: body.key };
  }

  @Post('lock/release')
  async releaseLock(@Body() body: { key: string }) {
    await this.redisService.releaseLock(body.key);
    return { released: true, key: body.key };
  }
}
