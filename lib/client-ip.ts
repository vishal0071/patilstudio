/**
 * The client's IP address, as trustworthily as this deployment allows.
 *
 * **Takes the LAST entry of `X-Forwarded-For`, not the first.** Traefik *appends* the
 * connecting peer's address to whatever the client already sent, so on a request carrying
 * a forged `X-Forwarded-For: 1.2.3.4` the header arrives as `1.2.3.4, <real client>`.
 * Reading `[0]` therefore returns a value the attacker chose — which made both rate
 * limiters in this project bypassable by rotating one header. That mattered most for the
 * admin login limiter, where it defeated brute-force lockout entirely.
 *
 * The last entry is the one added by the proxy immediately in front of this container, so
 * it is the only entry that is not attacker-controlled — correct for exactly one proxy
 * hop, which is this deployment (Traefik → container).
 *
 * **If another proxy or a CDN is ever put in front of Traefik, this becomes wrong again**
 * and must count back by the number of trusted hops instead.
 */
/**
 * How many proxies sit in front of this container, each appending one hop. One (Traefik)
 * for this deployment. Raise it if a CDN is ever put in front of Traefik.
 */
function trustedHops(): number {
  const configured = Number(process.env.TRUSTED_PROXY_HOPS ?? '1');
  return Number.isInteger(configured) && configured >= 0 ? configured : 1;
}

export function clientIp(headers: Headers | { get(name: string): string | null }): string {
  const hops = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((hop) => hop.trim())
    .filter(Boolean);

  const trusted = trustedHops();

  // Count back by the number of proxies we trust. With one hop that is the last entry —
  // the one Traefik appended. Anything to the left of it was supplied by the caller.
  if (hops.length >= trusted && trusted > 0) {
    return hops[hops.length - trusted];
  }

  // Fewer hops than expected means the request did not come through the expected proxy
  // chain, so NOTHING in this header is trustworthy. Collapsing to a single bucket is the
  // safe failure: the limiter then throttles all such traffic together instead of handing
  // an attacker a fresh budget per forged value.
  //
  // In production this cannot happen from outside: docker-compose.yml publishes no ports
  // for this container, so the only route in is Traefik on the shared network. That is a
  // load-bearing detail — publishing a port would reopen the bypass.
  const realIp = headers.get('x-real-ip')?.trim();
  return realIp || 'unproxied';
}
