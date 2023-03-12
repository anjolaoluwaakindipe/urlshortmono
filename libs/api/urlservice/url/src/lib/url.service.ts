import { Injectable } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common/exceptions';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Provider } from '@nestjs/common/interfaces/modules';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { ObjectID, Repository } from 'typeorm';

import { Url } from './url.entity';
import { UrlServiceInterface } from './url.interface';

@Injectable()
export class UrlServiceImpl implements UrlServiceInterface {
  constructor(
    @InjectRepository(Url) private readonly urlRepository: Repository<Url>,
  ) {}

  // GETS ORIGINAL WHEN GIVEN A SHORTENED URL
  async getOriginalUrlbyShortenedUrl(params: {
    shortenedUrl: string;
  }): Promise<string> {
    // find an exisiting url by the shortened url
    const existingUrl = await this.urlRepository.findOne({
      where: { shortenedUrl: params.shortenedUrl },
    });

    // if no url exisits throw a not found exception
    if (!existingUrl) throw new NotFoundException('Short Url not Found');

    // else return the original url string
    return existingUrl.originalUrl;
  }

  // CREATE A BRAND NEW URL OBJECT
  async createShortUrl(params: {
    userId: string;
    originalUrl?: string;
    shortenedUrl?: string;
  }): Promise<Url> {
    // check if there is already a shortened url that exists
    const existingUrl = await this.urlRepository.findOneBy({
      shortenedUrl: params.shortenedUrl,
    });
    // if URL exists send an error
    if (existingUrl) {
      throw new ConflictException('Shortened url already exists');
    }

    // if not create url
    return await this.urlRepository.save({ ...params });
  }

  // UPDATE A SHORT URL
  async updateShortUrl(params: {
    urlId: string;
    originalUrl?: string;
    shortenedUrl?: string;
  }): Promise<Url> {
    // check if url ID os a valid mongo id if it is 12 byte or a string of 24 hex characters or an integer
    if (!ObjectId.isValid(params.urlId)) {
      throw new BadRequestException('Invalid url id');
    }

    // check if there is already a shortened url that exists
    const existingUrl = await this.urlRepository.findOneBy({
      _id: ObjectId.createFromHexString(params.urlId) as unknown as ObjectID,
    });

    // If not send a bad request error
    if (!existingUrl) {
      throw new NotFoundException('Url Id does not exist');
    }

    // check if orignal url exists and is different from existingUrl
    if (params.originalUrl && params.originalUrl !== existingUrl.originalUrl) {
      // if so change existingUrl
      existingUrl.originalUrl = params.originalUrl;
    }

    // check if param shortenedUrl exists and is different from the existingUrl's shortenedUrl
    if (
      params.shortenedUrl &&
      existingUrl.shortenedUrl !== params.shortenedUrl
    ) {
      // check if there are other urls with the same shortenedUrl
      const existingUrlWithSameShortendUrl = await this.urlRepository.findOneBy(
        { shortenedUrl: params.shortenedUrl },
      );
      // if not change the existingUrl's shotenedUrl with the param's shortenedUrl
      if (!existingUrlWithSameShortendUrl) {
        existingUrl.shortenedUrl = params.shortenedUrl;
      } else {
        // if it exists send an error
        throw new ConflictException('Shortened Url already in use');
      }
    }
    // save existing url: this will update the url already in the database
    return this.urlRepository.save(existingUrl);
  }

  // GET ALL SHORT URL BY USER
  async getAllShortUrlByUserId(params: { userId: string }): Promise<Url[]> {
    return await this.urlRepository.findBy({ userId: params.userId });
  }
  async getUrlShortById(params: { urlId: string }): Promise<Url> {
    // check if url ID is a valid mongo id if it is 12 byte or a string of 24 hex characters or an integer
    if (!ObjectId.isValid(params.urlId)) {
      throw new BadRequestException('Invalid url id');
    }

    // check if there are any existing urls
    const existingUrl = await this.urlRepository.findOneBy({
      _id: ObjectId.createFromHexString(params.urlId) as unknown as ObjectID,
    });

    // if url does not exist send an error;
    if (!existingUrl) throw new NotFoundException('Url Id not found');

    // else return the url info
    return existingUrl;
  }

  // DELETE A URL BY ID
  async deleteShortUrlById(params: { urlId: string; userId: string }) {
    // check if url ID is a valid mongo id if it is 12 byte or a string of 24 hex characters or an integer
    if (!ObjectId.isValid(params.urlId)) {
      throw new BadRequestException('Invalid url id');
    }

    const existingUrl = await this.urlRepository.findOneBy({
      _id: ObjectId.createFromHexString(params.urlId) as unknown as ObjectID,
      userId: params.userId,
    });
    if (!existingUrl) {
      throw new NotFoundException('Url not found, cannot delete');
    }

    await this.urlRepository.delete(existingUrl);
  }

  // DELETES ALL URLS BELONGING TO A SPECIFIC USER
  async deleteAllShortUrlByUserId(params: { userId: string }): Promise<void> {
    await this.urlRepository.delete({ userId: params.userId });
  }

  // CHECK IF A SHORTENED URL ALREADY EXISTS
  async isShortenedUrlAvailable(params: {
    shortenedUrl: string;
  }): Promise<boolean> {
    const existingUrl = await this.urlRepository.findOneBy({
      shortenedUrl: params.shortenedUrl,
    });

    if (!existingUrl) return true;

    return false;
  }
}

export const UrlServiceImplProvider: Provider = {
  provide: UrlServiceInterface,
  useClass: UrlServiceImpl,
};
