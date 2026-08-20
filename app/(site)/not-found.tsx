import Link from 'next/link';
import { ArrowRightIcon } from '@/components/ui/icons';

export default function NotFound() {
  return (
    <div className="flex min-h-[80svh] items-center bg-ink text-ivory">
      <div className="shell py-32 text-center">
        <p className="eyebrow text-gold">404</p>
        <h1 className="display-1 mx-auto mt-6 max-w-[22ch]">
          This frame doesn&apos;t exist.
        </h1>
        <p className="lede mx-auto mt-5 max-w-[42ch] text-ivory/60">
          The page you were looking for has moved or was never here. The work is all
          still where you left it.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/" className="btn btn-gold">
            Back Home
          </Link>
          <Link href="/portfolio" className="btn btn-outline-light">
            View Portfolio
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
