import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class VotePollDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  optionIds: string[];
}
