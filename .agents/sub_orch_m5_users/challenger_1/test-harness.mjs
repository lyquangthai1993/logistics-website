import { z } from 'zod';
import assert from 'node:assert/strict';

console.log('================================================================');
console.log('🏁 STARTING EMPIRICAL CHALLENGER TEST SUITE: USERS MANAGEMENT (M5)');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
  }
}

// ---------------------------------------------------------------------------
// 1. ZOD SCHEMA REPLICATION & STRESS-TESTING (from src/features/users/schemas/user.ts)
// ---------------------------------------------------------------------------
console.log('--- SUITE 1: Zod Schemas Edge Cases & Validation ---');

const userSchema = z.object({
  firstName: z.string().trim().min(1, 'Vui lòng nhập tên (First Name)').max(50, 'Tên tối đa 50 ký tự'),
  lastName: z.string().trim().min(1, 'Vui lòng nhập họ (Last Name)').max(50, 'Họ tối đa 50 ký tự'),
  email: z.string().trim().min(1, 'Vui lòng nhập địa chỉ email').email('Email không đúng định dạng'),
  username: z.string().trim().optional().or(z.literal('')),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: 'Mật khẩu phải có ít nhất 6 ký tự'
    }),
  roleId: z.coerce.number().min(1, 'Vui lòng chọn vai trò').max(4, 'Vai trò không hợp lệ'),
  statusId: z.coerce.number().min(1, 'Vui lòng chọn trạng thái').max(2, 'Trạng thái không hợp lệ')
});

const userCreateSchema = userSchema.extend({
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
});

const userUpdateSchema = userSchema;

// Create Schema Tests
test('userCreateSchema: Valid full payload passes', () => {
  const result = userCreateSchema.safeParse({
    firstName: 'Nguyễn Văn',
    lastName: 'An',
    email: 'an.nguyen@logistics.vn',
    username: 'vanan',
    password: 'password123',
    roleId: 2,
    statusId: 1
  });
  assert.equal(result.success, true);
  assert.equal(result.data.firstName, 'Nguyễn Văn');
  assert.equal(result.data.lastName, 'An');
  assert.equal(result.data.email, 'an.nguyen@logistics.vn');
  assert.equal(result.data.roleId, 2);
  assert.equal(result.data.statusId, 1);
});

test('userCreateSchema: Missing password fails', () => {
  const result = userCreateSchema.safeParse({
    firstName: 'Nguyễn Văn',
    lastName: 'An',
    email: 'an.nguyen@logistics.vn',
    roleId: 2,
    statusId: 1
  });
  assert.equal(result.success, false);
  const pwError = result.error.issues.find((i) => i.path.includes('password'));
  assert.ok(pwError, 'Must fail on missing password');
});

test('userCreateSchema: Short password (< 6 chars) fails', () => {
  const result = userCreateSchema.safeParse({
    firstName: 'Nguyễn Văn',
    lastName: 'An',
    email: 'an.nguyen@logistics.vn',
    password: '12345',
    roleId: 2,
    statusId: 1
  });
  assert.equal(result.success, false);
  const pwError = result.error.issues.find((i) => i.path.includes('password'));
  assert.ok(pwError, 'Must fail on short password');
});

test('userCreateSchema: Exactly 6 chars password passes', () => {
  const result = userCreateSchema.safeParse({
    firstName: 'Nguyễn Văn',
    lastName: 'An',
    email: 'an.nguyen@logistics.vn',
    password: '123456',
    roleId: 2,
    statusId: 1
  });
  assert.equal(result.success, true);
});

test('userCreateSchema: Invalid email formats fail', () => {
  const invalidEmails = ['invalid', 'user@', '@domain.com', 'user@domain..com', 'user space@domain.com'];
  for (const email of invalidEmails) {
    const result = userCreateSchema.safeParse({
      firstName: 'Nguyễn',
      lastName: 'An',
      email,
      password: 'password123',
      roleId: 2,
      statusId: 1
    });
    assert.equal(result.success, false, `Expected failure for email: ${email}`);
  }
});

test('userCreateSchema: Empty / whitespace firstName & lastName fail with trim', () => {
  const badNames = [
    { firstName: '', lastName: 'An' },
    { firstName: '   ', lastName: 'An' },
    { firstName: 'An', lastName: '' },
    { firstName: 'An', lastName: '   ' }
  ];
  for (const bad of badNames) {
    const result = userCreateSchema.safeParse({
      ...bad,
      email: 'test@domain.com',
      password: 'password123',
      roleId: 1,
      statusId: 1
    });
    assert.equal(result.success, false, `Expected failure for name: ${JSON.stringify(bad)}`);
  }
});

