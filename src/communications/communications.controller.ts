import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommunicationsService } from './communications.service';
import { FindRecipientsDto } from './dto/find-recipients.dto';

@ApiTags('Communications')
@Controller('communications')
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Get('recipients')
  @ApiOperation({ summary: 'Lista destinatários por role com filtros por departamento do coordenador e busca.' })
  findRecipients(
    @Query() query: FindRecipientsDto,
  ): Promise<{
    data: Array<{ id: string; name: string; email: string }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.communicationsService.findRecipients(query);
  }
}