import { Url } from './url.entity';

// URL SERVICE INTERFACE
export const UrlServiceInterface = 'UrlServiceInterface';

export interface UrlServiceInterface {
  createShortUrl(params: createUrlShortParams): Promise<Url>;

  updateShortUrl(params: updateUrlShortParams): Promise<Url>;

  getAllShortUrlByUserId(params: getAllShortUrlByUserIdParams): Promise<Url[]>;

  getOriginalUrlbyShortenedUrl(
    params: getShortUrlByShortenedUrl
  ): Promise<string>;

  getUrlShortById(params: getUrlShortByIdParams): Promise<Url>;

  deleteShortUrlById(params: deleteShortUrlByIdParams): Promise<void>;

  deleteAllShortUrlByUserId(
    params: deleteAllShortUrlByUserIdParams
  ): Promise<void>;

  isShortenedUrlAvailable(
    params: isShortenedUrlAvailableParams
  ): Promise<boolean>;
}

// URL SERVICE INTERFACE PARAMETERS
type createUrlShortParams = {
  userId: string;
  originalUrl: string;
  shortenedUrl: string;
};

type updateUrlShortParams = {
  urlId: string;
  originalUrl?: string;
  shortenedUrl?: string;
};

type getAllShortUrlByUserIdParams = {
  userId: string;
};

type getShortUrlByShortenedUrl = {
  shortenedUrl: string;
};

type getUrlShortByIdParams = {
  urlId: string;
};

type deleteShortUrlByIdParams = {
  urlId: string;
  userId: string;
};

type isShortenedUrlAvailableParams = {
  shortenedUrl: string;
};

type deleteAllShortUrlByUserIdParams = {
  userId: string;
};
