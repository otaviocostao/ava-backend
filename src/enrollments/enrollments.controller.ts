import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { IsOptional, IsUUID } from 'class-validator';

class FindEnrollmentsQueryDto {
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsUUID()
  @IsOptional()
  classId?: string;
}

@ApiTags('Enrollments')
@Controller('enrollments') 
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria a matrícula de um aluno em uma turma.' })
  create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista matrículas filtrando por aluno ou turma.' })
  findAll(@Query() query: FindEnrollmentsQueryDto) {
    return this.enrollmentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca detalhes de uma matrícula específica.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.enrollmentsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) 
  @ApiOperation({ summary: 'Remove uma matrícula existente.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.enrollmentsService.remove(id);
  }
}