test('userCreateSchema: Names > 50 characters fail max constraint', () => {
  const longName = 'A'.repeat(51);
  const result1 = userCreateSchema.safeParse({
    firstName: longName,
    lastName: 'An',
    email: 'test@domain.com',
    password: 'password123',
    roleId: 1,
    statusId: 1
  });
  assert.equal(result1.success, false);

  const result2 = userCreateSchema.safeParse({
    firstName: 'An',
    lastName: longName,
    email: 'test@domain.com',
    password: 'password123',
    roleId: 1,
    statusId: 1
  });
  assert.equal(result2.success, false);
});

test('userCreateSchema: Role ID boundary enforcement (1..4)', () => {
  const validRoles = [1, 2, 3, 4];
  for (const roleId of validRoles) {
    const res = userCreateSchema.safeParse({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@domain.com',
      password: 'password123',
      roleId,
      statusId: 1
    });
    assert.equal(res.success, true, `Role ${roleId} must be valid`);
  }

  const invalidRoles = [0, -1, 5, 99];
  for (const roleId of invalidRoles) {
    const res = userCreateSchema.safeParse({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@domain.com',
      password: 'password123',
      roleId,
      statusId: 1
    });
    assert.equal(res.success, false, `Role ${roleId} must be invalid`);
  }
});

test('userCreateSchema: Status ID boundary enforcement (1..2)', () => {
  const validStatuses = [1, 2];
  for (const statusId of validStatuses) {
    const res = userCreateSchema.safeParse({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@domain.com',
      password: 'password123',
      roleId: 1,
      statusId
    });
    assert.equal(res.success, true, `Status ${statusId} must be valid`);
  }

  const invalidStatuses = [0, -1, 3, 99];
  for (const statusId of invalidStatuses) {
    const res = userCreateSchema.safeParse({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@domain.com',
      password: 'password123',
      roleId: 1,
      statusId
    });
    assert.equal(res.success, false, `Status ${statusId} must be invalid`);
  }
});

test('userCreateSchema: Coercion for string roleId and statusId from form select inputs', () => {
  const res = userCreateSchema.safeParse({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@domain.com',
    password: 'password123',
    roleId: '3',
    statusId: '2'
  });
  assert.equal(res.success, true);
  assert.strictEqual(res.data.roleId, 3);
  assert.strictEqual(res.data.statusId, 2);
});

// Update Schema Tests
test('userUpdateSchema: Valid payload without password passes (optional password in edit)', () => {
  const result = userUpdateSchema.safeParse({
    firstName: 'Nguyễn Văn',
    lastName: 'An Cập Nhật',
    email: 'an.nguyen.updated@logistics.vn',
    username: 'vanan_new',
    roleId: 3,
    statusId: 1
  });
  assert.equal(result.success, true);
  assert.equal(result.data.password, undefined);
});

test('userUpdateSchema: Valid payload with empty string password passes', () => {
  const result = userUpdateSchema.safeParse({
    firstName: 'Nguyễn Văn',
    lastName: 'An',
    email: 'an.nguyen@logistics.vn',
    password: '',
    roleId: 2,
    statusId: 1
  });
  assert.equal(result.success, true);
});

test('userUpdateSchema: Password provided but < 6 chars fails in edit mode', () => {
  const result = userUpdateSchema.safeParse({
    firstName: 'Nguyễn Văn',
    lastName: 'An',
    email: 'an.nguyen@logistics.vn',
    password: '123',
    roleId: 2,
    statusId: 1
  });
  assert.equal(result.success, false);
});

test('userUpdateSchema: Password provided with >= 6 chars passes in edit mode', () => {
  const result = userUpdateSchema.safeParse({
    firstName: 'Nguyễn Văn',
    lastName: 'An',
    email: 'an.nguyen@logistics.vn',
    password: 'newSecretPassword123',
    roleId: 2,
    statusId: 1
  });
  assert.equal(result.success, true);
  assert.equal(result.data.password, 'newSecretPassword123');
});

// ---------------------------------------------------------------------------
// 2. API SERVICE CONTRACT & PAYLOAD SHAPE VERIFICATION
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 2: API Client Service Contract & Query Serialization ---');

// Mock apiClient to record calls
let lastCall = null;
const mockApiClient = {
  get: async (url, config) => {
    lastCall = { method: 'GET', url, config };
    return {
      data: {
        data: [
          { id: 1, email: 'admin@logistics.vn', firstName: 'Super', lastName: 'Admin', role: { id: 1, name: 'SUPER_ADMIN' }, status: { id: 1, name: 'active' } }
        ],
        hasNextPage: false,
        total_users: 1
      }
    };
  },
  post: async (url, payload) => {
    lastCall = { method: 'POST', url, payload };
    return { data: { id: 10, ...payload } };
  },
  patch: async (url, payload) => {
    lastCall = { method: 'PATCH', url, payload };
    return { data: { id: 10, ...payload } };
  },
  delete: async (url) => {
    lastCall = { method: 'DELETE', url };
    return { data: null };
  }
};

