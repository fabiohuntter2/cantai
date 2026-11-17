// Lê as configurações das variáveis de ambiente.
// Quando uma chave falta, aquela parte roda em modo demonstração.

const env = (k) => (process.env[k] || '').trim();

export function config() {
  const redisUrl = env('KV_REST_API_URL') || env('UPSTASH_REDIS_REST_URL');
  const redisToken = env('KV_REST_API_TOKEN') || env('UPSTASH_REDIS_REST_TOKEN');
  const preco = Number(env('PRECO_MUSICA').replace(',', '.')) || 19.9;
  return {
    nomeApp: env('NOME_DO_APP') || 'Cantaí',
    preco,
    precoTexto: preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    emailSuporte: env('EMAIL_SUPORTE'),
    adminSenha: env('ADMIN_SENHA'),
    anthropicKey: env('ANTHROPIC_API_KEY'),
    modeloLetra: env('MODELO_LETRA') || 'claude-haiku-5-5',
    elevenKey: env('ELEVENLABS_API_KEY'),
    modeloMusica: env('MODELO_MUSICA') || 'music_v1',
    mpToken: env('MERCADOPAGO_ACCESS_TOKEN'),
    redisUrl,
    redisToken,
    blobToken: env('BLOB_READ_WRITE_TOKEN'),
  };
}

// Quais partes estão em modo demonstração
export function modoDemo() {
  const c = config();
  return {
    letra: !c.anthropicKey,
    musica: !c.elevenKey,
    pagamento: !c.mpToken,
    banco: !(c.redisUrl && c.redisToken),
    arquivos: !c.blobToken,
  };
}

export function algumDemo() {
  return Object.values(modoDemo()).some(Boolean);
}

export const OCASIOES = ['Aniversário', 'Declaração de amor', 'Homenagem', 'Casamento', 'Louvor', 'Outra'];
export const ESTILOS = ['Forró', 'Sertanejo', 'Pagode', 'Gospel', 'Pop', 'MPB'];
export const VOZES = ['Feminina', 'Masculina'];
export const MAX_VERSOES_LETRA = 5;
