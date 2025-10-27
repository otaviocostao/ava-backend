import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class SetCoordinatorDto {
  @ApiProperty({
    description: 'O ID do usuário a ser definido como coordenador.',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsOptional()
  coordinatorId: string | null;
}
