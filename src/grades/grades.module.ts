import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Grade } from './entities/grade.entity';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, Enrollment])],
  controllers: [GradesController],
  providers: [GradesService],
})
export class GradesModule {}
