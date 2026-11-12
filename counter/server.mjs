import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const stateDir = resolve(process.env.COUNTER_DATA_DIR || join(root, 'counter-state'));
const stateFile = join(stateDir, 'requests.txt');
const tempFile = join(stateDir, 'requests.tmp');
const themeUrl =
  'https://raw.githubusercontent.com/journey-ad/Moe-Counter/' +
  'ba5b1fa9758b467e4436128ca2c9708f99d2977b/assets/theme/gelbooru/';
const spriteHashes = [
  '6c348e5352a9ac920c220253fbc679721bf5a45f',
  '1c33ee35a3da29ca14d941a5da94a86f3b519016',
  'e6df16c12465cf73fee59fe8835c2e4e181a668d',
  '3ee1bcd978a3b11f87c60181a29dcf6abab23018',
  'aabf121752839a4dc6e5f3bd8d024374c69e64bb',
  '46f4940bf4b6364c36931350c9f7569e7c3a60c7',
  'cd316a0a32366a53bf5824e423f9c22381a9d018',
  '6019a72f004f5ed7737d82e4cdea810ca331f881',
  '9baa78f235304ad0a689c17a0f730b2b8808b9d5',
  '1e3f85f7252995227fc7bb23d46423e83b406d69',
];

async function loadSprite(expectedHash, digit) {
  const filename = `${digit}.gif`;
  let bytes;

  if (process.env.GELBOORU_THEME_DIR) {
    bytes = await readFile(join(process.env.GELBOORU_THEME_DIR, filename));
  } else {
    const response = await fetch(new URL(filename, themeUrl), {
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Could not load Gelbooru digit ${digit}: HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
  }

  const hash = createHash('sha1')
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest('hex');

  if (hash !== expectedHash) throw new Error(`Unexpected Gelbooru digit ${digit}`);

  return {
    width: bytes.readUInt16LE(6),
    height: bytes.readUInt16LE(8),
    url: `data:image/gif;base64,${bytes.toString('base64')}`,
  };
}

function render(count, sprites) {
  const digits = String(count).padStart(6, '0').split('');
  const usedDigits = [...new Set(digits)];
  const height = Math.max(...digits.map(digit => sprites[digit].height));
  const defs = usedDigits.map(digit => {
    const { width, height, url } = sprites[digit];
    return `    <image id="digit-${digit}" width="${width}" height="${height}" href="${url}" />`;
  });
  let width = 0;
  const parts = digits.map(digit => {
    const sprite = sprites[digit];
    const part = `  <use href="#digit-${digit}" x="${width}" y="${height - sprite.height}" />`;
    width += sprite.width;
    return part;
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title" style="image-rendering:pixelated">`,
    `  <title id="title">Profile counter: ${count} badge requests</title>`,
    '  <defs>',
    ...defs,
    '  </defs>',
    ...parts,
    '</svg>',
    '',
  ].join('\n');
}

async function readCount() {
  try {
    const value = (await readFile(stateFile, 'utf8')).trim();
    if (!/^\d+$/.test(value)) throw new Error('Invalid counter state');
    return BigInt(value);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return 0n;
  }
}

const [sprites, initialCount] = await Promise.all([
  Promise.all(spriteHashes.map(loadSprite)),
  readCount(),
]);
await mkdir(stateDir, { recursive: true });

let count = initialCount;
let pendingWrite = Promise.resolve();

function increment() {
  const update = pendingWrite.then(async () => {
    const next = count + 1n;
    await writeFile(tempFile, `${next}\n`, 'utf8');
    await rename(tempFile, stateFile);
    count = next;
    return count;
  });
  pendingWrite = update.catch(() => {});
  return update;
}

const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  const path = request.url.split('?')[0];
  if (path === '/' || path === '/healthz') {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(request.method === 'HEAD' ? undefined : 'Counter ready\n');
    return;
  }
  if (path !== '/counter.svg' && path !== '/preview.svg') {
    response.writeHead(404).end();
    return;
  }

  try {
    const currentCount = path === '/counter.svg' && request.method === 'GET'
      ? await increment()
      : count;
    response.writeHead(200, {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; img-src data:; style-src 'unsafe-inline'",
    });
    response.end(request.method === 'HEAD' ? undefined : render(currentCount, sprites));
  } catch (error) {
    console.error('Could not persist counter:', error.code || error.message);
    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Counter unavailable\n');
  }
});

const port = Number(process.env.PORT || 3000);
server.listen(port, '0.0.0.0', () => console.log(`Profile counter listening on ${server.address().port}`));
