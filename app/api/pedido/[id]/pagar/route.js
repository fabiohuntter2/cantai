import { after } from 'next/server';
import { getPedido, updatePedido } from '@/lib/store';
import { config } from '@/lib/config';
import { criarPix } from '@/lib/pagamento';
import { marcarPago, gerarMusicas, pedidoPublico } from '@/lib/gerar';
import { json, erro, origemDe } from '@/lib/http';

export const maxDuration = 300;

// Aprova a letra e cria o Pix (ou, em modo demonstração, aprova na hora)
export async function POST(req, { params }) {
  const { id } = await params;
  const p = await getPedido(id);
  if (!p) return erro('Pedido não encontrado.', 404);
  if (!['letra', 'aguardando_pagamento'].includes(p.status)) return json(pedidoPublico(p));

  let body;
  try {
    body = await req.json();
  } catch {
    return erro('Pedido inválido.');
  }
  const email = String(body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro('Digite um e-mail válido.');
  const whatsapp = String(body.whatsapp || '').replace(/\D/g, '').slice(0, 13);

  // Modo demonstração: sem Mercado Pago, o pagamento é aprovado na hora
  if (!config().mpToken) {
    await updatePedido(id, (x) => ({ ...x, contato: { email, whatsapp } }));
    const novo = await marcarPago(id, 'demo');
    after(() => gerarMusicas(id));
    return json(pedidoPublico(novo));
  }

  try {
    const pix = await criarPix({ pedidoId: id, email, cpf: body.cpf, origem: origemDe(req) });
    const novo = await updatePedido(id, (x) => ({
      ...x,
      status: 'aguardando_pagamento',
      contato: { email, whatsapp },
      pagamento: { ...pix, email },
    }));
    return json(pedidoPublico(novo));
  } catch (e) {
    return erro(e.message, 502);
  }
}
