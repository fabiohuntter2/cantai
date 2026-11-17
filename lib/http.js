export function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function erro(msg, status = 400) {
  return json({ erro: msg }, status);
}

export function ipDe(req) {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
}

export function origemDe(req) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}
