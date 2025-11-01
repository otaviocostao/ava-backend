import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Endpoint de verificação de saúde que retorna uma mensagem estática.' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('llm.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @ApiOperation({ summary: 'Retorna documentação da API em formato texto simples para LLMs.' })
  getLlmTxt(): string {
    return this.appService.generateLlmTxt();
  }
}
