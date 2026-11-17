// Pagamento por Pix no Mercado Pago.
import { config } from './config';

const API = 'https://api.mercadopago.com/v1/payments';

export async function criarPix({ pedidoId, email, cpf, origem }) {
  const c = config();
  const body = {
    transaction_amount: c.preco,
    description: `Música personalizada - ${c.nomeApp}`,
    payment_method_id: 'pix',
    external_reference: pedidoId,
    payer: { email },
  };
  const doc = String(cpf || '').replace(/\D/g, '');
  if (doc.length === 11) body.payer.identification = { type: 'CPF', number: doc };
  if (origem && origem.startsWith('https://')) body.notification_url = `${origem}/api/webhook/mercadopago`;

  const res = await fetch(API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.mpToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `${pedidoId}-${email}-${doc}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Erro Mercado Pago', res.status, JSON.stringify(data));
    throw new Error('Não foi possível gerar o Pix agora. Confira o e-mail e tente de novo.');
  }
  const t = data.point_of_interaction?.transaction_data || {};
  return {
    id: String(data.id),
    status: data.status,
    qr: t.qr_code || '',
    qrBase64: t.qr_code_base64 || '',
    ticketUrl: t.ticket_url || '',
  };
}

export async function consultarPagamento(id) {
  const c = config();
  const res = await fetch(`${API}/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${c.mpToken}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error('Erro ao consultar pagamento', res.status);
    return null;
  }
  const d = await res.json();
  return { id: String(d.id), status: d.status, pedidoId: d.external_reference, valor: d.transaction_amount };
}
