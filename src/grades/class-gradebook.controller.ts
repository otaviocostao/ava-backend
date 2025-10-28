import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GradesService } from './grades.service';

@ApiTags('Class Gradebook')
@Controller('classes')
export class ClassGradebookController {
  constructor(private readonly gradesService: GradesService) {}

  @Get(':classId/gradebook')
  @ApiOperation({ summary: 'Consolida o boletim de uma turma.' })
  getClassGradebook(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.gradesService.getClassGradebook(classId);
  }
}
