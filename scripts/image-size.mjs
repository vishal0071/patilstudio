/**
 * Reads pixel dimensions straight out of an image file's header.
 *
 * Hand-rolled rather than pulling in `sharp` or `image-size`: the importer needs two
 * integers per file, `sharp` is a ~30MB native dependency that would then have to build
 * inside the Docker image for no runtime benefit, and this project has kept its
 * dependency list to Next, React, Tailwind and Prisma on purpose.
 *
 * JPEG, PNG and WebP only — that covers every photographer's export. Anything else is
 * reported as unsupported rather than guessed at, because a wrong ratio silently crops
 * the frame badly on the live site.
 */

export function readImageSize(buffer) {
  return png(buffer) ?? jpeg(buffer) ?? webp(buffer) ?? null;
}

function png(b) {
  // \x89PNG\r\n\x1a\n then IHDR: width and height are big-endian u32 at 16 and 20.
  if (b.length < 24) return null;
  if (b.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), format: 'png' };
}

function jpeg(b) {
  if (b.length < 4 || b.readUInt16BE(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 9 < b.length) {
    if (b[offset] !== 0xff) {
      // Not on a marker boundary — resync rather than bail, some encoders pad.
      offset += 1;
      continue;
    }
    const marker = b[offset + 1];
    // SOF0-SOF15 carry the frame dimensions; DHT (c4), JPG (c8) and DAC (cc) do not.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return {
        height: b.readUInt16BE(offset + 5),
        width: b.readUInt16BE(offset + 7),
        format: 'jpg',
      };
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2; // Standalone markers carry no length field.
      continue;
    }
    const length = b.readUInt16BE(offset + 2);
    if (length < 2) return null;
    offset += 2 + length;
  }
  return null;
}

function webp(b) {
  if (b.length < 30) return null;
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;

  const chunk = b.toString('ascii', 12, 16);

  if (chunk === 'VP8X') {
    // Extended format: canvas size minus one, 24-bit little-endian each.
    return {
      width: (b.readUIntLE(24, 3) & 0xffffff) + 1,
      height: (b.readUIntLE(27, 3) & 0xffffff) + 1,
      format: 'webp',
    };
  }

  if (chunk === 'VP8 ') {
    // Lossy: 14 bits each, after the 3-byte start code 9d 01 2a.
    const start = b.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), 20);
    if (start === -1) return null;
    return {
      width: b.readUInt16LE(start + 3) & 0x3fff,
      height: b.readUInt16LE(start + 5) & 0x3fff,
      format: 'webp',
    };
  }

  if (chunk === 'VP8L') {
    // Lossless: 14 bits each, packed across bytes after the 0x2f signature byte.
    const bits = b.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
      format: 'webp',
    };
  }

  return null;
}

/**
 * Maps an aspect ratio onto the four crops the design uses.
 *
 * The frame is `object-cover`, so a mismatch does not distort the photograph — it crops
 * it. Getting this right from the file means a 3:2 landscape is not silently
 * centre-cropped into a 4:5 portrait slot and beheaded.
 */
export function classifyRatio(width, height) {
  const r = width / height;
  if (r > 1.2) return 'landscape'; // 3:2 = 1.50
  if (r >= 0.9) return 'square'; // 1:1
  if (r > 0.72) return 'portrait'; // 4:5 = 0.80
  return 'tall'; // 2:3 = 0.67
}