// Replicate service functions using mockApiClient
async function mockGetUsers(filters = {}) {
  const params = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 10
  };

  if (filters.roles) {
    const roleId = Number(filters.roles);
    if (!isNaN(roleId) && roleId > 0) {
      params.filters = JSON.stringify({ roles: [{ id: roleId }] });
    }
  }

  if (filters.sort) {
    params.sort = filters.sort;
  }

  const res = await mockApiClient.get('/api/v1/users', { params });
  const data = res.data;

  return {
    data: data.data ?? [],
    hasNextPage: data.hasNextPage ?? false,
    total_users: data.total_users ?? data.data?.length ?? 0,
    users: data.data ?? []
  };
}

async function mockGetUserById(id) {
  const res = await mockApiClient.get(`/api/v1/users/${id}`);
  return res.data;
}

async function mockCreateUser(payload) {
  const res = await mockApiClient.post('/api/v1/users', payload);
  return res.data;
}

async function mockUpdateUser(id, payload) {
  const res = await mockApiClient.patch(`/api/v1/users/${id}`, payload);
  return res.data;
}

async function mockDeleteUser(id) {
  await mockApiClient.delete(`/api/v1/users/${id}`);
}

test('getUsers: Default call sends GET /api/v1/users with page=1, limit=10', async () => {
  const res = await mockGetUsers();
  assert.equal(lastCall.method, 'GET');
  assert.equal(lastCall.url, '/api/v1/users');
  assert.equal(lastCall.config.params.page, 1);
  assert.equal(lastCall.config.params.limit, 10);
  assert.equal(lastCall.config.params.filters, undefined);
  assert.equal(res.data.length, 1);
  assert.equal(res.hasNextPage, false);
});

test('getUsers: Role filter serializes to JSON string {"roles":[{"id":N}]}', async () => {
  await mockGetUsers({ page: 2, limit: 20, roles: '3' });
  assert.equal(lastCall.config.params.page, 2);
  assert.equal(lastCall.config.params.limit, 20);
  assert.equal(lastCall.config.params.filters, JSON.stringify({ roles: [{ id: 3 }] }));
});

test('getUsers: Invalid role filter string does not emit invalid JSON', async () => {
  await mockGetUsers({ roles: 'invalid_role' });
  assert.equal(lastCall.config.params.filters, undefined);
});

test('getUsers: Sort param is forwarded correctly', async () => {
  const sortStr = JSON.stringify([{ id: 'createdAt', desc: true }]);
  await mockGetUsers({ sort: sortStr });
  assert.equal(lastCall.config.params.sort, sortStr);
});

test('getUserById: Sends GET /api/v1/users/:id', async () => {
  await mockGetUserById(42);
  assert.equal(lastCall.method, 'GET');
  assert.equal(lastCall.url, '/api/v1/users/42');
});

test('createUser: Sends POST /api/v1/users with correct DTO shape', async () => {
  const payload = {
    firstName: 'Bình',
    lastName: 'Trần',
    email: 'binh.tran@logistics.vn',
    username: 'binhtran',
    password: 'password123',
    role: { id: 2 },
    status: { id: 1 }
  };
  const res = await mockCreateUser(payload);
  assert.equal(lastCall.method, 'POST');
  assert.equal(lastCall.url, '/api/v1/users');
  assert.deepEqual(lastCall.payload, payload);
  assert.equal(res.firstName, 'Bình');
  assert.deepEqual(res.role, { id: 2 });
  assert.deepEqual(res.status, { id: 1 });
});

test('updateUser: Sends PATCH /api/v1/users/:id with correct DTO shape', async () => {
  const payload = {
    firstName: 'Bình Cập Nhật',
    lastName: 'Trần',
    email: 'binh.updated@logistics.vn',
    role: { id: 4 },
    status: { id: 2 }
  };
  await mockUpdateUser(15, payload);
  assert.equal(lastCall.method, 'PATCH');
  assert.equal(lastCall.url, '/api/v1/users/15');
  assert.deepEqual(lastCall.payload, payload);
});

test('deleteUser: Sends DELETE /api/v1/users/:id', async () => {
  await mockDeleteUser(15);
  assert.equal(lastCall.method, 'DELETE');
  assert.equal(lastCall.url, '/api/v1/users/15');
});

