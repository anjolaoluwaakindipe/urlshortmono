import { IsAlphanumeric, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateUrlDto {
  @IsUrl(
    { protocols: ['https', 'http'], require_protocol: true },
    {
      message:
        'Original Url must be a valid url address starting with https:// or http://',
    }
  )
  @IsNotEmpty()
  originalUrl: string;

  @IsNotEmpty()
  @IsAlphanumeric()
  shortenedUrl: string;
}

export class UpdateUrlDto {
  @IsUrl(
    { protocols: ['https', 'http'], require_protocol: true },
    {
      message:
        'Original Url must be a valid url address starting with https:// or http://',
    }
  )
  @IsNotEmpty()
  originalUrl: string;

  @IsNotEmpty()
  @IsAlphanumeric()
  shortenedUrl: string;
}

export class IsShortUrlAvailableDto {
  @IsAlphanumeric()
  @IsNotEmpty()
  shortenedUrl: string;
}
