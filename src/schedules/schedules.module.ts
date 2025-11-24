import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { Schedule } from './entities/schedule.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from 'src/classes/entities/class.entity';
import { LessonPlan } from 'src/lesson-plans/entities/lesson-plan.entity';
import { LessonPlansModule } from 'src/lesson-plans/lesson-plans.module';
import { AcademicPeriodsModule } from 'src/academic-periods/academic-periods.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule, Class, LessonPlan]),
    LessonPlansModule,
    AcademicPeriodsModule,
  ],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
