import { Module } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { AttendancesController } from './attendances.controller';
import { Attendance } from './entities/attendance.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([Attendance, Enrollment]),
    ],
  controllers: [AttendancesController],
  providers: [AttendancesService],
})
export class AttendancesModule {}
