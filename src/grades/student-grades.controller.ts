import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GradesService } from './grades.service';

@ApiTags('Student Grades')
@Controller('students')
export class StudentGradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get(':studentId/grades')
  @ApiOperation({ summary: 'Consolida o boletim de um estudante.' })
  getStudentGradebook(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.gradesService.getStudentGradebook(studentId);
  }
}
