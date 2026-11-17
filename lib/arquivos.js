// Salva os MP3 gerados. Usa Vercel Blob quando configurado;
// senão, guarda na memória (só para testes).
import { put } from '@vercel/blob';
import { config } from './config';

const mem = globalThis.__cantaiAudio || (globalThis.__cantaiAudio = new Map());

export async function salvarAudio(pedidoId, versao, buffer) {
  const c = config();
  if (c.blobToken) {
    const blob = await put(`musicas/${pedidoId}-v${versao}.mp3`, buffer, {
      access: 'public',
      contentType: 'audio/mpeg',
      addRandomSuffix: true,
      token: c.blobToken,
    });
    return blob.url;
  }
  mem.set(`${pedidoId}-${versao}`, buffer);
  return `/api/audio/${pedidoId}/${versao}`;
}

export function audioDaMemoria(pedidoId, versao) {
  return mem.get(`${pedidoId}-${versao}`) || null;
}
