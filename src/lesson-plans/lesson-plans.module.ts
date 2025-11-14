import { Module } from '@nestjs/common';
import { LessonPlansService } from './lesson-plans.service';
import { LessonPlansController } from './lesson-plans.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonPlan } from './entities/lesson-plan.entity';
import { Class } from 'src/classes/entities/class.entity';
import { Schedule } from 'src/schedules/entities/schedule.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([LessonPlan, Class, Schedule]),
    ],
  controllers: [LessonPlansController],
  providers: [LessonPlansService],
})
export class LessonPlansModule {}
