import { PartialType } from '@nestjs/swagger';
import { CreateTeacherSemesterAvailabilityDto } from './create-teacher-semester-availability.dto';

export class UpdateTeacherSemesterAvailabilityDto extends PartialType(CreateTeacherSemesterAvailabilityDto) {}


