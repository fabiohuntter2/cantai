import { updatePedido, getPedido } from '@/lib/store';
import { textoParaLetra } from '@/lib/letra';
import { pedidoPublico } from '@/lib/gerar';
import { json, erro } from '@/lib/http';

// Salva a letra editada à mão pelo cliente
export async function PUT(req, { params }) {
  const { id } = await params;
  const p = await getPedido(id);
  if (!p) return erro('Pedido não encontrado.', 404);
  if (p.status !== 'letra') return erro('A letra já foi aprovada e não pode mais mudar.');
  let body;
  try {
    body = await req.json();
  } catch {
    return erro('Pedido inválido.');
  }
  const letra = textoParaLetra(body.titulo || p.letra.titulo, body.texto);
  if (!letra.secoes.length) return erro('A letra ficou vazia.');
  const novo = await updatePedido(id, (x) => ({ ...x, letra }));
  return json(pedidoPublico(novo));
}
