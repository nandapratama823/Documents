import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.mjs';
import { createRepository } from './repository.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 8765);
const host = process.env.HOST || '0.0.0.0';
const repository = await createRepository(projectRoot);
const app = createApp({ repository, projectRoot });

const server = app.listen(port, host, () => {
  console.log(`CCTV Trans Jawa running at http://127.0.0.1:${port}`);
  console.log(`Listening on ${host}:${port}`);
  console.log(`Storage: ${repository.kind}`);
});

async function shutdown() {
  server.close(async () => {
    await repository.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
