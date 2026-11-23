import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const environmentsDirectory = resolve(projectRoot, 'src/environments');
const developmentFile = resolve(environmentsDirectory, 'environments.ts');
const productionFile = resolve(environmentsDirectory, 'environments.production.ts');

const apiUrl =
  process.env.FREEHONGO_API_URL ??
  process.env.FRONTEND_API_URL ??
  process.env.FREEHONGO_API ??
  process.env.API_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const googleClientID = process.env.GOOGLE_CLIENT_ID;
const runningOnVercel = process.env.VERCEL === '1';

if (runningOnVercel && (!apiUrl || !supabaseUrl || !googleClientID)) {
  throw new Error(
    'Missing FREEHONGO_API_URL, SUPABASE_URL or GOOGLE_CLIENT_ID in Vercel environment variables.',
  );
}

// Keep locally-created ignored files intact when developing without env vars.
if (!apiUrl && !supabaseUrl && !googleClientID && existsSync(developmentFile) && existsSync(productionFile)) {
  process.exit(0);
}

if (!apiUrl || !supabaseUrl || !googleClientID) {
  throw new Error(
    'Set FREEHONGO_API_URL, SUPABASE_URL and GOOGLE_CLIENT_ID, or create local src/environments files.',
  );
}

mkdirSync(environmentsDirectory, { recursive: true });

const config = `export const environment = ${JSON.stringify(
  {
    production: false,
    apiUrl,
    supabaseUrl,
    googleClientID,
  },
  null,
  2,
)};\n`;

const productionConfig = config.replace('production: false', 'production: true');

writeFileSync(developmentFile, config);
writeFileSync(productionFile, productionConfig);
