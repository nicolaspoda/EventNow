import { IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @ValidateIf((o) => o.avatarUrl !== '')
  @IsUrl()
  avatarUrl?: string;
}
