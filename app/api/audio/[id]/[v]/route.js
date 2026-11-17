import { audioDaMemoria } from '@/lib/arquivos';

// Só usado quando o Vercel Blob não está configurado
export async function GET(req, { params }) {
  const { id, v } = await params;
  const buf = audioDaMemoria(id, v);
  if (!buf) return new Response('Áudio não encontrado', { status: 404 });
  return new Response(buf, { headers: { 'Content-Type': 'audio/mpeg', 'Content-Disposition': `inline; filename="musica-v${v}.mp3"` } });
}
