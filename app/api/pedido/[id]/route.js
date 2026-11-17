import { after } from 'next/server';
import { getPedido } from '@/lib/store';
import { conferirPagamento, precisaGerar, gerarMusicas, pedidoPublico } from '@/lib/gerar';
import { json, erro } from '@/lib/http';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Consulta o pedido. Também confere o Pix e dispara a geração se preciso.
export async function GET(req, { params }) {
  const { id } = await params;
  let p = await getPedido(id);
  if (!p) return erro('Pedido não encontrado.', 404);

  if (p.status === 'aguardando_pagamento') p = await conferirPagamento(p);
  if (precisaGerar(p)) after(() => gerarMusicas(p.id));

  return json(pedidoPublico(p));
}
