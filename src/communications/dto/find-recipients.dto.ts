import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum RecipientRoleFilter {
  TEACHER = 'teacher',
  STUDENT = 'student',
  COORDINATOR = 'coordinator',
}

export class FindRecipientsDto {
  @IsEnum(RecipientRoleFilter, {
    message: 'role deve ser teacher, student ou coordinator',
  })
  role: RecipientRoleFilter;

  @IsUUID('4', { message: 'coordinatorId deve ser UUID válido' })
  @IsOptional()
  coordinatorId?: string;

  @IsUUID('4', { message: 'teacherId deve ser UUID válido' })
  @IsOptional()
  teacherId?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}


