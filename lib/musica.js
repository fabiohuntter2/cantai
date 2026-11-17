// Gera o áudio da música. Usa a API de música da ElevenLabs quando há chave;
// senão, devolve null e o app usa um áudio de demonstração.
import { config } from './config';

const ESTILOS_EN = {
  'Forró': ['forró', 'brazilian northeastern music', 'accordion', 'zabumba', 'triangle', 'danceable'],
  'Sertanejo': ['sertanejo', 'brazilian country', 'acoustic guitar', 'viola caipira', 'romantic', 'warm'],
  'Pagode': ['pagode', 'samba', 'cavaquinho', 'pandeiro', 'brazilian', 'joyful'],
  'Gospel': ['brazilian gospel', 'worship', 'piano', 'uplifting', 'choir backing vocals'],
  'Pop': ['brazilian pop', 'modern pop', 'catchy', 'synths', 'punchy drums'],
  'MPB': ['mpb', 'bossa nova influence', 'acoustic guitar', 'soft', 'brazilian'],
};

function duracaoSecao(nome) {
  const n = nome.toLowerCase();
  if (n.includes('refr')) return 22000;
  if (n.includes('ponte')) return 15000;
  return 24000;
}

export function planoMusica(briefing, letra) {
  const voz = briefing.voz === 'Masculina' ? 'male vocals' : 'female vocals';
  const sections = [
    { section_name: 'Intro', positive_local_styles: ['instrumental intro'], negative_local_styles: ['vocals'], duration_ms: 8000, lines: [] },
    ...letra.secoes.map((s) => ({
      section_name: s.nome,
      positive_local_styles: s.nome.toLowerCase().includes('refr') ? ['catchy chorus', 'full band', 'memorable hook'] : ['verse', 'storytelling'],
      negative_local_styles: [],
      duration_ms: duracaoSecao(s.nome),
      lines: s.linhas,
    })),
    { section_name: 'Outro', positive_local_styles: ['instrumental outro', 'gentle ending'], negative_local_styles: ['vocals'], duration_ms: 8000, lines: [] },
  ];
  return {
    positive_global_styles: [...(ESTILOS_EN[briefing.estilo] || ESTILOS_EN.Pop), voz, 'brazilian portuguese vocals', 'clear lyrics', 'professional mix'],
    negative_global_styles: ['english lyrics', 'spanish lyrics', 'explicit'],
    sections,
  };
}

// Devolve um Buffer MP3, ou null em modo demonstração
export async function gerarAudio(briefing, letra) {
  const c = config();
  if (!c.elevenKey) return null;
  const chamar = (corpo) =>
    fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128', {
      method: 'POST',
      headers: { 'xi-api-key': c.elevenKey, 'content-type': 'application/json' },
      body: JSON.stringify({ model_id: c.modeloMusica, ...corpo }),
    });

  const plano = planoMusica(briefing, letra);
  let res = await chamar({ composition_plan: plano });

  // Se o plano detalhado for recusado, tenta de novo com um texto simples
  if (res.status === 400 || res.status === 422) {
    console.error('ElevenLabs recusou o plano, tentando com prompt simples:', await res.text());
    const textoLetra = letra.secoes.map((s) => `[${s.nome}]\n${s.linhas.join('\n')}`).join('\n\n');
    const prompt = `${plano.positive_global_styles.join(', ')}. Song in Brazilian Portuguese with exactly these lyrics:\n\n${textoLetra}`.slice(0, 4000);
    res = await chamar({ prompt, music_length_ms: 150000 });
  }
  if (!res.ok) {
    const t = await res.text();
    console.error('Erro ElevenLabs', res.status, t);
    throw new Error(`Falha ao gerar o áudio (${res.status}).`);
  }
  return Buffer.from(await res.arrayBuffer());
}
