import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreateExamQuestionDto } from './dto/create-exam-question.dto';
import { UpdateExamQuestionDto } from './dto/update-exam-question.dto';
import { StartExamAttemptDto } from './dto/start-exam-attempt.dto';
import { SaveExamAnswerDto } from './dto/save-exam-answer.dto';
import { SubmitExamAttemptDto } from './dto/submit-exam-attempt.dto';
import { GradeExamAnswerDto } from './dto/grade-exam-answer.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Req } from '@nestjs/common';

@Controller('exams')
@ApiTags('Exams - Provas Virtuais')
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(
    private readonly examsService: ExamsService,
  ) {}

  // ========== CRUD DE PROVAS ==========

  @Post()
  @ApiOperation({ summary: 'Cria uma nova prova virtual vinculada a uma atividade.' })
  create(@Body() createExamDto: CreateExamDto) {
    return this.examsService.create(createExamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as provas virtuais cadastradas.' })
  findAll() {
    return this.examsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Recupera os detalhes de uma prova virtual específica.' })
  @ApiParam({ name: 'id', description: 'ID da prova' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente uma prova virtual existente.' })
  @ApiParam({ name: 'id', description: 'ID da prova' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateExamDto: UpdateExamDto) {
    return this.examsService.update(id, updateExamDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma prova virtual do sistema.' })
  @ApiParam({ name: 'id', description: 'ID da prova' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.remove(id);
  }

  // ========== CRUD DE QUESTÕES ==========

  @Post(':examId/questions')
  @ApiOperation({ summary: 'Cria uma nova questão para uma prova.' })
  @ApiParam({ name: 'examId', description: 'ID da prova' })
  createQuestion(
    @Param('examId', ParseUUIDPipe) examId: string,
    @Body() createQuestionDto: CreateExamQuestionDto,
  ) {
    return this.examsService.createQuestion({ ...createQuestionDto, examId });
  }

  @Get(':examId/questions')
  @ApiOperation({ summary: 'Lista todas as questões de uma prova.' })
  @ApiParam({ name: 'examId', description: 'ID da prova' })
  findAllQuestions(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.examsService.findAllQuestions(examId);
  }

  @Get('questions/:id')
  @ApiOperation({ summary: 'Recupera os detalhes de uma questão específica.' })
  @ApiParam({ name: 'id', description: 'ID da questão' })
  findOneQuestion(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.findOneQuestion(id);
  }

  @Patch('questions/:id')
  @ApiOperation({ summary: 'Atualiza parcialmente uma questão existente.' })
  @ApiParam({ name: 'id', description: 'ID da questão' })
  updateQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateQuestionDto: UpdateExamQuestionDto,
  ) {
    return this.examsService.updateQuestion(id, updateQuestionDto);
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: 'Remove uma questão do sistema.' })
  @ApiParam({ name: 'id', description: 'ID da questão' })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeQuestion(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.removeQuestion(id);
  }

  // ========== TENTATIVAS DE PROVA ==========

  @Post(':examId/start')
  @ApiOperation({ summary: 'Inicia uma tentativa de prova para o aluno autenticado.' })
  @ApiParam({ name: 'examId', description: 'ID da prova' })
  startAttempt(@Param('examId', ParseUUIDPipe) examId: string, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('Usuário não autenticado');
    }
    return this.examsService.startAttempt(examId, userId);
  }

  @Post('attempts/:attemptId/answers')
  @ApiOperation({ summary: 'Salva uma resposta durante a realização da prova.' })
  @ApiParam({ name: 'attemptId', description: 'ID da tentativa' })
  saveAnswer(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Body() saveAnswerDto: SaveExamAnswerDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('Usuário não autenticado');
    }
    return this.examsService.saveAnswer(attemptId, saveAnswerDto, userId);
  }

  @Post('attempts/submit')
  @ApiOperation({ summary: 'Submete uma tentativa de prova finalizada.' })
  @HttpCode(HttpStatus.OK)
  submitAttempt(@Body() submitDto: SubmitExamAttemptDto, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('Usuário não autenticado');
    }
    return this.examsService.submitAttempt(submitDto, userId);
  }

  @Get('attempts/:id')
  @ApiOperation({ summary: 'Recupera os detalhes de uma tentativa específica.' })
  @ApiParam({ name: 'id', description: 'ID da tentativa' })
  findAttemptById(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.findAttemptById(id);
  }

  @Get(':examId/attempts')
  @ApiOperation({ summary: 'Lista todas as tentativas de uma prova (para professores).' })
  @ApiParam({ name: 'examId', description: 'ID da prova' })
  findAttemptsByExam(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.examsService.findAttemptsByExam(examId);
  }

  @Get('students/:studentId/attempts')
  @ApiOperation({ summary: 'Lista todas as tentativas de um aluno.' })
  @ApiParam({ name: 'studentId', description: 'ID do aluno' })
  findAttemptsByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.examsService.findAttemptsByStudent(studentId);
  }

  // ========== CORREÇÃO MANUAL ==========

  @Post('answers/grade')
  @ApiOperation({ summary: 'Corrige manualmente uma questão dissertativa.' })
  @HttpCode(HttpStatus.OK)
  gradeAnswer(@Body() gradeAnswerDto: GradeExamAnswerDto, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('Usuário não autenticado');
    }
    return this.examsService.gradeAnswer(gradeAnswerDto, userId);
  }
}

