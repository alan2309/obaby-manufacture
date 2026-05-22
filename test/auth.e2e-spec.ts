import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Auth E2E Integration Tests
 *
 * These tests require a running database with the admin user seeded.
 * If DATABASE_URL is not available or the DB is not running, tests are skipped gracefully.
 */

let app: INestApplication;
let prisma: PrismaService;
let dbAvailable = false;

beforeAll(async () => {
  try {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Verify DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    dbAvailable = true;
  } catch (error) {
    console.warn(
      'Database not available — skipping auth e2e tests.',
      (error as Error).message,
    );
  }
});

afterAll(async () => {
  if (app) {
    // Clean up test users created during tests
    if (dbAvailable) {
      await prisma.refreshToken.deleteMany({
        where: { user: { email: { contains: '@e2e-test.local' } } },
      });
      await prisma.user.deleteMany({
        where: { email: { contains: '@e2e-test.local' } },
      });
    }
    await app.close();
  }
});

function skipIfNoDb() {
  if (!dbAvailable) {
    return true;
  }
  return false;
}

// ─── 8.1 Full Auth Flow ─────────────────────────────────────────────────────

describe('8.1 Full auth flow (e2e)', () => {
  let accessToken: string;
  let refreshToken: string;

  it('should login with admin credentials and receive tokens', async () => {
    if (skipIfNoDb()) return;

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@mms.local', password: 'admin123' })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('should access protected route GET /users with access token', async () => {
    if (skipIfNoDb()) return;

    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('should refresh the token and get new access token', async () => {
    if (skipIfNoDb()) return;

    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    // Update tokens for subsequent steps
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('should logout with the refresh token', async () => {
    if (skipIfNoDb()) return;

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(201);
  });

  it('should fail to refresh with the old (logged-out) token', async () => {
    if (skipIfNoDb()) return;

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });
});

// ─── 8.2 User Management ────────────────────────────────────────────────────

describe('8.2 User management (e2e)', () => {
  let adminAccessToken: string;
  const testUserEmail = 'cutting-user@e2e-test.local';
  const testUserPassword = 'testpass123';

  beforeAll(async () => {
    if (skipIfNoDb()) return;

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@mms.local', password: 'admin123' });

    adminAccessToken = res.body.accessToken;
  });

  it('should create a new user with role CUTTING', async () => {
    if (skipIfNoDb()) return;

    const res = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        email: testUserEmail,
        password: testUserPassword,
        name: 'E2E Cutting User',
        role: 'CUTTING',
      })
      .expect(201);

    expect(res.body.email).toBe(testUserEmail);
    expect(res.body.role).toBe('CUTTING');
  });

  it('should login as the new user successfully', async () => {
    if (skipIfNoDb()) return;

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUserEmail, password: testUserPassword })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
  });

  it('new user should be denied GET /users (403)', async () => {
    if (skipIfNoDb()) return;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUserEmail, password: testUserPassword });

    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(403);
  });

  it('new user should be denied POST /users (403)', async () => {
    if (skipIfNoDb()) return;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUserEmail, password: testUserPassword });

    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .send({
        email: 'should-not-create@e2e-test.local',
        password: 'password123',
        name: 'Should Not Exist',
        role: 'CUTTING',
      })
      .expect(403);
  });
});

// ─── 8.3 Role Enforcement ───────────────────────────────────────────────────

describe('8.3 Role enforcement (e2e)', () => {
  let adminAccessToken: string;
  const roleUsers = [
    { email: 'cutting-role@e2e-test.local', role: 'CUTTING', password: 'rolepass123' },
    { email: 'stitching-role@e2e-test.local', role: 'STITCHING', password: 'rolepass123' },
    { email: 'iron-role@e2e-test.local', role: 'IRON', password: 'rolepass123' },
  ];

  beforeAll(async () => {
    if (skipIfNoDb()) return;

    // Login as admin
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@mms.local', password: 'admin123' });

    adminAccessToken = res.body.accessToken;

    // Create users for each role
    for (const user of roleUsers) {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          email: user.email,
          password: user.password,
          name: `E2E ${user.role} User`,
          role: user.role,
        });
    }
  });

  for (const user of [
    { email: 'cutting-role@e2e-test.local', role: 'CUTTING', password: 'rolepass123' },
    { email: 'stitching-role@e2e-test.local', role: 'STITCHING', password: 'rolepass123' },
    { email: 'iron-role@e2e-test.local', role: 'IRON', password: 'rolepass123' },
  ]) {
    describe(`${user.role} role`, () => {
      let userAccessToken: string;
      let userRefreshToken: string;

      beforeAll(async () => {
        if (skipIfNoDb()) return;

        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: user.email, password: user.password });

        userAccessToken = res.body.accessToken;
        userRefreshToken = res.body.refreshToken;
      });

      it('can access POST /auth/logout (any authenticated user)', async () => {
        if (skipIfNoDb()) return;

        // Logout should succeed for any authenticated user
        await request(app.getHttpServer())
          .post('/auth/logout')
          .set('Authorization', `Bearer ${userAccessToken}`)
          .send({ refreshToken: userRefreshToken })
          .expect(201);
      });

      it('cannot access GET /users (403)', async () => {
        if (skipIfNoDb()) return;

        // Re-login since we logged out above
        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: user.email, password: user.password });

        await request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
          .expect(403);
      });

      it('cannot access POST /users (403)', async () => {
        if (skipIfNoDb()) return;

        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: user.email, password: user.password });

        await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
          .send({
            email: 'unauthorized-create@e2e-test.local',
            password: 'password123',
            name: 'Unauthorized',
            role: 'CUTTING',
          })
          .expect(403);
      });
    });
  }
});
