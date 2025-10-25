import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../activities/entities/activity.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { ActivityGradesController } from './activity-grades.controller';
import { Grade } from './entities/grade.entity';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, Enrollment, Activity])],
  controllers: [GradesController, ActivityGradesController],
  providers: [GradesService],
})
export class GradesModule {}
