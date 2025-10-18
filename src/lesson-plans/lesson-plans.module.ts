import { Module } from '@nestjs/common';
import { LessonPlansService } from './lesson-plans.service';
import { LessonPlansController } from './lesson-plans.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonPlan } from './entities/lesson-plan.entity';
import { Class } from 'src/classes/entities/class.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([LessonPlan, Class]),
    ],
  controllers: [LessonPlansController],
  providers: [LessonPlansService],
})
export class LessonPlansModule {}
