import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AcademicPeriodsService } from './academic-periods.service';
import { CreateAcademicPeriodDto } from './dto/create-academic-period.dto';
import { UpdateAcademicPeriodDto } from './dto/update-academic-period.dto';

@ApiTags('Academic Periods')
@Controller('academic-periods')
export class AcademicPeriodsController {
  constructor(private readonly academicPeriodsService: AcademicPeriodsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria um novo período letivo.' })
  create(@Body() createAcademicPeriodDto: CreateAcademicPeriodDto) {
    return this.academicPeriodsService.create(createAcademicPeriodDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os períodos letivos.' })
  findAll() {
    return this.academicPeriodsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um período letivo por ID.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicPeriodsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um período letivo.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateAcademicPeriodDto: UpdateAcademicPeriodDto) {
    return this.academicPeriodsService.update(id, updateAcademicPeriodDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um período letivo.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicPeriodsService.remove(id);
  }
}

