import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('messages/overview')
  @ApiOperation({ summary: 'Retorna métricas gerais de mensagens e comunicados.' })
  getOverview(
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.analyticsService.getOverview(start, end);
  }

  @Get('messages/by-role')
  @ApiOperation({ summary: 'Retorna o total de mensagens enviadas por role do remetente.' })
  getMessagesByRole(
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.analyticsService.getMessagesByRole(start, end);
  }

  @Get('messages/over-time')
  @ApiOperation({ summary: 'Retorna a evolução das mensagens no tempo.' })
  getMessagesOverTime(
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('bucket') bucket: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.analyticsService.getMessagesOverTime(start, end, bucket);
  }
}


