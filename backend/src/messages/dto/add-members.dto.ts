import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMembersDto {
  @ApiProperty({
    description: 'IDs des membres à ajouter',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds: string[];
}
