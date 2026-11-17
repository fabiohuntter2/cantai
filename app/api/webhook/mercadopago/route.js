import { after } from 'next/server';
import { consultarPagamento } from '@/lib/pagamento';
import { getPedido } from '@/lib/store';
import { marcarPago, gerarMusicas } from '@/lib/gerar';
import { config } from '@/lib/config';

export const maxDuration = 300;

// O Mercado Pago avisa aqui quando um pagamento muda.
// Por segurança, o app sempre confere o pagamento direto na API do Mercado Pago.
export async function POST(req) {
  if (!config().mpToken) return new Response('ok');
  const url = new URL(req.url);
  let body = {};
  try {
    body = await req.json();
  } catch {}

  const tipo = body.type || body.topic || url.searchParams.get('type') || url.searchParams.get('topic');
  const pagamentoId = body.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id');
  if (tipo && tipo !== 'payment') return new Response('ok');
  if (!pagamentoId || !/^\d+$/.test(String(pagamentoId))) return new Response('ok');

  const pg = await consultarPagamento(String(pagamentoId));
  if (pg && pg.status === 'approved' && pg.pedidoId) {
    const p = await getPedido(pg.pedidoId);
    if (p && p.pagamento?.id === pg.id) {
      await marcarPago(p.id, pg.id);
      after(() => gerarMusicas(p.id));
    }
  }
  return new Response('ok');
}

export async function GET() {
  return new Response('ok');
}
