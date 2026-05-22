import * as fc from 'fast-check';
import { RolesGuard } from './roles.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '../enums/role.enum';

describe('RolesGuard Property Tests', () => {
  const allRoles = Object.values(Role);
  const nonAdminRoles = allRoles.filter((r) => r !== Role.ADMIN);

  describe('Property 2: Admin has universal endpoint access', () => {
    /**
     * Validates: Requirements 2.2
     *
     * For any combination of required roles on an endpoint,
     * a user with ADMIN role passes the RolesGuard.
     */
    it('for any set of required roles, ADMIN user passes the guard', () => {
      fc.assert(
        fc.property(
          fc.subarray(allRoles, { minLength: 1 }),
          (requiredRoles) => {
            const reflector = {
              getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
            } as any;
            const guard = new RolesGuard(reflector);

            const mockContext = {
              getHandler: () => ({}),
              getClass: () => ({}),
              switchToHttp: () => ({
                getRequest: () => ({
                  user: {
                    userId: 'test-admin-id',
                    email: 'admin@test.com',
                    role: Role.ADMIN,
                  },
                }),
              }),
            } as unknown as ExecutionContext;

            expect(guard.canActivate(mockContext)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 3: Non-admin roles denied unauthorized endpoints', () => {
    /**
     * Validates: Requirements 2.2
     *
     * For any non-ADMIN role and any set of required roles that does NOT
     * include that role, the guard throws ForbiddenException.
     */
    it('for any non-admin role not in requiredRoles, guard throws ForbiddenException', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...nonAdminRoles),
          fc.subarray(allRoles, { minLength: 1 }).filter(
            (roles) => roles.length > 0,
          ),
          (userRole, requiredRoles) => {
            // Ensure the user's role is NOT in the required roles
            fc.pre(!requiredRoles.includes(userRole));

            const reflector = {
              getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
            } as any;
            const guard = new RolesGuard(reflector);

            const mockContext = {
              getHandler: () => ({}),
              getClass: () => ({}),
              switchToHttp: () => ({
                getRequest: () => ({
                  user: {
                    userId: 'test-user-id',
                    email: 'user@test.com',
                    role: userRole,
                  },
                }),
              }),
            } as unknown as ExecutionContext;

            expect(() => guard.canActivate(mockContext)).toThrow(
              ForbiddenException,
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 4: Unauthenticated requests denied', () => {
    /**
     * Validates: Requirements 2.1
     *
     * For any set of required roles, if request.user is undefined/null,
     * the guard throws ForbiddenException.
     */
    it('for any required roles, missing user throws ForbiddenException', () => {
      fc.assert(
        fc.property(
          fc.subarray(allRoles, { minLength: 1 }),
          fc.constantFrom(undefined, null),
          (requiredRoles, userValue) => {
            const reflector = {
              getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
            } as any;
            const guard = new RolesGuard(reflector);

            const mockContext = {
              getHandler: () => ({}),
              getClass: () => ({}),
              switchToHttp: () => ({
                getRequest: () => ({
                  user: userValue,
                }),
              }),
            } as unknown as ExecutionContext;

            expect(() => guard.canActivate(mockContext)).toThrow(
              ForbiddenException,
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 8: Non-admin users denied user management', () => {
    /**
     * Validates: Requirements 2.2
     *
     * For any non-ADMIN role, when required roles is [ADMIN],
     * guard throws ForbiddenException.
     */
    it('for any non-admin role, ADMIN-only endpoint throws ForbiddenException', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...nonAdminRoles),
          (userRole) => {
            const reflector = {
              getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]),
            } as any;
            const guard = new RolesGuard(reflector);

            const mockContext = {
              getHandler: () => ({}),
              getClass: () => ({}),
              switchToHttp: () => ({
                getRequest: () => ({
                  user: {
                    userId: 'test-user-id',
                    email: 'user@test.com',
                    role: userRole,
                  },
                }),
              }),
            } as unknown as ExecutionContext;

            expect(() => guard.canActivate(mockContext)).toThrow(
              ForbiddenException,
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
