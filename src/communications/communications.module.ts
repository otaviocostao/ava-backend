import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Department } from 'src/departments/entities/department.entity';
import { Course } from 'src/courses/entities/course.entity';
import { StudentCourse } from 'src/student-courses/entities/student-course.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Department, Course, StudentCourse]),
  ],
  controllers: [CommunicationsController],
  providers: [CommunicationsService],
})
export class CommunicationsModule {}


