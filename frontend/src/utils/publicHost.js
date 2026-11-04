/** Hosts de túnel: distinto origen que localhost → otra sesión (localStorage). */
export function isTunnelHost(hostname = window.location.hostname) {
  const host = String(hostname).toLowerCase();
  return (
    host.endsWith('.tunnelmole.net') ||
    host.endsWith('.ngrok-free.app') ||
    host.endsWith('.ngrok.io') ||
    host.endsWith('.loca.lt')
  );
}

/**
 * Tras Wompi el redirect es HTTPS del túnel (CloudFront no acepta localhost),
 * pero la sesión vive en localhost. Rebotamos a localhost conservando path/query.
 */
export function bounceTunnelToLocalhost(localOrigin = 'http://localhost:5173') {
  if (!isTunnelHost()) return false;
  const target = `${localOrigin.replace(/\/$/, '')}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(target);
  return true;
}
