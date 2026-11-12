import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';
import { POST as register } from '@/app/api/auth/register/route';
import { POST as login } from '@/app/api/auth/login/route';
import { POST as logout } from '@/app/api/auth/logout/route';
import { GET as me } from '@/app/api/auth/me/route';
import { testOutbox } from '@/lib/email';
import { makeReq, call, cookieFrom, uniqueEmail, STRONG_PASSWORD, registerApplicant } from './helpers';

describe('1. User registration and login', () => {
  it('registers an applicant, hashes the password, starts a session and sends a welcome email', async () => {
    const email = uniqueEmail();
    const r = await call(
      register,
      makeReq('POST', '/api/auth/register', {
        body: { firstName: 'Ada', lastName: 'Tester', email, password: STRONG_PASSWORD, confirmPassword: STRONG_PASSWORD, acceptTerms: true },
      })
    );
    expect(r.status).toBe(201);
    const cookie = cookieFrom(r.res);
    expect(cookie).toBeTruthy();
    expect(r.res.headers.get('set-cookie')).toMatch(/HttpOnly/i);
    expect(r.res.headers.get('set-cookie')).toMatch(/SameSite=lax/i);

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user.role).toBe('APPLICANT');
    expect(user.passwordHash).not.toContain(STRONG_PASSWORD);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$12\$/);

    const session = await prisma.session.findFirst({ where: { userId: user.id } });
    expect(session.tokenHash).not.toBe(cookie.split('=')[1]); // only the hash is stored

    expect(testOutbox.some((m) => m.to === email && /account/i.test(m.subject))).toBe(true);
    const whoami = await call(me, makeReq('GET', '/api/auth/me', { cookie }));
    expect(whoami.body.user.email).toBe(email);
  });

  it('cannot self-register as staff even if a role is supplied', async () => {
    const { email } = await registerApplicant({ role: 'SUPER_ADMIN' });
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user.role).toBe('APPLICANT');
  });

  it('rejects weak passwords and duplicate accounts', async () => {
    const weak = await call(
      register,
      makeReq('POST', '/api/auth/register', {
        body: { firstName: 'A', lastName: 'B', email: uniqueEmail(), password: 'short', confirmPassword: 'short', acceptTerms: true },
      })
    );
    expect(weak.status).toBe(400);
    expect(weak.body.details.password).toBeTruthy();

    const { email } = await registerApplicant();
    const dup = await call(
      register,
      makeReq('POST', '/api/auth/register', {
        body: { firstName: 'A', lastName: 'B', email, password: STRONG_PASSWORD, confirmPassword: STRONG_PASSWORD, acceptTerms: true },
      })
    );
    expect(dup.status).toBe(409);
  });

  it('logs in with correct credentials and rejects wrong ones with a generic message', async () => {
    const { email } = await registerApplicant();
    const ok = await call(login, makeReq('POST', '/api/auth/login', { body: { email, password: STRONG_PASSWORD } }));
    expect(ok.status).toBe(200);
    expect(ok.body.redirectTo).toBe('/dashboard');

    const bad = await call(login, makeReq('POST', '/api/auth/login', { body: { email, password: 'Wrong-Password-1' } }));
    expect(bad.status).toBe(401);
    const unknown = await call(login, makeReq('POST', '/api/auth/login', { body: { email: uniqueEmail(), password: 'Wrong-Password-1' } }));
    expect(unknown.status).toBe(401);
    expect(unknown.body.error).toBe(bad.body.error); // no account enumeration
  });

  it('locks the account after repeated failures', async () => {
    const { email } = await registerApplicant();
    for (let i = 0; i < 5; i++) {
      await call(login, makeReq('POST', '/api/auth/login', { body: { email, password: 'Wrong-Password-1' } }));
    }
    const locked = await call(login, makeReq('POST', '/api/auth/login', { body: { email, password: STRONG_PASSWORD } }));
    expect(locked.status).toBe(423);
  });

  it('logout destroys the server-side session', async () => {
    const { cookie } = await registerApplicant();
    const r = await call(logout, makeReq('POST', '/api/auth/logout', { cookie }));
    expect(r.status).toBe(200);
    const after = await call(me, makeReq('GET', '/api/auth/me', { cookie }));
    expect(after.body.user).toBeNull();
  });

  it('rejects cross-origin state-changing requests (CSRF)', async () => {
    const { cookie } = await registerApplicant();
    const r = await call(logout, makeReq('POST', '/api/auth/logout', { cookie, origin: 'https://evil.example' }));
    expect(r.status).toBe(403);
    const noOrigin = await call(logout, makeReq('POST', '/api/auth/logout', { cookie, origin: null }));
    expect(noOrigin.status).toBe(403);
  });
});
