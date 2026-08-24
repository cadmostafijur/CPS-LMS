import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ROLE_NAMES,
  getRoleName,
  hasAnyRole,
  isAdmin,
  isContentManager,
  isInstructor,
  isStudent,
} from '../utils/roles';

describe('role helpers', () => {
  const admin = { role: { name: ROLE_NAMES.ADMIN } };
  const cm = { role: { name: ROLE_NAMES.CONTENT_MANAGER } };
  const instructor = { role: { name: ROLE_NAMES.INSTRUCTOR } };
  const student = { role: { name: ROLE_NAMES.STUDENT } };

  it('getRoleName reads role name', () => {
    assert.equal(getRoleName(admin), ROLE_NAMES.ADMIN);
    assert.equal(getRoleName(null), null);
  });

  it('identifies roles', () => {
    assert.equal(isAdmin(admin), true);
    assert.equal(isContentManager(cm), true);
    assert.equal(isInstructor(instructor), true);
    assert.equal(isStudent(student), true);
    assert.equal(isAdmin(student), false);
  });

  it('hasAnyRole checks membership', () => {
    assert.equal(hasAnyRole(instructor, [ROLE_NAMES.INSTRUCTOR, ROLE_NAMES.ADMIN]), true);
    assert.equal(hasAnyRole(student, [ROLE_NAMES.ADMIN]), false);
  });
});
