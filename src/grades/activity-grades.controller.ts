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
import { CreateActivityGradeDto } from './dto/create-activity-grade.dto';
import { GradesService } from './grades.service';

@Controller('activities')
export class ActivityGradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get(':activityId/grades')
  getGradebook(@Param('activityId', ParseUUIDPipe) activityId: string) {
    return this.gradesService.getActivityGradebook(activityId);
  }

  @Post(':activityId/grades')
  @HttpCode(HttpStatus.CREATED)
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

