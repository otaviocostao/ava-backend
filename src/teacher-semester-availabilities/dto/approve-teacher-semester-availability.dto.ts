import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class ApproveTeacherSemesterAvailabilityDto {
  @ApiProperty({ description: 'ID do coordenador que está aprovando' })
  @IsUUID('4', { message: 'coordinatorId deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'coordinatorId é obrigatório.' })
  coordinatorId: string;
}

