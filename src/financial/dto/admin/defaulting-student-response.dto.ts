import { ApiProperty } from '@nestjs/swagger';
import { InstallmentResponseDto } from '../student/installment-response.dto';

export class DefaultingStudentResponseDto {
  @ApiProperty({ description: 'ID do registro' })
  id: string;

  @ApiProperty({ description: 'ID do aluno' })
  studentId: string;

  @ApiProperty({ description: 'Nome do aluno' })
  name: string;

  @ApiProperty({ description: 'Email do aluno' })
  email: string;

  @ApiProperty({ description: 'Telefone do aluno', nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'ID da turma', nullable: true })
  classId: string | null;

  @ApiProperty({ description: 'Nome da turma', nullable: true })
  className: string | null;

  @ApiProperty({ description: 'Total devido' })
  totalDue: number;

  @ApiProperty({ description: 'Meses em atraso' })
  monthsOverdue: number;

  @ApiProperty({ description: 'Data do último contato (ISO date)', nullable: true })
  lastContactDate: string | null;

  @ApiProperty({ type: [InstallmentResponseDto], description: 'Parcelas em atraso' })
  installments: InstallmentResponseDto[];
}

