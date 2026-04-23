import { Controller, Get, Post, Delete, Body, Param, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './urls.dto';

@ApiTags('urls')
@Controller()
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Post('urls')
  @ApiOperation({ summary: 'Create a short URL' })
  @ApiResponse({ status: 201, description: 'Short URL created' })
  create(@Body() dto: CreateUrlDto) {
    return this.urlsService.create(dto);
  }

  @Get('urls')
  @ApiOperation({ summary: 'List all URLs' })
  findAll() {
    return this.urlsService.findAll();
  }

  @Get('urls/:shortCode')
  @ApiOperation({ summary: 'Get URL details by short code' })
  findOne(@Param('shortCode') shortCode: string) {
    return this.urlsService.findOne(shortCode);
  }

  @Delete('urls/:shortCode')
  @ApiOperation({ summary: 'Deactivate a short URL' })
  delete(@Param('shortCode') shortCode: string) {
    return this.urlsService.delete(shortCode);
  }

  // The actual redirect endpoint — lives at root level e.g. /:code
  @Get(':shortCode')
  @ApiOperation({ summary: 'Redirect to original URL' })
  async redirect(
    @Param('shortCode') shortCode: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const originalUrl = await this.urlsService.resolve(shortCode, req);
    res.redirect(302, originalUrl);
  }
}
