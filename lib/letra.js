// Cria a letra da música. Usa a IA da Anthropic (Claude) quando há chave;
// senão, monta uma letra de exemplo.
import { config } from './config';

const LIMITE_LINHA = 200;
const LIMITE_LINHAS_SECAO = 30;

export function limparLetra(letra) {
  const secoes = (letra?.secoes || [])
    .map((s) => ({
      nome: String(s.nome || 'Verso').slice(0, 60),
      linhas: (s.linhas || [])
        .map((l) => String(l).trim().slice(0, LIMITE_LINHA))
        .filter(Boolean)
        .slice(0, LIMITE_LINHAS_SECAO),
    }))
    .filter((s) => s.linhas.length)
    .slice(0, 10);
  return { titulo: String(letra?.titulo || 'Minha canção').slice(0, 80), secoes };
}

// Converte "[Refrão]\nlinha\nlinha" em seções, para a edição manual
export function textoParaLetra(titulo, texto) {
  const secoes = [];
  let atual = null;
  for (const bruta of String(texto || '').split('\n')) {
    const linha = bruta.trim();
    if (!linha) continue;
    const m = linha.match(/^\[(.+)\]$/);
    if (m) {
      atual = { nome: m[1], linhas: [] };
      secoes.push(atual);
    } else {
      if (!atual) {
        atual = { nome: 'Verso', linhas: [] };
        secoes.push(atual);
      }
      atual.linhas.push(linha);
    }
  }
  return limparLetra({ titulo, secoes });
}

function letraExemplo(b, versao) {
  const n = b.nome || 'você';
  const a = [
    { nome: 'Verso 1', linhas: [`${n}, hoje o dia é seu`, 'Cada sorriso que você me deu', 'Virou lembrança, virou canção', 'Guardada aqui no coração'] },
    { nome: 'Refrão', linhas: [`Canta comigo, ${n}`, 'Que a vida é bonita assim', 'Tudo aquilo que a gente viveu', 'Hoje vira música pra mim'] },
    { nome: 'Verso 2', linhas: ['Tem história que o tempo não leva', 'Tem abraço que nunca se esquece', 'E se a saudade um dia apertar', 'É só essa música tocar'] },
    { nome: 'Refrão', linhas: [`Canta comigo, ${n}`, 'Que a vida é bonita assim', 'Tudo aquilo que a gente viveu', 'Hoje vira música pra mim'] },
  ];
  const b2 = [
    { nome: 'Verso 1', linhas: ['Tem gente que chega e muda o lugar', 'Acende a casa só de entrar', `${n}, você é assim`, 'Um pedaço bom de mim'] },
    { nome: 'Refrão', linhas: [`Ô, ${n}, deixa o som tocar`, 'Essa festa é pra te celebrar', 'Se a saudade um dia apertar', 'É só essa música escutar'] },
    { nome: 'Verso 2', linhas: ['Cada passo que a gente deu', 'Cada sonho que a vida escreveu', 'Tá guardado nessa melodia', 'Pra cantar todo santo dia'] },
    { nome: 'Refrão', linhas: [`Ô, ${n}, deixa o som tocar`, 'Essa festa é pra te celebrar', 'Se a saudade um dia apertar', 'É só essa música escutar'] },
  ];
  return { titulo: `Canção para ${n}`, secoes: versao % 2 ? b2 : a };
}

const SISTEMA = `Você é um compositor brasileiro que escreve letras originais para músicas personalizadas.
Regras:
- Escreva em português do Brasil, com rima e métrica fáceis de cantar no estilo pedido.
- A letra deve ser 100% original. Nunca copie nem parafraseie letras existentes e nunca cite artistas, bandas ou músicas reais.
- Use os detalhes da história (nomes, lugares, manias, lembranças) para deixar a letra pessoal.
- Estrutura: "Verso 1" (4 linhas), "Refrão" (4 linhas), "Verso 2" (4 linhas), "Refrão" (repetido igual), e opcionalmente "Ponte" (2 a 4 linhas) e "Refrão final".
- Cada linha com no máximo 70 caracteres. Sem palavrões, sem conteúdo sexual, ofensivo, discriminatório ou que ataque alguém.
- Se o pedido for ofensivo, ilegal ou tentar ofender uma pessoa, responda apenas {"recusado": true}.
Responda SOMENTE com JSON neste formato:
{"titulo": "...", "secoes": [{"nome": "Verso 1", "linhas": ["...", "..."]}]}`;

export async function gerarLetra(briefing, versao = 0) {
  const c = config();
  if (!c.anthropicKey) return letraExemplo(briefing, versao);

  const pedido = `Ocasião: ${briefing.ocasiao}
Para quem: ${briefing.nome || '(não informado)'}
Estilo musical: ${briefing.estilo}
Voz: ${briefing.voz}
História contada pelo cliente:
"""${briefing.historia}"""
${versao > 0 ? `Esta é a versão ${versao + 1}: faça uma letra bem diferente das anteriores.` : ''}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': c.anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: c.modeloLetra,
      max_tokens: 1200,
      system: SISTEMA,
      messages: [{ role: 'user', content: pedido }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error('Erro Anthropic', res.status, t);
    throw new Error('Não foi possível criar a letra agora. Tente de novo em instantes.');
  }
  const data = await res.json();
  const texto = (data.content || []).map((b) => b.text || '').join('');
  const json = texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1);
  let obj;
  try {
    obj = JSON.parse(json);
  } catch {
    throw new Error('A letra veio num formato inesperado. Tente de novo.');
  }
  if (obj.recusado) {
    const e = new Error('Não podemos criar essa música. Reescreva a história sem conteúdo ofensivo.');
    e.status = 400;
    throw e;
  }
  const letra = limparLetra(obj);
  if (!letra.secoes.length) throw new Error('A letra veio vazia. Tente de novo.');
  return letra;
}
