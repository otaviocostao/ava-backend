import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { ActivitySubmission } from './entities/activity-submission.entity';
import { Class } from 'src/classes/entities/class.entity';
import { User } from 'src/users/entities/user.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { StorageModule } from '../storage/storage.module';
import { Grade } from 'src/grades/entities/grade.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, ActivitySubmission, Class, User, Enrollment, Grade]),
    StorageModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
