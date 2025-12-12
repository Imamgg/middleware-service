import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
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
      this.connection = await amqp.connect(
        this.configService.get("RABBITMQ_URL")
      );

      this.connection.on("error", (err) => {
        console.error("RabbitMQ Connection Error:", err);
        this.isConnected = false;
      });

      this.connection.on("close", () => {
        console.log("RabbitMQ Connection Closed");
        this.isConnected = false;
      });

      this.channel = await this.connection.createChannel();
      this.isConnected = true;

      // Declare queues
      await this.declareQueues();

      console.log("RabbitMQ connected successfully");
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      console.log("RabbitMQ disconnected");
    } catch (error) {
      console.error("Error disconnecting from RabbitMQ:", error);
    }
  }

  private async declareQueues() {
    const queues = [
      "grade_notifications",
      "report_generation",
      "email_queue",
      "log_queue",
    ];

    for (const queue of queues) {
      await this.channel.assertQueue(queue, { durable: true });
      console.log(`Queue declared: ${queue}`);
    }
  }

  // Publish message to queue
  async publish(queue: string, message: any): Promise<boolean> {
    try {
      await this.channel.assertQueue(queue, { durable: true });
      const sent = this.channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
      console.log(`Message published to ${queue}:`, message);
      return sent;
    } catch (error) {
      console.error(`Error publishing to ${queue}:`, error);
      return false;
    }
  }

  // Consume messages from queue
  async consume(
    queue: string,
    callback: (message: any) => Promise<void>
  ): Promise<void> {
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.prefetch(1);

    console.log(`Waiting for messages in ${queue}..`);

    this.channel.consume(
      queue,
      async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            console.log(`Processing message from ${queue}:`, content);

            await callback(content);

            this.channel.ack(msg);
            console.log(`Message acknowledged from ${queue}`);
          } catch (error) {
            console.error(`Error processing message from ${queue}:`, error);
            // Reject and requeue the message
            this.channel.nack(msg, false, true);
          }
        }
      },
      { noAck: false }
    );
  }

  // Get queue stats
  async getQueueStats(queue: string): Promise<any> {
    try {
      const queueInfo = await this.channel.checkQueue(queue);
      return {
        queue,
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount,
      };
    } catch (error) {
      return { queue, error: error.message };
    }
  }

  // Get all queues stats
  async getAllQueuesStats(): Promise<any[]> {
    const queues = [
      "grade_notifications",
      "report_generation",
      "email_queue",
      "log_queue",
    ];

    const stats = [];
    for (const queue of queues) {
      stats.push(await this.getQueueStats(queue));
    }

    return stats;
  }

  // Purge queue
  async purgeQueue(queue: string): Promise<any> {
    try {
      const result = await this.channel.purgeQueue(queue);
      return { queue, purged: result.messageCount };
    } catch (error) {
      return { queue, error: error.message };
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    return this.isConnected;
  }
}
