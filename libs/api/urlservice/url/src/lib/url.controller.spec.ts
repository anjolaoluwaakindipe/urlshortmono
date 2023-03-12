import 'reflect-metadata';
import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common/exceptions';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Test, TestingModule } from '@nestjs/testing';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;
import { ObjectId } from 'mongodb';
import { DataSource } from 'typeorm';
import { AppConfig } from '@urlshortmono/api/shared';
import { MongoDbModule } from '@urlshortmono/api/shared';
import { GrpcModule } from '@urlshortmono/api/shared';
import { UrlController } from './url.controller';
import { Url } from './url.entity';
import { UrlModule } from './url.module';
import { join } from 'path';

describe('UrlController', () => {
  let controller: UrlController;
  let module: TestingModule;
  let urlDatasource: DataSource;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        UrlModule,
        AppConfig,
        MongoDbModule.forRoot({
          entities: [Url],
          url: process.env.URL_SERVICE_MONGO_URI || '',
        }),
        GrpcModule.forRoot({
          name: '',
          package: '',
          path: join(
            __dirname,
            '../../../../../data-access/grpc/src/lib/auth.proto'
          ),
          url: '',
        }),
      ],
    }).compile();

    controller = module.get<UrlController>(UrlController);
    urlDatasource = module.get<DataSource>(DataSource);
  });

  it('SHOULD be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('CREATING URL TESTS', () => {
    it('SHOULD create a url objec', async () => {
      const controllerBody = {
        originalUrl: 'https://www.google.com',
        shortenedUrl: 'metty',
      };
      const newUrlObject = await controller.createUrl('1', controllerBody);

      expect(newUrlObject).toBeTruthy();
      expect(newUrlObject).toMatchObject({ ...controllerBody, userId: '1' });
      expect(newUrlObject._id).toBeTruthy();
    });

    it('SHOULD give an ConflictException error WHEN shorteneed url already exists', async () => {
      await controller.createUrl('1', {
        originalUrl: 'http://wwww.google.com',
        shortenedUrl: 'hello',
      });

      const generateErrorFunc = async () => {
        await controller.createUrl('1', {
          originalUrl: 'http://www.google.com',
          shortenedUrl: 'hello',
        });
      };
      expect(generateErrorFunc()).rejects.toThrow(ConflictException);
    });

    afterAll(async () => {
      await urlDatasource.getMongoRepository<Url>(Url).clear();
    });
  });

  // GET
  describe('GET URL TEST', () => {
    let createdUrl1: Url;
    beforeAll(async () => {
      createdUrl1 = await controller.createUrl('1', {
        originalUrl: 'https://yahoo.com',
        shortenedUrl: 'myyahoo',
      });
      await controller.createUrl('2', {
        originalUrl: 'https://gooogle.com',
        shortenedUrl: 'mygoogle',
      });
      await controller.createUrl('1', {
        originalUrl: 'https://uber.com',
        shortenedUrl: 'myuber',
      });
    }, 100000);

    it('SHOULD get array of urls WHEN given a correct userId', async () => {
      const user1Urls = await controller.getAllUrlByUserId('1');
      expect(user1Urls).toBeInstanceOf(Array);
      expect(user1Urls).toHaveLength(2);
    });

    it('SHOULD get a specifc url WHEN given a correct id', async () => {
      const existingUrl1 = await controller.getUrlById(
        createdUrl1._id.toString()
      );
      expect(existingUrl1._id.toString()).toBe(createdUrl1._id.toString());
    });

    it('SHOULD throw a badrequest error WHEN an invalid urlId is given', async () => {
      const urlCheck = async () => {
        await controller.getUrlById('1');
      };

      expect(urlCheck()).rejects.toThrowError(BadRequestException);
    });

    afterAll(async () => {
      await urlDatasource.getMongoRepository<Url>(Url).clear();
    });
  });

  // DELETE SPECIFIC URL
  describe('DELETE URL TEST', () => {
    let createdUrl1: Url;
    let createdUrl2: Url;
    beforeAll(async () => {
      createdUrl1 = await controller.createUrl('1', {
        originalUrl: 'http://google.com',
        shortenedUrl: 'mygoogle',
      });
      createdUrl2 = await controller.createUrl('1', {
        originalUrl: 'http://google.com',
        shortenedUrl: 'mygoogle2',
      });
    });

    it('SHOULD delete a url2 WHEN given a valid existing id and a userId', async () => {
      await controller.deleteUrl(
        createdUrl1._id.toString(),
        createdUrl1.userId
      );

      const existingUrlCheck = async () => {
        await controller.getUrlById(createdUrl1._id.toString());
      };
      await expect(existingUrlCheck).rejects.toThrow(NotFoundException);
    });

    it('SHOULD delete a url2 WHEN given a valid existing id and a userId', async () => {
      await controller.deleteUrl(
        createdUrl2._id.toString(),
        createdUrl2.userId
      );
      const existingUrlCheck = async () => {
        await controller.getUrlById(createdUrl2._id.toString());
      };
      await expect(existingUrlCheck).rejects.toThrow(NotFoundException);
    });

    it('SHOULD throw an NotFoundException error WHEN valid url id does not exist', async () => {
      const existingUrlCheck = async () => {
        await controller.deleteUrl(
          createdUrl1._id.toString(),
          createdUrl1.userId
        );
      };
      await expect(existingUrlCheck).rejects.toThrow(NotFoundException);
    });

    it('SHOULD throw a BadRequestException error WHEN an invalid url id is given', async () => {
      const existingUrlCheck = async () => {
        await controller.deleteUrl('1', createdUrl1.userId);
      };
      await expect(existingUrlCheck).rejects.toThrowError(BadRequestException);
    });

    afterAll(async () => {
      await urlDatasource.getMongoRepository<Url>(Url).clear();
    });
  });

  // DELETE ALL SHORTENED URL BY ID
  describe('DELETE MULTIPLE SHORTENED URLS', () => {
    beforeAll(async () => {
      await controller.createUrl('1', {
        originalUrl: 'http://google.com',
        shortenedUrl: 'mygoogle',
      });
      await controller.createUrl('1', {
        originalUrl: 'http://google.com',
        shortenedUrl: 'mygoogle2',
      });
      await controller.createUrl('2', {
        originalUrl: 'http://google.com',
        shortenedUrl: 'mygoogle3',
      });
    });

    it('SHOULD delete multiple shortened url WHEN given a user id', async () => {
      await controller.deleteAllUserShortenedUrl('1');
      const existingUrlsForUser1 = await controller.getAllUrlByUserId('1');
      const existingUrlsForUser2 = await controller.getAllUrlByUserId('2');
      expect(existingUrlsForUser1).toHaveLength(0);
      expect(existingUrlsForUser2).toHaveLength(1);
    });

    afterAll(async () => {
      await urlDatasource.getMongoRepository<Url>(Url).clear();
    });
  });

  // AVAILABILITY CHECK
  describe('CHECK URL AVAILABILITY CHECK', () => {
    beforeAll(async () => {
      await controller.createUrl('1', {
        originalUrl: 'http://google.com',
        shortenedUrl: 'mygoogle',
      });
    }, 100000);

    it('SHOULD give true if shortened Url is available', async () => {
      const isAvailable = await controller.isShortUrlAvailable({
        shortenedUrl: 'hello',
      });
      expect(isAvailable).toBe(true);
    });

    it('SHOULD give false if shortened Url is not available', async () => {
      const isAvailable = await controller.isShortUrlAvailable({
        shortenedUrl: 'mygoogle',
      });
      expect(isAvailable).toBe(false);
    });

    afterAll(async () => {
      await urlDatasource.getMongoRepository<Url>(Url).clear();
    });
  });

  // GET ORIGINAL URL
  describe('GET ORIGINAL URL FROM SHORTENED URL', () => {
    beforeAll(async () => {
      await controller.createUrl('1', {
        originalUrl: 'https://www.google.com',
        shortenedUrl: 'hello1',
      });
    });

    it('SHOULD return an object containing an original url and status WHEN a shortenedUrl is given', async () => {
      const originalUrlResponse = await controller.redirectUserToOriginalUrl(
        'hello1'
      );

      expect(originalUrlResponse).toBeDefined();
      expect(originalUrlResponse).toHaveProperty(
        'url',
        'https://www.google.com'
      );
    });

    it('SHOULD throw a NotFoundException WHEN a shortened url passed to it is not found in the database', async () => {
      expect(async () => {
        await controller.redirectUserToOriginalUrl('hello2');
      }).rejects.toThrowError(NotFoundException);
    });

    afterAll(async () => {
      await urlDatasource.getMongoRepository<Url>(Url).clear();
    });
  });

  // UPDATE
  describe('UPDATE EXISTING URL Entity', () => {
    let createdUrl1: Url;

    beforeAll(async () => {
      createdUrl1 = await controller.createUrl('1', {
        originalUrl: 'https://wwww.google.com',
        shortenedUrl: 'mygoogle',
      });
      await controller.createUrl('2', {
        originalUrl: 'https://wwww.yahhoo.com',
        shortenedUrl: 'myyahoo',
      });
      await controller.createUrl('1', {
        originalUrl: 'https://wwww.yahhoo.com',
        shortenedUrl: 'mygoogle2',
      });
    });

    it('SHOULD return a url WHEN update does not contain an existing shortenedUrl', async () => {
      const updatedUrl = await controller.updateUrl(
        createdUrl1._id.toString(),
        {
          originalUrl: 'https://wwww.yahoo.com',
          shortenedUrl: 'newUrl',
        }
      );

      expect(updatedUrl).toBeInstanceOf(Url);
      expect(updatedUrl).toMatchObject({
        originalUrl: 'https://wwww.yahoo.com',
        shortenedUrl: 'newUrl',
      });
    });

    it('SHOULD throw a conflict exception WHEN update contains an already existing shorteneUrl owned by the same user', async () => {
      const updateCheck = async () => {
        await controller.updateUrl(createdUrl1._id.toString(), {
          originalUrl: 'https://wwww.yahoo.com',
          shortenedUrl: 'mygoogle2',
        });
      };
      expect(updateCheck()).rejects.toThrowError(ConflictException);
    });

    it('SHOULD throw a conflict exception WHEN update contains an already existing shorteneUrl owned by a different user', async () => {
      const updateCheck = async () => {
        await controller.updateUrl(createdUrl1._id.toString(), {
          originalUrl: 'https://wwww.yahoo.com',
          shortenedUrl: 'myyahoo',
        });
      };
      expect(updateCheck()).rejects.toThrowError(ConflictException);
    });

    it('SHOULD throw a NotFoundException exception WHEN update contains an non existing urlid', async () => {
      const updateCheck = async () => {
        await controller.updateUrl(new ObjectId().toString(), {
          originalUrl: 'https://wwww.yahoo.com',
          shortenedUrl: 'myyahoo',
        });
      };
      expect(updateCheck()).rejects.toThrowError(NotFoundException);
    });
    it('SHOULD throw a badrequest exception WHEN update contains an invalid url id', async () => {
      const updateCheck = async () => {
        await controller.updateUrl('1', {
          originalUrl: 'https://wwww.yahoo.com',
          shortenedUrl: 'myyahoo',
        });
      };
      expect(updateCheck()).rejects.toThrowError(BadRequestException);
    });

    afterAll(async () => {
      await urlDatasource.getMongoRepository<Url>(Url).clear();
    });
  });

  afterEach(async () => {
    // await urlDatasource.getMongoRepository<Url>(Url).clear();
  });

  afterAll(async () => {
    // await urlDatasource.destroy();
    await module.close();
  });
});