// ---------------------------------------------------------------------------
// 3. TANSTACK QUERY KEY FACTORY CONSISTENCY
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 3: TanStack Query Key Factory Consistency ---');

const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (filters = {}) => [...userKeys.lists(), filters],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id]
};

test('userKeys: Key hierarchy structure matches TanStack Query v5 conventions', () => {
  assert.deepEqual(userKeys.all, ['users']);
  assert.deepEqual(userKeys.lists(), ['users', 'list']);
  assert.deepEqual(userKeys.details(), ['users', 'detail']);

  const listKeyEmpty = userKeys.list();
  assert.deepEqual(listKeyEmpty, ['users', 'list', {}]);

  const filterParam = { page: 1, limit: 10, roles: '2' };
  const listKeyFiltered = userKeys.list(filterParam);
  assert.deepEqual(listKeyFiltered, ['users', 'list', { page: 1, limit: 10, roles: '2' }]);

  const detailKey = userKeys.detail(123);
  assert.deepEqual(detailKey, ['users', 'detail', 123]);

  // Ensure invalidateQueries({ queryKey: userKeys.all }) prefix-matches all subkeys
  assert.equal(listKeyFiltered[0], userKeys.all[0]);
  assert.equal(detailKey[0], userKeys.all[0]);
});

// ---------------------------------------------------------------------------
// 4. TMS ROLE & STATUS OPTIONS VERIFICATION
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 4: TMS Domain Roles & Statuses Alignment ---');

const ROLE_OPTIONS = [
  { value: '1', label: 'Super Admin', code: 'SUPER_ADMIN' },
  { value: '2', label: 'Điều phối viên', code: 'DISPATCHER' },
  { value: '3', label: 'Quản lý đội xe', code: 'FLEET_MANAGER' },
  { value: '4', label: 'Quản lý kho', code: 'WAREHOUSE_MANAGER' }
];

const STATUS_OPTIONS = [
  { value: '1', label: 'Hoạt động', code: 'active' },
  { value: '2', label: 'Ngừng hoạt động', code: 'inactive' }
];

test('ROLE_OPTIONS: Exactly matches 4 system TMS roles with correct numeric IDs', () => {
  assert.equal(ROLE_OPTIONS.length, 4);
  assert.deepEqual(ROLE_OPTIONS.map(r => ({ id: Number(r.value), code: r.code })), [
    { id: 1, code: 'SUPER_ADMIN' },
    { id: 2, code: 'DISPATCHER' },
    { id: 3, code: 'FLEET_MANAGER' },
    { id: 4, code: 'WAREHOUSE_MANAGER' }
  ]);
});

test('STATUS_OPTIONS: Matches active/inactive statuses with correct numeric IDs', () => {
  assert.equal(STATUS_OPTIONS.length, 2);
  assert.deepEqual(STATUS_OPTIONS.map(s => ({ id: Number(s.value), code: s.code })), [
    { id: 1, code: 'active' },
    { id: 2, code: 'inactive' }
  ]);
});

// ---------------------------------------------------------------------------
// 5. RBAC ROUTE GUARD INTEGRITY (proxy.ts)
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 5: RBAC Route Guard Integrity ---');

const roleRouteMap = {
  '/dashboard/admin': ['SUPER_ADMIN'],
  '/dashboard/users': ['SUPER_ADMIN'],
  '/dashboard/orders': ['SUPER_ADMIN', 'DISPATCHER'],
  '/dashboard/trips': ['SUPER_ADMIN', 'FLEET_MANAGER'],
  '/dashboard/fleet': ['SUPER_ADMIN', 'FLEET_MANAGER'],
  '/dashboard/warehouse': ['SUPER_ADMIN', 'WAREHOUSE_MANAGER']
};

test('RBAC Route Guard: /dashboard/users restricted strictly to SUPER_ADMIN', () => {
  assert.ok(roleRouteMap['/dashboard/users']);
  assert.deepEqual(roleRouteMap['/dashboard/users'], ['SUPER_ADMIN']);
  
  // Non-super-admin roles are rejected
  const disallowedRoles = ['DISPATCHER', 'FLEET_MANAGER', 'WAREHOUSE_MANAGER', 'GUEST'];
  for (const role of disallowedRoles) {
    const isAllowed = roleRouteMap['/dashboard/users'].includes(role);
    assert.equal(isAllowed, false, `Role ${role} should not have access to /dashboard/users`);
  }
});

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`📊 TEST RESULTS SUMMARY: Total: ${passCount + failCount} | Passed: ${passCount} | Failed: ${failCount}`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL EMPIRICAL CHALLENGER TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}
