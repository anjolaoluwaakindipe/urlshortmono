import { Global, INestApplication, Injectable, Module, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Observable, of } from 'rxjs';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AppConfig } from '@urlshortmono/api/shared';
import { MongoDbModule } from '@urlshortmono/api/shared';
import { Url, UrlModule } from '@urlshortmono/api/urlservice/url';

// grpc mock
@Injectable()
class GrpcClientMock {
  public getService<T = any>(name: string): any {
    switch (name) {
      case 'AuthService':
        return {
          isValid(data: {
            userId: string;
            roles: string[];
          }): Observable<{ isValid: boolean }> {
            const users = [
              {
                userId: '1',
                roles: ['admin', 'user'],
              },
              {
                userId: '2',
                roles: ['admin', 'user'],
              },
            ];

            if (!data.userId || !data.roles.length || data.roles.length === 0) {
              return of({ isValid: false });
            }
            const user = users.find((user) => user.userId === data.userId);
            if (user) {
              return of({
                isValid: data.roles.every((role) => user.roles.includes(role)),
              });
            }

            return of({ isValid: false });
          },
        };
      default:
        return of({ isValid: false });
    }
  }
}

const GrpcMockProvider = {
  provide: 'AUTH_PACKAGE',
  useClass: GrpcClientMock,
};

