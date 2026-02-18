/**
 * Build da extensão e criação de um zip para distribuição.
 * O zip contém só o output do build (minificado, sem source maps).
 * Uso: node scripts/package-for-distribution.mjs
 * Saída: extension/extension-dist.zip (raiz do zip = conteúdo de dist/)
 */
import { createWriteStream } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const zipPath = join(rootDir, 'extension-dist.zip');

function runBuild() {
  console.log('Running npm run build...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
}

async function createZip() {
  const { default: archiver } = await import('archiver');
  const archive = archiver('zip', { zlib: { level: 9 } });
  const out = createWriteStream(zipPath);
  archive.pipe(out);
  archive.directory(distDir, false);
  archive.finalize();
  await new Promise((resolve, reject) => {
    out.on('finish', resolve);
    out.on('error', reject);
  });
}

async function main() {
  await runBuild();
  console.log('Creating extension-dist.zip from dist/...');
  await createZip();
  console.log('Done. File:', zipPath);
  console.log('Distribute this zip: users can unzip and load as "Unpacked" in chrome://extensions');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
