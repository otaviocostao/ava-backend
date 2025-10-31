import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { NoticeAudience } from 'src/common/enums/notice-audience.enum';

export class FindNoticesQueryDto {
  @IsOptional()
  @IsEnum(NoticeAudience, {
    message: `O publico deve ser um dos seguintes valores: ${Object.values(NoticeAudience).join(', ')}`,
  })
  audience?: NoticeAudience;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return false;
  })
  @IsBoolean({ message: 'O campo includeExpired deve ser booleano.' })
  includeExpired?: boolean;
}
