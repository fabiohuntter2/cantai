import { timingSafeEqual } from 'node:crypto';
import { listPedidos } from '@/lib/store';
import { config, modoDemo } from '@/lib/config';
import { json, erro } from '@/lib/http';

export const dynamic = 'force-dynamic';

function senhaOk(dada, certa) {
  const a = Buffer.from(String(dada));
  const b = Buffer.from(String(certa));
  return a.length === b.length && timingSafeEqual(a, b);
}

// Lista os pedidos para o dono do app (página /admin)
export async function GET(req) {
  const { adminSenha } = config();
  if (!adminSenha) return erro('Defina ADMIN_SENHA nas variáveis de ambiente para usar o painel.', 403);
  const dada = (req.headers.get('authorization') || '').replace(/^Senha /, '');
  if (!senhaOk(dada, adminSenha)) return erro('Senha incorreta.', 401);
  const pedidos = await listPedidos(200);
  return json({
    demo: modoDemo(),
    pedidos: pedidos.map((p) => ({
      id: p.id,
      criadoEm: p.criadoEm,
      status: p.status,
      nome: p.briefing?.nome,
      ocasiao: p.briefing?.ocasiao,
      estilo: p.briefing?.estilo,
      email: p.contato?.email || '',
      whatsapp: p.contato?.whatsapp || '',
      pagamentoId: p.pagamento?.id || '',
      erro: p.erro || '',
      musicas: p.musicas || [],
    })),
  });
}
