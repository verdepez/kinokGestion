import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mode = process.argv[2] || 'dev';

// En unidades externas montadas con 'noexec' (ej. /run/media/...), el binario nativo de esbuild
// debe copiarse a /tmp con permisos de ejecución (0o755) y exponerse vía ESBUILD_BINARY_PATH.
const sourceEsbuild = path.join(
  __dirname,
  'node_modules',
  '@esbuild',
  'linux-x64',
  'bin',
  'esbuild'
);
const tmpEsbuild = '/tmp/kinok-esbuild-bin';

if (fs.existsSync(sourceEsbuild)) {
  try {
    fs.copyFileSync(sourceEsbuild, tmpEsbuild);
    fs.chmodSync(tmpEsbuild, 0o755);
    process.env.ESBUILD_BINARY_PATH = tmpEsbuild;
  } catch (err) {
    console.warn('Aviso al preparar binario esbuild en /tmp:', err.message);
  }
}

const { createServer, build } = await import('vite');

if (mode === 'build') {
  await build({
    root: __dirname,
  });
} else {
  const server = await createServer({
    root: __dirname,
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
  });
  await server.listen();
  server.printUrls();
}
