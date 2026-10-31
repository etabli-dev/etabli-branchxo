import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const destination = new URL('../public/', import.meta.url);
await mkdir(destination, { recursive: true });
await copyFile(require.resolve('canvaskit-wasm/bin/full/canvaskit.wasm'), new URL('canvaskit.wasm', destination));
