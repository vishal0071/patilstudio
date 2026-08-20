/**
 * Inline SVGs. No icon library: the whole site needs fourteen glyphs, and a
 * dependency for that costs more bytes than the glyphs do.
 *
 * All of them inherit `currentColor` and are sized by the caller's className.
 */

type IconProps = { className?: string };

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function ApertureIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v7.5M20.8 7.5l-6.5 3.8M20.8 16.5l-6.5-3.8M12 21v-7.5M3.2 16.5l6.5-3.8M3.2 7.5l6.5 3.8" />
    </svg>
  );
}

export function HeartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M12 20.5s-7.5-4.6-7.5-9.8A4.2 4.2 0 0 1 12 8.2a4.2 4.2 0 0 1 7.5 2.5c0 5.2-7.5 9.8-7.5 9.8Z" />
    </svg>
  );
}

export function FilmIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="1.5" />
      <path d="M7.5 4.5v15M16.5 4.5v15M2.5 9.5h5M2.5 14.5h5M16.5 9.5h5M16.5 14.5h5" />
    </svg>
  );
}

export function TeamIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3 20c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5" />
      <path d="M16 5.7a3.2 3.2 0 0 1 0 5.6M17.5 14.9c2 .8 3.5 2.7 3.5 5.1" />
    </svg>
  );
}

export function CompassIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.9 9.1l-1.6 4.2-4.2 1.6 1.6-4.2 4.2-1.6Z" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M8.5 5.6a.9.9 0 0 1 1.36-.78l8.1 5.4a.9.9 0 0 1 0 1.56l-8.1 5.4a.9.9 0 0 1-1.36-.78V5.6Z" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M5 9l7 7 7-7" />
    </svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95L12 2.6Z" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M4.5 12.5l4.5 4.5L19.5 6.5" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.16-1.35a9.94 9.94 0 0 0 4.88 1.27c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2Zm0 18.2c-1.6 0-3.17-.43-4.54-1.24l-.33-.2-3.06.8.82-3-.21-.34a8.23 8.23 0 0 1-1.26-4.36c0-4.55 3.7-8.25 8.25-8.25s8.25 3.7 8.25 8.25-3.7 8.25-8.25 8.25Zm4.53-6.16c-.25-.13-1.47-.72-1.7-.8-.22-.09-.39-.13-.55.12-.16.25-.63.8-.77.96-.14.17-.28.19-.53.06a6.75 6.75 0 0 1-1.98-1.22 7.44 7.44 0 0 1-1.37-1.7c-.14-.25-.02-.39.11-.52.11-.11.25-.3.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.44-.06-.13-.55-1.34-.76-1.83-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.25-.84.83-.84 2.02s.86 2.35.98 2.51c.12.17 1.7 2.6 4.11 3.55 2.02.79 2.42.64 2.86.6.44-.04 1.42-.58 1.62-1.15.2-.56.2-1.05.14-1.15-.06-.1-.22-.16-.47-.29Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M13.5 21v-7.3h2.5l.4-2.9h-2.9V8.9c0-.84.23-1.41 1.44-1.41h1.54V4.9c-.27-.04-1.2-.11-2.28-.11-2.26 0-3.8 1.38-3.8 3.9v2.11H7.9v2.9h2.5V21h3.1Z" />
    </svg>
  );
}

export function YouTubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M21.2 7.4a2.6 2.6 0 0 0-1.83-1.84C17.75 5.1 12 5.1 12 5.1s-5.75 0-7.37.46A2.6 2.6 0 0 0 2.8 7.4C2.35 9 2.35 12 2.35 12s0 3 .45 4.6a2.6 2.6 0 0 0 1.83 1.84c1.62.46 7.37.46 7.37.46s5.75 0 7.37-.46a2.6 2.6 0 0 0 1.83-1.84c.45-1.6.45-4.6.45-4.6s0-3-.45-4.6ZM10.2 15.1V8.9l5.2 3.1-5.2 3.1Z" />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M6.2 3.5h3l1.5 3.8-2 1.4a10.5 10.5 0 0 0 6.6 6.6l1.4-2 3.8 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <rect x="2.8" y="5" width="18.4" height="14" rx="1.5" />
      <path d="M3.5 6.5 12 13l8.5-6.5" />
    </svg>
  );
}

export function PinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
      <path d="M12 21s6.5-6.1 6.5-10.4A6.5 6.5 0 0 0 5.5 10.6C5.5 14.9 12 21 12 21Z" />
      <circle cx="12" cy="10.4" r="2.4" />
    </svg>
  );
}

export const VALUE_ICONS = {
  heart: HeartIcon,
  film: FilmIcon,
  team: TeamIcon,
  compass: CompassIcon,
} as const;
