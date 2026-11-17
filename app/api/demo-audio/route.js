// Áudio de demonstração: uma melodia curta sintetizada na hora (WAV).
// Aparece só quando a chave da ElevenLabs não está configurada.

const NOTAS = {
  1: [262, 330, 392, 523, 392, 330, 349, 440, 523, 440, 392, 330, 294, 330, 262, 262],
  2: [392, 440, 494, 587, 494, 440, 392, 330, 349, 392, 440, 392, 349, 330, 294, 262],
};

export async function GET(req) {
  const v = new URL(req.url).searchParams.get('v') === '2' ? 2 : 1;
  const taxa = 22050;
  const durNota = 0.32;
  const notas = NOTAS[v];
  const total = Math.floor(taxa * durNota * notas.length);
  const buf = Buffer.alloc(44 + total * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + total * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(taxa, 24);
  buf.writeUInt32LE(taxa * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(total * 2, 40);
  const porNota = Math.floor(taxa * durNota);
  for (let i = 0; i < total; i++) {
    const f = notas[Math.min(notas.length - 1, Math.floor(i / porNota))];
    const t = (i % porNota) / taxa;
    const env = Math.min(1, t * 40) * Math.exp(-3.5 * t);
    const s = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * env * 0.35;
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return new Response(buf, { headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'public, max-age=86400' } });
}
