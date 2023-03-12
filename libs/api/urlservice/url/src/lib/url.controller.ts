import { Body, Controller, Delete, Get, Headers, Inject, Param, Post, Put, UseGuards } from '@nestjs/common';
import { GenericAuthGaurd } from '@urlshortmono/api/shared';

import { CreateUrlDto, IsShortUrlAvailableDto, UpdateUrlDto } from './url.dto';
import { Url } from './url.entity';
import { UrlServiceInterface } from './url.interface';

@Controller('')
export class UrlController {
  constructor(
    @Inject(UrlServiceInterface)
    private readonly urlService: UrlServiceInterface,
  ) {}

  // Get: get all Urls owned by a user
  @UseGuards(GenericAuthGaurd)
  @Get('/user')
  async getAllUrlByUserId(@Headers('user_id') userId: string) {
    return await this.urlService.getAllShortUrlByUserId({ userId });
  }

  @Get('/view/:shortUrl')
  async redirectUserToOriginalUrl(@Param('shortUrl') shortUrl: string) {
    const originalUrl = await this.urlService.getOriginalUrlbyShortenedUrl({
      shortenedUrl: shortUrl,
    });

    return {
      url: originalUrl,
    };
  }

  // Get: test the auth gaurd
  @UseGuards(GenericAuthGaurd)
  @Get('/hello')
  async helloTest(
    @Headers('user_id') userId: string,
    @Headers('roles') roles: string[],
  ) {
    return {
      hello: 'hello',
      userId: userId,
      roles,
    };
  }

  // Get: get a specific short url by id
  @UseGuards(GenericAuthGaurd)
  @Get('/:id')
  async getUrlById(@Param('id') id: string) {
    return this.urlService.getUrlShortById({ urlId: id });
  }

  // Post: craate a new short url
  @UseGuards(GenericAuthGaurd)
  @Post('/')
  async createUrl(
    @Headers('user_id') userId: string,
    @Body() createUrlDto: CreateUrlDto,
  ): Promise<Url> {
    return await this.urlService.createShortUrl({
      originalUrl: createUrlDto.originalUrl,
      shortenedUrl: createUrlDto.shortenedUrl,
      userId: userId,
    });
  }

  // Put: Update a specific shortened url
  @UseGuards(GenericAuthGaurd)
  @Put('/:id')
  async updateUrl(
    @Param('id') id: string,
    @Body() updateUrlDto: UpdateUrlDto,
  ): Promise<Url> {
    return await this.urlService.updateShortUrl({
      urlId: id,
      originalUrl: updateUrlDto.originalUrl,
      shortenedUrl: updateUrlDto.shortenedUrl,
    });
  }

  @UseGuards(GenericAuthGaurd)
  @Delete('/user')
  async deleteAllUserShortenedUrl(@Headers('user_id') userId: string) {
    await this.urlService.deleteAllShortUrlByUserId({ userId: userId });
    return;
  }

  // Delete: Delete a specific shortened url by id
  @UseGuards(GenericAuthGaurd)
  @Delete('/:id')
  async deleteUrl(@Param('id') id: string, @Headers('user_id') userId: string) {
    await this.urlService.deleteShortUrlById({ urlId: id, userId: userId });
    return;
  }

  // Post: Checks if specific shortened url name is available
  @Post('/isAvailable')
  async isShortUrlAvailable(@Body() body: IsShortUrlAvailableDto) {
    return this.urlService.isShortenedUrlAvailable({
      shortenedUrl: body.shortenedUrl,
    });
  }
}
