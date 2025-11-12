import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { Attendance } from 'src/attendances/entities/attendance.entity';
import { Grade } from 'src/grades/entities/grade.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Enrollment, Attendance, Grade]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
