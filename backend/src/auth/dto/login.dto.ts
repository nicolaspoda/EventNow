import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  /** Email ou nom d'utilisateur */
  @IsString()
  @IsNotEmpty({ message: "Email ou nom d'utilisateur requis" })
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
