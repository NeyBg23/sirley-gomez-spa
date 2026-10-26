import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { Writable } from 'node:stream';
import { pathToFileURL } from 'node:url';

export const projectUrl = 'https://kckdtjbplkajmzjqazfn.supabase.co';
const panelUrl = 'https://sirley-gomez-spa.netlify.app/admin';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class SetupError extends Error {}

function validateTarget(userId, email) {
  if (!uuid.test(userId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new SetupError('Revisa el UID y el correo de la cuenta existente.');
  }
}

function headersFor(key) {
  if (typeof key !== 'string' || !key.startsWith('sb_secret_') ||
      key.length <= 20 || key.length > 4096 || /\s/.test(key)) {
    throw new SetupError('Usa una clave secreta de Supabase de este proyecto; una clave publicable no sirve.');
  }
  return { apikey: key, 'Content-Type': 'application/json' };
}

async function request(fetcher, headers, path, method = 'GET', body) {
  let response;
  try {
    response = await fetcher(projectUrl + path, {
      method, headers, redirect: 'error', signal: AbortSignal.timeout(15000),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new SetupError('No se pudo confirmar la respuesta. Comprueba el estado antes de volver a intentar.');
  }
  if (!response.ok) {
    throw new SetupError(`Supabase rechazó la operación (HTTP ${response.status}). Revisa Auth Logs sin compartir claves.`);
  }
  try { return await response.json(); }
  catch { throw new SetupError('Respuesta inesperada. Comprueba el estado antes de volver a intentar.'); }
}

export async function inspectAdmin({ userId, email, key, fetcher = fetch }) {
  validateTarget(userId, email);
  const headers = headersFor(key);
  const result = await request(fetcher, headers, `/auth/v1/admin/users/${userId}`);
  const user = result.user ?? result;
  if (user.id !== userId || user.email?.toLowerCase() !== email.toLowerCase()) {
    throw new SetupError('El correo y el UID no corresponden a la misma cuenta. Revisa su estado antes de seguir.');
  }
  const roles = await request(fetcher, headers,
    `/rest/v1/admins?select=user_id&user_id=eq.${userId}`);
  if (!Array.isArray(roles) || roles.length !== 1 || roles[0].user_id !== userId) {
    throw new SetupError('Esta cuenta no tiene el permiso de administradora. Revisa su estado antes de seguir.');
  }
  return { userId: user.id, email: user.email, confirmed: Boolean(user.email_confirmed_at) };
}

export async function configureAdminAccess(options) {
  const { userId, email, key, password, repeatPassword, confirmation, fetcher = fetch } = options;
  if (confirmation !== 'ACTIVAR') throw new SetupError('Operación cancelada.');
  if (typeof password !== 'string' || [...password].length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new SetupError('Usa al menos 12 caracteres y un máximo de 72 bytes para la contraseña.');
  }
  if (password !== repeatPassword) throw new SetupError('Las contraseñas no coinciden.');
  await inspectAdmin({ userId, email, key, fetcher });
  await request(fetcher, headersFor(key), `/auth/v1/admin/users/${userId}`, 'PUT', {
    password, email_confirm: true,
  });
  const verified = await inspectAdmin({ userId, email, key, fetcher });
  if (!verified.confirmed) throw new SetupError('Supabase no confirmó la activación. Comprueba Auth Logs antes de repetir.');
  return verified;
}

async function ask(label, secret = false) {
  stdout.write(`${label.trimEnd()}\n`);
  const sink = secret ? new Writable({ write(_chunk, _encoding, callback) { callback(); } }) : stdout;
  const reader = createInterface({ input: stdin, output: sink, terminal: true, historySize: 0 });
  const controller = new AbortController();
  reader.once('SIGINT', () => controller.abort());
  if (secret) stdout.write('> ');
  try { return await reader.question(secret ? '' : '> ', { signal: controller.signal }); }
  catch { throw new SetupError('Operación cancelada.'); }
  finally { reader.close(); if (secret) stdout.write('\n'); }
}

async function main() {
  if (process.argv.includes('--help')) {
    stdout.write('Uso: node configure-admin-access.mjs\nNode.js 24. Solo en el equipo privado de quien administra este proyecto.\n');
    return;
  }
  if (Number(process.versions.node.split('.')[0]) < 24 || !stdin.isTTY || !stdout.isTTY) {
    throw new SetupError('Ejecuta el archivo en una terminal interactiva privada con Node.js 24.');
  }
  stdout.write(`Configurar acceso de una administradora existente (v2)\nProyecto: ${projectUrl}\n`);
  const userId = (await ask('UID de la cuenta (Authentication > Users): ')).trim().toLowerCase();
  const email = (await ask('Correo de esa cuenta: ')).trim().toLowerCase();
  validateTarget(userId, email);
  const key = (await ask('Clave secreta de Supabase de este proyecto (oculta): ', true)).trim();
  const current = await inspectAdmin({ userId, email, key });
  stdout.write(`Cuenta encontrada: ${current.email}\nPermiso de administradora: comprobado.\n`);
  stdout.write('Esta operación asigna una contraseña y confirma administrativamente SOLO esta cuenta.\n');
  const confirmation = (await ask('Si tienes autorización de su titular, escribe ACTIVAR: ')).trim();
  if (confirmation !== 'ACTIVAR') throw new SetupError('Operación cancelada.');
  const password = await ask('Nueva contraseña del panel (oculta, mínimo 12 caracteres): ', true);
  const repeatPassword = await ask('Repite la contraseña (oculta): ', true);
  await configureAdminAccess({ userId, email, key, password, repeatPassword, confirmation });
  stdout.write(`Acceso configurado. El UID y el permiso de administradora se conservaron.\nAbre ${panelUrl} e inicia sesión para comprobarlo.\n`);
  stdout.write('La recuperación por correo sigue dependiendo de corregir el SMTP.\n');
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch(error => {
    stdout.write(`${error instanceof SetupError ? error.message : 'No se pudo completar la operación. Revisa el estado de la cuenta.'}\n`);
    process.exitCode = 1;
  });
}
