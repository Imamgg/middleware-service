import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: +this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to,
        subject,
        html,
      });
      console.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendGradeNotification(data: {
    studentNim: string;
    courseName: string;
    letterGrade: string;
    finalScore: number;
  }): Promise<boolean> {
    const html = `
      <h2>Notifikasi Nilai</h2>
      <p>Halo Mahasiswa dengan NIM <strong>${data.studentNim}</strong>,</p>
      <p>Nilai Anda untuk mata kuliah <strong>${data.courseName}</strong> telah difinalisasi:</p>
      <ul>
        <li>Nilai Akhir: <strong>${data.finalScore}</strong></li>
        <li>Nilai Huruf: <strong>${data.letterGrade}</strong></li>
      </ul>
      <p>Terima kasih.</p>
      <p><em>SIAKAD System</em></p>
    `;

    // In production, get student email from database
    const studentEmail = `${data.studentNim}@student.ac.id`;
    
    return this.sendEmail(
      studentEmail,
      `Nilai ${data.courseName} Telah Tersedia`,
      html,
    );
  }

  async sendReportGenerated(data: {
    studentNim: string;
    reportType: string;
  }): Promise<boolean> {
    const html = `
      <h2>Report Generated</h2>
      <p>Halo Mahasiswa dengan NIM <strong>${data.studentNim}</strong>,</p>
      <p>Report <strong>${data.reportType}</strong> Anda telah selesai dibuat.</p>
      <p>Silakan cek sistem SIAKAD untuk mengunduh report.</p>
      <p><em>SIAKAD System</em></p>
    `;

    const studentEmail = `${data.studentNim}@student.ac.id`;
    
    return this.sendEmail(
      studentEmail,
      `Report ${data.reportType} Tersedia`,
      html,
    );
  }
}
