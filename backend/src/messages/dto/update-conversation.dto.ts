import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConversationDto {
  @ApiPropertyOptional({
    description: 'Nom de la conversation',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'URL de l\'image de la conversation',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
