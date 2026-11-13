import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

describe('Auth tokens (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.JWT_SECRET ??= 'test-jwt-secret-that-is-32-bytes!';
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD = 'admin';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('issues, refreshes and accepts an access token', async () => {
    const issued = await request(app.getHttpServer())
      .post('/auth/token')
      .send({ username: 'admin', password: 'admin' })
      .expect(200);

    expect(issued.body.access_token).toEqual(expect.any(String));
    expect(issued.body.refresh_token).toEqual(expect.any(String));

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${issued.body.access_token}`)
      .expect(200);

    expect(me.body).toEqual({
      username: 'admin',
      roles: ['admin'],
      permissions: [
        'finance.read',
        'finance.write',
        'users.read',
        'users.manage',
      ],
    });

    const refreshed = await request(app.getHttpServer())
      .post('/auth/token/refresh')
      .send({ refresh_token: issued.body.refresh_token })
      .expect(200);

    expect(refreshed.body.access_token).toEqual(expect.any(String));
    expect(refreshed.body.refresh_token).not.toBe(issued.body.refresh_token);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${refreshed.body.access_token}`)
      .expect(200);
  });

  it('rejects a wrong password', () => {
    return request(app.getHttpServer())
      .post('/auth/token')
      .send({ username: 'admin', password: 'incorrecta' })
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
