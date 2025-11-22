import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/exam-question.entity';
import { ExamAttempt } from './entities/exam-attempt.entity';
import { ExamAnswer } from './entities/exam-answer.entity';
import { Activity } from '../activities/entities/activity.entity';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Class } from '../classes/entities/class.entity';
import { Grade } from '../grades/entities/grade.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Exam,
      ExamQuestion,
      ExamAttempt,
      ExamAnswer,
      Activity,
      User,
      Enrollment,
      Class,
      Grade,
    ]),
  ],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}

