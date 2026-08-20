import type { NextConfig } from 'next';

/**
 * Origins the video modal may frame. Named explicitly rather than allowing all of
 * `https:` — the whole value of a frame-src directive is that it is a short list.
 */
const VIDEO_FRAME_ORIGINS = [
  'https://www.youtube-nocookie.com',
  'https://www.youtube.com',
  'https://player.vimeo.com',
];

/**
 * Hosts `next/image` will optimise from, so the studio can serve photographs off a CDN
 * instead of the container's own volume. Comma-separated hostnames in IMAGE_CDN_HOSTS;
 * empty means uploads are served from this origin only.
 *
 * This has to reach the DOCKER BUILD as well as the runtime — `images` is read when the
 * build runs, and a host added only to the runtime environment is silently ignored.
 */
const imageHosts = (process.env.IMAGE_CDN_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

/**
 * Security headers, modelled on GalleryFlow's marketing site but deliberately its
 * own copy. The inquiry form posts to a route handler on this same origin, so
 * `connect-src 'self'` is sufficient.
 *
 * `headers()` is evaluated at BUILD time. If you add an external origin later
 * (analytics, a maps embed, a CDN for images), it has to be named here *and* reach the
 * Docker build, or the browser blocks it with no useful error.
 */
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      // Covers Next's hydration bootstrap and the JSON-LD block on the home page.
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      // Fonts are self-hosted from app/fonts (see app/fonts.ts) — no third-party
      // font origin is needed, and none is allowed.
      "font-src 'self' data:",
      `connect-src 'self'${process.env.NODE_ENV !== 'production' ? ' ws: wss:' : ''}`,
      // Self-hosted MP4 plays from this origin; YouTube and Vimeo need theirs named.
      "media-src 'self' https:",
      `frame-src 'self' ${VIDEO_FRAME_ORIGINS.join(' ')}`,
      'upgrade-insecure-requests',
    ].join('; '),
  },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), usb=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Development only. Next's indicator renders in a shadow root above every z-index we
  // control, and it sits exactly where the live-editor toolbar does — bottom left. Moving
  // it means the toolbar is actually clickable while developing.
  devIndicators: { position: 'bottom-right' },
  // Required by the Dockerfile's runtime stage.
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,

  images: {
    // AVIF first, WebP second, original as the last resort. On a photography site this
    // is the single largest performance lever there is.
    formats: ['image/avif', 'image/webp'],
    // Uploaded frames are large; these widths cover a 3x phone through a 5K display
    // without generating variants nothing requests.
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920, 2560, 3200],
    imageSizes: [80, 160, 240, 320, 420],
    // Every <Frame> requests q=82. Next 16 will REQUIRE the allowed qualities to be
    // declared here and rejects anything unlisted, so declaring it now keeps the upgrade
    // from silently serving unoptimised images. Warned about by the dev overlay.
    qualities: [82],
    // Optimised derivatives are immutable for a year — the source filenames are random,
    // so a changed photograph is always a new URL.
    minimumCacheTTL: 31_536_000,
    remotePatterns: imageHosts.map((hostname) => ({ protocol: 'https' as const, hostname })),
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
