import * as fc from 'fast-check';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from './enums/role.enum';

describe('Auth Property Tests', () => {
  describe('Property 1: Password hashing round-trip', () => {
    /**
     * Validates: Requirements 1.3
     *
     * For any valid password string (printable, length 6-50),
     * hashing it with bcrypt and comparing the original against the hash returns true.
     */
    it(
      'for any valid password, hashing and comparing returns true',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc
              .string({ minLength: 6, maxLength: 50 })
              .filter((s) => /^[\x20-\x7E]+$/.test(s) && s.length >= 6),
            async (password) => {
              const hash = await bcrypt.hash(password, 10);
              const result = await bcrypt.compare(password, hash);
              expect(result).toBe(true);
            },
          ),
          { numRuns: 20 },
        );
      },
      30000,
    );
  });

  describe('Property 5: Invalid credentials rejected', () => {
    /**
     * Validates: Requirements 1.3
     *
     * For any two different strings (password and wrongPassword),
     * bcrypt.compare(wrongPassword, hash(password)) returns false.
     */
    it(
      'for any password and different wrongPassword, compare returns false',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc
              .string({ minLength: 6, maxLength: 20 })
              .filter((s) => /^[\x20-\x7E]+$/.test(s) && s.length >= 6),
            fc
              .string({ minLength: 6, maxLength: 20 })
              .filter((s) => /^[\x20-\x7E]+$/.test(s) && s.length >= 6),
            async (password, wrongPassword) => {
              fc.pre(password !== wrongPassword);
              const hash = await bcrypt.hash(password, 10);
              const result = await bcrypt.compare(wrongPassword, hash);
              expect(result).toBe(false);
            },
          ),
          { numRuns: 20 },
        );
      },
      30000,
    );
  });

  describe('Property 7: Deactivated users cannot login', () => {
    /**
     * Validates: Requirements 1.4
     *
     * For any user object with isActive=false, the AuthService login
     * logic rejects with UnauthorizedException.
     */
    it(
      'for any deactivated user, login throws UnauthorizedException',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              email: fc
                .string({ minLength: 3, maxLength: 20 })
                .filter((s) => /^[a-z]+$/.test(s))
                .map((s) => `${s}@test.com`),
              password: fc
                .string({ minLength: 6, maxLength: 20 })
                .filter((s) => /^[\x20-\x7E]+$/.test(s) && s.length >= 6),
              role: fc.constantFrom(...Object.values(Role)),
            }),
            async ({ email, password, role }) => {
              const hashedPassword = await bcrypt.hash(password, 10);

              const mockPrisma = {
                user: {
                  findUnique: jest.fn().mockResolvedValue({
                    id: 'user-id',
                    email,
                    password: hashedPassword,
                    role,
                    isActive: false,
                    name: 'Test User',
                  }),
                },
              } as unknown as PrismaService;

              const mockJwtService = {
                sign: jest.fn().mockReturnValue('mock-token'),
              } as unknown as JwtService;

              const authService = new AuthService(mockPrisma, mockJwtService);

              await expect(
                authService.login(email, password),
              ).rejects.toThrow(UnauthorizedException);
            },
          ),
          { numRuns: 20 },
        );
      },
      30000,
    );
  });
});
