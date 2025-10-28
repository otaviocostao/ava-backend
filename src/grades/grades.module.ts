import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../activities/entities/activity.entity';
import { Class } from '../classes/entities/class.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';
import { ActivityGradesController } from './activity-grades.controller';
import { ClassGradebookController } from './class-gradebook.controller';
import { Grade } from './entities/grade.entity';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';
import { StudentGradesController } from './student-grades.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, Enrollment, Activity, Class, User])],
  controllers: [GradesController, ActivityGradesController, StudentGradesController, ClassGradebookController],
  providers: [GradesService],
})
export class GradesModule {}
