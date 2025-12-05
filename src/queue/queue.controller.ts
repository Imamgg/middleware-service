import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('api/queue')
export class QueueController {
  constructor(private queueService: QueueService) {}

  @Get('stats')
  async getAllStats() {
    return this.queueService.getAllQueuesStats();
  }

  @Get('stats/:queue')
  async getQueueStats(@Param('queue') queue: string) {
    return this.queueService.getQueueStats(queue);
  }

  @Get('health')
  async checkHealth() {
    const healthy = await this.queueService.isHealthy();
    return { healthy, status: healthy ? 'OK' : 'ERROR' };
  }

  @Post('publish')
  async publish(@Body() body: { queue: string; message: any }) {
    const sent = await this.queueService.publish(body.queue, body.message);
    return { success: sent, queue: body.queue };
  }

  @Delete('purge/:queue')
  async purgeQueue(@Param('queue') queue: string) {
    return this.queueService.purgeQueue(queue);
  }
}
