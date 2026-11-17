import { randomUUID } from 'node:crypto';
import { gerarLetra } from '@/lib/letra';
import { getPedido, savePedido, contarUso } from '@/lib/store';
import { OCASIOES, ESTILOS, VOZES, MAX_VERSOES_LETRA } from '@/lib/config';
import { pedidoPublico } from '@/lib/gerar';
import { json, erro, ipDe } from '@/lib/http';

export const maxDuration = 60;

// Cria um pedido novo com a letra, ou gera outra versão da letra
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return erro('Pedido inválido.');
  }

  if (!(await contarUso(`letra:${ipDe(req)}`, 30, 24 * 3600))) {
    return erro('Você atingiu o limite de letras por hoje. Tente amanhã.', 429);
  }

  try {
    // Outra versão para um pedido existente
    if (body.pedidoId) {
      const p = await getPedido(body.pedidoId);
      if (!p) return erro('Pedido não encontrado.', 404);
      if (p.status !== 'letra') return erro('A letra deste pedido já foi aprovada.');
      if (p.versoesLetra >= MAX_VERSOES_LETRA) return erro(`Limite de ${MAX_VERSOES_LETRA} versões de letra atingido. Edite a letra à mão, se quiser.`);
      p.letra = await gerarLetra(p.briefing, p.versoesLetra);
      p.versoesLetra += 1;
      await savePedido(p);
      return json(pedidoPublico(p));
    }

    // Pedido novo
    const briefing = {
      ocasiao: OCASIOES.includes(body.ocasiao) ? body.ocasiao : 'Outra',
      estilo: ESTILOS.includes(body.estilo) ? body.estilo : 'Pop',
      voz: VOZES.includes(body.voz) ? body.voz : 'Feminina',
      nome: String(body.nome || '').trim().slice(0, 60),
      historia: String(body.historia || '').trim().slice(0, 1500),
    };
    if (briefing.historia.length < 20) return erro('Conte um pouco mais da história (pelo menos uma frase).');

    const letra = await gerarLetra(briefing, 0);
    const p = {
      id: randomUUID(),
      criadoEm: new Date().toISOString(),
      status: 'letra',
      briefing,
      letra,
      versoesLetra: 1,
    };
    await savePedido(p);
    return json(pedidoPublico(p));
  } catch (e) {
    console.error(e);
    return erro(e.message || 'Erro ao criar a letra.', e.status || 500);
  }
}
