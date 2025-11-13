import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from './entities/notice.entity';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { NoticeAudience } from 'src/common/enums/notice-audience.enum';
import { FindNoticesQueryDto } from './dto/find-notices.dto';
import { Class } from 'src/classes/entities/class.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';

@Injectable()
export class NoticeBoardService {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  private parseOptionalDate(input?: string): Date | null {
    if (!input) {
      return null;
    }

    const parsed = new Date(input);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Data de expiracao invalida.');
    }

    return parsed;
  }

  async create(createNoticeDto: CreateNoticeDto): Promise<Notice> {
    const notice = this.noticeRepository.create({
      title: createNoticeDto.title,
      content: createNoticeDto.content,
      audience: createNoticeDto.audience,
      expiresAt: this.parseOptionalDate(createNoticeDto.expiresAt),
    });

    if (createNoticeDto.classId) {
      // Validar existencia da turma
      const classInstance = await this.classRepository.findOne({ where: { id: createNoticeDto.classId } });
      if (!classInstance) {
        throw new NotFoundException(`Turma com ID "${createNoticeDto.classId}" nao encontrada.`);
      }
      notice.class = classInstance;
    } else {
      notice.class = null;
    }

    return this.noticeRepository.save(notice);
  }

  async findAll(query: FindNoticesQueryDto): Promise<Notice[]> {
    const qb = this.noticeRepository
      .createQueryBuilder('notice')
      .orderBy('notice.createdAt', 'DESC');

    if (query.audience) {
      qb.andWhere('notice.audience = :audience', { audience: query.audience });
    }

    if (!query.includeExpired) {
      qb.andWhere('(notice.expiresAt IS NULL OR notice.expiresAt >= :now)', {
        now: new Date().toISOString(),
      });
    }

    return qb.getMany();
  }

  async findForAudience(audience: NoticeAudience): Promise<Notice[]> {
    const audiences =
      audience === NoticeAudience.ALL
        ? [NoticeAudience.ALL]
        : [NoticeAudience.ALL, audience];

    return this.noticeRepository
      .createQueryBuilder('notice')
      .where('notice.audience IN (:...audiences)', { audiences })
      .andWhere('(notice.expiresAt IS NULL OR notice.expiresAt >= :now)', {
        now: new Date().toISOString(),
      })
      .orderBy('notice.createdAt', 'DESC')
      .getMany();
  }

  async findByClassId(classId: string): Promise<Notice[]> {
    return this.noticeRepository
      .createQueryBuilder('notice')
      .leftJoin('notice.class', 'class')
      .where('class.id = :classId', { classId })
      .andWhere('(notice.expiresAt IS NULL OR notice.expiresAt >= :now)', {
        now: new Date().toISOString(),
      })
      .orderBy('notice.createdAt', 'DESC')
      .getMany();
  }

  async findByStudentId(studentId: string): Promise<Notice[]> {
    const enrollments = await this.enrollmentRepository.find({
      where: { student: { id: studentId } },
      relations: ['class'],
    });
    const classIds = enrollments
      .map((e) => e.class?.id)
      .filter((id): id is string => Boolean(id));

    if (classIds.length === 0) {
      return this.noticeRepository
        .createQueryBuilder('notice')
        .where('(notice.expiresAt IS NULL OR notice.expiresAt >= :now)', {
          now: new Date().toISOString(),
        })
        .andWhere('notice.class_id IS NULL')
        .andWhere('notice.audience IN (:...audiences)', { audiences: ['all', 'student'] })
        .orderBy('notice.createdAt', 'DESC')
        .getMany();
    }

    return this.noticeRepository
      .createQueryBuilder('notice')
      .leftJoin('notice.class', 'class')
      .where('(class.id IN (:...classIds) OR notice.class_id IS NULL)', { classIds })
      .andWhere('notice.audience IN (:...audiences)', { audiences: ['all', 'student'] })
      .andWhere('(notice.expiresAt IS NULL OR notice.expiresAt >= :now)', {
        now: new Date().toISOString(),
      })
      .orderBy('notice.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Notice> {
    const notice = await this.noticeRepository.findOne({ where: { id } });

    if (!notice) {
      throw new NotFoundException(`Aviso com ID "${id}" nao encontrado.`);
    }

    return notice;
  }

  async update(id: string, updateNoticeDto: UpdateNoticeDto): Promise<Notice> {
    const notice = await this.findOne(id);

    if (updateNoticeDto.expiresAt !== undefined) {
      notice.expiresAt = this.parseOptionalDate(updateNoticeDto.expiresAt);
    }

    if (updateNoticeDto.title !== undefined) {
      notice.title = updateNoticeDto.title;
    }

    if (updateNoticeDto.content !== undefined) {
      notice.content = updateNoticeDto.content;
    }

    if (updateNoticeDto.audience !== undefined) {
      notice.audience = updateNoticeDto.audience;
    }

    return this.noticeRepository.save(notice);
  }

  async remove(id: string): Promise<void> {
    const result = await this.noticeRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Aviso com ID "${id}" nao encontrado.`);
    }
  }
}
