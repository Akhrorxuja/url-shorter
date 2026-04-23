import { IsUrl, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUrlDto {
  @ApiProperty({ example: 'https://www.google.com/search?q=nestjs' })
  @IsUrl({}, { message: 'Must be a valid URL' })
  originalUrl: string;

  @ApiProperty({ example: 'google-search', required: false })
  @IsOptional()
  @IsString()
  customCode?: string;

  @ApiProperty({ example: 'Google Search', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: '2025-12-31T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
