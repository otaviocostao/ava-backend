import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateActivityGradeDto } from './dto/create-activity-grade.dto';
import { GradesService } from './grades.service';

@ApiTags('Activity Grades')
@Controller('activities')
export class ActivityGradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get(':activityId/grades')
  @ApiOperation({ summary: 'Consulta o boletim completo de uma atividade específica.' })
  getGradebook(@Param('activityId', ParseUUIDPipe) activityId: string) {
    return this.gradesService.getActivityGradebook(activityId);
  }

  @Post(':activityId/grades')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Lança uma nota diretamente no contexto de uma atividade.' })
  createGradeForActivity(
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Body() createGradeDto: CreateActivityGradeDto,
  ) {
    return this.gradesService.create({
      ...createGradeDto,
      activityId,
    });
  }
}