@Global()
@Module({
  providers: [GrpcMockProvider],
  exports: [GrpcMockProvider],
})
class GrpcMockModule {}

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  console.log(process.env.URL_SERVICE_MONGO_URI)
  beforeAll(async () => {
    const AllAppModules = [UrlModule];
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        GrpcMockModule,
        AppConfig,
        MongoDbModule.forRoot({
          entities: [Url],
          url: process.env.URL_SERVICE_MONGO_URI,
        }),
        ...AllAppModules,
      ],
    }).compile();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  describe('/ (POST)', () => {
    it('SHOULD PASS REQUEST (create a new url) WHEN request body is valid', async () => {
      await request(app.getHttpServer())
        .post('/')
        .send({ originalUrl: 'https://www.google.com', shortenedUrl: 'hello1' })
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .set('roles', 'user,admin')
        .expect(201);
    });

    it('SHOULD FAIL REQUEST (does not creat new url) WHEN request body contains an invalid original url (not a valid url)', async () => {
      await request(app.getHttpServer())
        .post('/')
        .send({ originalUrl: 'google', shortenedUrl: 'hello1' })
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .set('roles', 'user,admin')
        .expect(400);
    });

    it('SHOULD FAIL REQUEST (does not creat new url) WHEN request body contains an invalid shortened url (shortened url is not a valid alpha-numeric value (A-Z,a-z,0-9))', async () => {
      await request(app.getHttpServer())
        .post('/')
        .send({
          originalUrl: 'https://www.google.com',
          shortenedUrl: 'hello1&',
        })
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .set('roles', 'user,admin')
        .expect(400);
    });

    it('SHOULD FAIL REQUEST (does not creat new url) WHEN request header does not contain either user_id or roles (user_id and roles are not part of the request)', async () => {
      await request(app.getHttpServer())
        .post('/')
        .send({ originalUrl: 'https://www.google.com', shortenedUrl: 'hello1' })
        .set('Content-Type', 'application/json')
        .expect(401);
      await request(app.getHttpServer())
        .post('/')
        .send({
          originalUrl: 'https://wwww.google.com',
          shortenedUrl: 'hello1',
        })
        .set('Content-Type', 'application/json')
        .set('roles', 'user,admin')
        .expect(401);
      await request(app.getHttpServer())
        .post('/')
        .send({ originalUrl: 'https://www.google.com', shortenedUrl: 'hello1' })
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .expect(401);
    });

    it('SHOULD FAIL REQUEST (does not creat new url) WHEN request header user_id contains an invalid id (user_id is not a valid user from auth server)', async () => {
      await request(app.getHttpServer())
        .post('/')
        .send({ originalUrl: 'https://www.google.com', shortenedUrl: 'hello1' })
        .set('Content-Type', 'application/json')
        .set('user_id', '29')
        .set('roles', 'user,admin')
        .expect(401);
    });

    it("SHOULD PASS REQUEST (creates new url) WHEN request has atleast one role that correspond to it's roles in the auth server", async () => {
      await request(app.getHttpServer())
        .post('/')
        .send({ originalUrl: 'https://www.google.com', shortenedUrl: 'hello1' })
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .set('roles', 'user')
        .expect(201);
      await request(app.getHttpServer())
        .post('/')
        .send({ originalUrl: 'https://www.google.com', shortenedUrl: 'hello2' })
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .set('roles', 'admin')
        .expect(201);
    });

    it('SHOULD FAIL REQUEST (does not creat new url) WHEN request header roles contain invalid or missing roles contains an invalid id (user_id is not a valid user from auth server)', async () => {
      await request(app.getHttpServer())
        .post('/')
        .send({ originalUrl: 'https://www.google.com', shortenedUrl: 'hello1' })
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .set('roles', 'user,super')
        .expect(401);
      await request(app.getHttpServer())
        .post('/')
        .send({ originalUrl: 'https://www.google.com', shortenedUrl: 'hello1' })
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .set('roles', '')
        .expect(401);
    });

    it('SHOULD FAIL REQUEST (does not creat new url) WHEN request body contains an an existing  shortenedUrl (user_id is already exisiting in the database)', async () => {
      await request(app.getHttpServer())
        .post('/')
        .send({ originalUrl: 'https://www.google.com', shortenedUrl: 'hello1' })
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .set('roles', 'user,admin')
        .expect(201);

      // THE SAME USER ID
      await request(app.getHttpServer())
        .post('/')
        .send({
          originalUrl: 'https://www.youtube.com',
          shortenedUrl: 'hello1',
        })
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .set('roles', 'user,admin')
        .expect(409);

      // DIFFERENT USER ID
      await request(app.getHttpServer())
        .post('/')
        .send({ originalUrl: 'https://www.yahoo.com', shortenedUrl: 'hello1' })
        .set('Content-Type', 'application/json')
        .set('user_id', '2')
        .set('roles', 'user,admin')
        .expect(409);
    });
  });

  describe('/:id (GET)', () => {
    let existingUrl: Url;
    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/')
        .send({ originalUrl: 'https://www.google.com', shortenedUrl: 'hello1' })
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .set('roles', 'user,admin')
        .expect(201)
        .then((response) => {
          existingUrl = response.body;
        });
    });

    it('SHOULD PASS REQUEST (gets specific short url by id) WHEN request path variable contains a valid and existing mongo ObjectId', async () => {
      await request(app.getHttpServer())
        .get('/' + existingUrl._id)
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .set('roles', 'user,admin')
        .expect(200)
        .then((response) => {
          expect(response.body).toMatchObject(existingUrl);
        });
    });

    it('SHOULD FAIL REQUEST (does not get specific shortened url by id) WHEN request path variable constains a valid but non existing ObjectId', async () => {
      await request(app.getHttpServer())
        .get('/' + '63449f29b2684c0ae8485fb1')
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .set('roles', 'user,admin')
        .expect(404);
    });

    it('SHOULD FAIL REQUEST (does not get specific shortened url by id) WHEN request path variable constains a invalid and non existing ObjectId', async () => {
      await request(app.getHttpServer())
        .get('/' + 'asfdjsfalskfjs')
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .set('roles', 'user,admin')
        .expect(400);
    });
  });

  describe('/user (GET)', () => {
    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/')
        .send({ originalUrl: 'https://www.google.com', shortenedUrl: 'hello1' })
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .set('roles', 'user,admin')
        .expect(201);
      await request(app.getHttpServer())
        .post('/')
        .send({ originalUrl: 'https://www.yahoo.com', shortenedUrl: 'hello2' })
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .set('roles', 'user,admin')
        .expect(201);
      await request(app.getHttpServer())
        .post('/')
        .send({ originalUrl: 'https://www.msn.com', shortenedUrl: 'hello3' })
        .set('Content-Type', 'application/json')
        .set('user_id', '2')
        .set('roles', 'user,admin')
        .expect(201);
    });

    it("SHOULD PASS REQUEST (get each user's respective shortened urls) WHEN request header has a valid user_id and roles", async () => {
      await request(app.getHttpServer())
        .get('/user')
        .set('user_id', '1')
        .set('roles', 'user,admin')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveLength(2);
          expect(response.body[0]).toHaveProperty('userId', '1');
          expect(response.body[1]).toHaveProperty('userId', '1');
        });

      await request(app.getHttpServer())
        .get('/user')
        .set('user_id', '2')
        .set('roles', 'user,admin')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveLength(1);
          expect(response.body[0]).toHaveProperty('userId', '2');
        });
    });
  });

  describe('/view/:shortenedUrl (GET)', () => {
    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/')
        .send({ originalUrl: 'https://www.google.com', shortenedUrl: 'hello1' })
        .set('Content-Type', 'application/json')
        .set('user_id', '1')
        .set('roles', 'user,admin')
        .expect(201);
    });
    it('SHOULD PASS REQUEST (redirect request to a another url) WHEN a valid shortened url is passed as a path variable', async () => {
      await request(app.getHttpServer())
        .get('/view/hello1')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('url', 'https://www.google.com');
        });
    });
    it('SHOULD FAIL REQUEST (send a 404 status code) WHEN an invalid shortened url is passed as a path variable', async () => {
      await request(app.getHttpServer()).get('/view/hello3').expect(404);
    });
  });

  afterEach(async () => {
    await dataSource.getMongoRepository(Url).deleteMany({});
  });

  afterAll(async()=>{
    await dataSource.dropDatabase()
  })
});
