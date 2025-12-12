import { ConfigService } from "@nestjs/config";
import { QueueService } from "./queue/queue.service";
import { EmailService } from "./email/email.service";

async function bootstrap() {
  const configService = new ConfigService();
  const queueService = new QueueService(configService);
  const emailService = new EmailService(configService);

  await queueService.onModuleInit();

  console.log("Queue Worker Started");
  console.log("Listening for messages..");

  // Worker for grade notifications
  await queueService.consume("grade_notifications", async (message) => {
    console.log("Processing grade notification:", message);
    await emailService.sendGradeNotification(message);
    console.log("Grade notification email sent");
  });

  // Worker for report generation
  await queueService.consume("report_generation", async (message) => {
    console.log("Processing report generation:", message);

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await emailService.sendReportGenerated({
      studentNim: message.studentNim,
      reportType: message.type,
    });

    console.log("Report generated and email sent");
  });

  // Worker for email queue
  await queueService.consume("email_queue", async (message) => {
    console.log("Processing email:", message);
    await emailService.sendEmail(message.to, message.subject, message.html);
    console.log("Email sent");
  });

  // Worker for log queue
  await queueService.consume("log_queue", async (message) => {
    console.log("LOG:", message);
    // Save to file or external logging service
  });

  process.on("SIGINT", async () => {
    console.log("Shutting down worker..");
    await queueService.onModuleDestroy();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error("Worker failed to start:", error);
  process.exit(1);
});
