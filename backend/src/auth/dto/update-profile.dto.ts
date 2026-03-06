import { IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @ValidateIf((o) => o.avatarUrl !== '')
  @IsUrl()
  avatarUrl?: string;
}
