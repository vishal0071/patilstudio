/**
 * Identifies an image by its actual bytes.
 *
 * The upload route previously keyed its extension allow-list off `File.type`, which is
 * whatever the browser (or a script) *claims* the Content-Type is — so any bytes at all
 * could be stored as `.png` by asserting `image/png`. The consequences were bounded (the
 * media route serves a fixed Content-Type with `nosniff`, so nothing could be served as
 * HTML or script) but the check was decorative, and this makes it real.
 *
 * Magic bytes only — no decoding, no dependency. Four formats, which is all the site
 * accepts.
 */

export type SniffedFormat = 'jpg' | 'png' | 'webp' | 'avif';

export function sniffImageFormat(bytes: Uint8Array): SniffedFormat | null {
  if (bytes.length < 16) return null;

  // JPEG: SOI marker.
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';

  // PNG: 8-byte signature.
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }

  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.subarray(start, end));

  // WebP: RIFF container with a WEBP form type.
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';

  // AVIF: ISO-BMFF `ftyp` box whose brand is avif/avis. The brand can also appear in the
  // compatible-brands list, so check the first two slots.
  if (ascii(4, 8) === 'ftyp') {
    const brands = [ascii(8, 12), ascii(16, 20)];
    if (brands.some((brand) => brand === 'avif' || brand === 'avis')) return 'avif';
  }

  return null;
}
