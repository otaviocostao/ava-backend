import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from 'src/messages/entities/message.entity';
import { Notice } from 'src/notice-board/entities/notice.entity';
import { User } from 'src/users/entities/user.entity';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private resolveDateRange(start?: string, end?: string): DateRange {
    const now = new Date();
    const endDate = end ? new Date(end) : now;
    const startDate = start ? new Date(start) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Parâmetros de data inválidos.');
    }

    if (startDate > endDate) {
      throw new BadRequestException('A data inicial deve ser anterior à final.');
    }

    return { startDate, endDate };
  }

  async getOverview(start?: string, end?: string) {
    const { startDate, endDate } = this.resolveDateRange(start, end);

    const [totalMessages, readMessages, totalNoticesActive, totalUsersActive] = await Promise.all([
      this.messageRepository.createQueryBuilder('m')
        .where('m.sentAt BETWEEN :start AND :end', { start: startDate.toISOString(), end: endDate.toISOString() })
        .getCount(),
      this.messageRepository.createQueryBuilder('m')
        .where('m.isRead = :read', { read: true })
        .andWhere('m.readAt IS NOT NULL')
        .andWhere('m.readAt BETWEEN :start AND :end', { start: startDate.toISOString(), end: endDate.toISOString() })
        .getCount(),
      this.noticeRepository.createQueryBuilder('n')
        .where('n.expiresAt IS NULL OR n.expiresAt > :now', { now: new Date().toISOString() })
        .getCount(),
      this.userRepository.count({ where: { isActive: true } }),
    ]);

    const engagementRate = totalMessages > 0 ? Number(((readMessages / totalMessages) * 100).toFixed(2)) : 0;

    return {
      totalMessages,
      totalNoticesActive,
      totalUsersActive,
      engagementRate,
    };
  }

  async getMessagesByRole(start?: string, end?: string) {
    const { startDate, endDate } = this.resolveDateRange(start, end);

    const rows = await this.messageRepository.query(
      `
      SELECT
        CASE
          WHEN EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = m.sender_id AND r.name = 'admin'
          ) THEN 'admin'
          WHEN EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = m.sender_id AND r.name = 'coordinator'
          ) THEN 'coordinator'
          WHEN EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = m.sender_id AND r.name = 'teacher'
          ) THEN 'teacher'
          ELSE 'student'
        END AS role,
        COUNT(*) AS count
      FROM messages m
      WHERE m.sent_at BETWEEN $1 AND $2
      GROUP BY 1
      ORDER BY 2 DESC
      `,
      [startDate.toISOString(), endDate.toISOString()],
    );

    return rows.map((row: { role: string; count: string }) => ({
      role: row.role,
      count: Number(row.count),
    }));
  }

  async getMessagesOverTime(start?: string, end?: string, bucket: 'day' | 'week' | 'month' = 'day') {
    const { startDate, endDate } = this.resolveDateRange(start, end);
    const validBuckets = ['day', 'week', 'month'];
    if (!validBuckets.includes(bucket)) {
      throw new BadRequestException('Bucket inválido. Use day, week ou month.');
    }

    const raw = await this.messageRepository.createQueryBuilder('m')
      .select(`date_trunc(:bucket, m.sentAt)`, 'bucket')
      .addSelect('COUNT(*)', 'total')
      .where('m.sentAt BETWEEN :start AND :end', { start: startDate.toISOString(), end: endDate.toISOString() })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC')
      .setParameter('bucket', bucket)
      .getRawMany();

    return raw.map((row: { bucket: Date; total: string }) => ({
      bucket: new Date(row.bucket).toISOString(),
      total: Number(row.total),
    }));
  }
}


