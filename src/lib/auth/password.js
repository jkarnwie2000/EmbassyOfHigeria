import bcrypt from 'bcryptjs';

const COST = 12;

export function hashPassword(plain) {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// A valid hash of a random string, used to equalise timing when the user does not exist.
let dummyHash;
export async function dummyVerify(plain) {
  dummyHash ??= await bcrypt.hash('timing-equaliser-' + Math.random(), COST);
  await bcrypt.compare(plain, dummyHash);
  return false;
}
