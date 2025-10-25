import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradesService } from './grades.service';

class FindGradesQueryDto {
  @IsUUID()
  @IsOptional()
  enrollmentId?: string;

  @IsUUID()
  @IsOptional()
  activityId?: string;
}

@ApiTags('Grades')
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Lança uma nota para uma matrícula em determinada atividade.' })
  create(@Body() createGradeDto: CreateGradeDto) {
    return this.gradesService.create(createGradeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista notas, filtrando por matrícula ou atividade.' })
  findAll(@Query() query: FindGradesQueryDto) {
    return this.gradesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Recupera uma nota específica pelo ID.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.gradesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza o valor ou associação de uma nota.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGradeDto: UpdateGradeDto,
  ) {
    return this.gradesService.update(id, updateGradeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma nota lançada.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.gradesService.remove(id);
  }
}
