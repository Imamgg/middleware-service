import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      this.client = createClient({
        socket: {
          host: this.configService.get('REDIS_HOST'),
          port: +this.configService.get('REDIS_PORT'),
        },
        password: this.configService.get('REDIS_PASSWORD') || undefined,
        database: +this.configService.get('REDIS_DB') || 0,
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  private async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log('Redis disconnected');
    }
  }

  // Cache Operations
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, value, { EX: ttl });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  // Lock Operations
  async acquireLock(key: string, ttl: number = 10000): Promise<boolean> {
    const result = await this.client.set(`lock:${key}`, '1', {
      NX: true,
      PX: ttl,
    });
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.client.del(`lock:${key}`);
  }

  // Hash Operations
  async hSet(key: string, field: string, value: string): Promise<void> {
    await this.client.hSet(key, field, value);
  }

  async hGet(key: string, field: string): Promise<string | undefined> {
    return this.client.hGet(key, field);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return this.client.hGetAll(key);
  }

  async hDel(key: string, field: string): Promise<void> {
    await this.client.hDel(key, field);
  }

  // List Operations
  async lPush(key: string, ...values: string[]): Promise<void> {
    await this.client.lPush(key, values);
  }

  async rPush(key: string, ...values: string[]): Promise<void> {
    await this.client.rPush(key, values);
  }

  async lPop(key: string): Promise<string | null> {
    return this.client.lPop(key);
  }

  async rPop(key: string): Promise<string | null> {
    return this.client.rPop(key);
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lRange(key, start, stop);
  }

  // Set Operations
  async sAdd(key: string, ...members: string[]): Promise<void> {
    await this.client.sAdd(key, members);
  }

  async sMembers(key: string): Promise<string[]> {
    return this.client.sMembers(key);
  }

  async sRem(key: string, ...members: string[]): Promise<void> {
    await this.client.sRem(key, members);
  }

  // TTL Operations
  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  // Stats
  async getStats(): Promise<any> {
    const info = await this.client.info();
    const dbSize = await this.client.dbSize();
    
    return {
      connected: this.isConnected,
      dbSize,
      info: this.parseRedisInfo(info),
    };
  }

  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const parsed: any = {};
    let section = '';

    for (const line of lines) {
      if (line.startsWith('#')) {
        section = line.substring(2).toLowerCase();
        parsed[section] = {};
      } else if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (section) {
          parsed[section][key] = value;
        }
      }
    }

    return parsed;
  }

  // Health Check
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
}
