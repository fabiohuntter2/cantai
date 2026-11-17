// Etapa que roda depois do pagamento: gera 2 versões da música e salva.
import { getPedido, updatePedido, lock, unlock } from './store';
import { gerarAudio } from './musica';
import { salvarAudio } from './arquivos';
import { consultarPagamento } from './pagamento';
import { config } from './config';

const VERSOES = 2;
const TEMPO_MAX_MS = 290 * 1000;

export async function marcarPago(pedidoId, pagamentoId) {
  return updatePedido(pedidoId, (p) => {
    if (['aguardando_pagamento', 'letra'].includes(p.status)) {
      p.status = 'pago';
      p.pagoEm = new Date().toISOString();
      if (pagamentoId) p.pagamento = { ...(p.pagamento || {}), id: pagamentoId, status: 'approved' };
    }
    return p;
  });
}

// Confere no Mercado Pago se um pedido aguardando já foi pago
export async function conferirPagamento(p) {
  if (p.status !== 'aguardando_pagamento' || !p.pagamento?.id || !config().mpToken) return p;
  const pg = await consultarPagamento(p.pagamento.id);
  if (pg && pg.status === 'approved' && pg.pedidoId === p.id) return marcarPago(p.id, pg.id);
  return p;
}

// Diz se o pedido precisa (re)começar a geração
export function precisaGerar(p) {
  if (p.status === 'pago') return true;
  if (p.status === 'gerando' && p.gerandoDesde) {
    return Date.now() - Date.parse(p.gerandoDesde) > TEMPO_MAX_MS + 30000;
  }
  return false;
}

export async function gerarMusicas(pedidoId) {
  if (!(await lock(`gerar:${pedidoId}`, 300))) return;
  try {
    const p = await getPedido(pedidoId);
    if (!p || !precisaGerar(p)) return;
    const tentativas = (p.tentativas || 0) + 1;
    if (tentativas > 3) {
      await updatePedido(pedidoId, (x) => ({ ...x, status: 'erro', erro: 'Não conseguimos gerar a música. Nossa equipe vai entrar em contato.' }));
      return;
    }
    await updatePedido(pedidoId, (x) => ({ ...x, status: 'gerando', gerandoDesde: new Date().toISOString(), tentativas }));

    const resultados = await Promise.allSettled(
      Array.from({ length: VERSOES }, async (_, i) => {
        const buf = await gerarAudio(p.briefing, p.letra);
        if (!buf) return `/api/demo-audio?v=${i + 1}`;
        return salvarAudio(pedidoId, i + 1, buf);
      })
    );
    const urls = resultados.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const falhas = resultados.filter((r) => r.status === 'rejected').map((r) => String(r.reason?.message || r.reason));

    await updatePedido(pedidoId, (x) => {
      if (urls.length) {
        x.status = 'pronta';
        x.musicas = urls.map((url, i) => ({ versao: i + 1, url }));
        x.prontaEm = new Date().toISOString();
        x.erro = null;
      } else {
        // volta para "pago" para tentar de novo na próxima consulta
        x.status = 'pago';
        x.erro = falhas.join(' | ');
      }
      return x;
    });
  } catch (e) {
    console.error('Falha na geração', pedidoId, e);
    await updatePedido(pedidoId, (x) => ({ ...x, status: 'pago', erro: String(e.message || e) }));
  } finally {
    await unlock(`gerar:${pedidoId}`);
  }
}

// O que o navegador do cliente pode ver
export function pedidoPublico(p) {
  return {
    id: p.id,
    status: p.status,
    briefing: p.briefing,
    letra: p.letra,
    versoesLetra: p.versoesLetra,
    pix: p.status === 'aguardando_pagamento' && p.pagamento ? { qr: p.pagamento.qr, qrBase64: p.pagamento.qrBase64, ticketUrl: p.pagamento.ticketUrl } : null,
    musicas: p.status === 'pronta' ? p.musicas : [],
    gerandoDesde: p.gerandoDesde || null,
    erro: p.status === 'erro' ? p.erro : null,
  };
}
