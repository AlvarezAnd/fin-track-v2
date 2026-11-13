import { AccessPolicy } from '../../src/users/access.policy.js';
import type { AppUser } from '../../src/users/app-user.js';

const admin: AppUser = {
  id: 1,
  username: 'admin',
  roles: ['admin'],
  permissions: ['finance.read', 'finance.write', 'users.read', 'users.manage'],
};

const viewer: AppUser = {
  id: 2,
  username: 'visita',
  roles: ['viewer'],
  permissions: ['finance.read'],
};

const common: AppUser = {
  id: 3,
  username: 'ana',
  roles: ['user'],
  permissions: ['finance.read', 'finance.write', 'users.read'],
};

describe('AccessPolicy', () => {
  const policy = new AccessPolicy();

  it('allows an admin to manage users', () => {
    expect(policy.manageUsers(admin)).toBe(true);
    expect(policy.readUsers(admin)).toBe(true);
    expect(policy.manageUsers(viewer)).toBe(false);
    expect(policy.manageUsers(null)).toBe(false);
  });

  it('allows a viewer to read finance only', () => {
    expect(policy.readFinance(viewer)).toBe(true);
    expect(policy.writeFinance(viewer)).toBe(false);
    expect(policy.readUsers(viewer)).toBe(false);
  });

  it('lets only the administrator change exchange rates', () => {
    expect(policy.manageRates(admin)).toBe(true);
    expect(policy.manageRates(common)).toBe(false);
    expect(policy.writeFinance(common)).toBe(true);
    expect(policy.manageUsers(common)).toBe(false);
    expect(policy.manageRates(viewer)).toBe(false);
    expect(policy.manageRates(null)).toBe(false);
  });
});
