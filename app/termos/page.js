import { config } from '@/lib/config';

export const metadata = { title: 'Termos de uso e privacidade' };

export default function Termos() {
  const { nomeApp, emailSuporte, precoTexto } = config();
  return (
    <main className="container" style={{ gap: 16 }}>
      <a href="/" className="suave" style={{ textDecoration: 'none' }}>← Voltar</a>
      <h1 style={{ fontSize: 28 }}>Termos de uso e privacidade</h1>
      <div className="aviso">Modelo inicial. Antes de vender, revise este texto com um advogado e preencha os campos entre colchetes.</div>
      <p><strong>Quem somos.</strong> O {nomeApp} é operado por [RAZÃO SOCIAL], CNPJ [CNPJ], com contato pelo e-mail {emailSuporte || '[E-MAIL DE SUPORTE]'}.</p>
      <p><strong>O serviço.</strong> Você conta uma história, aprova uma letra e recebe uma música criada com inteligência artificial. O valor é de {precoTexto} por música, com 2 versões de áudio. A letra é exibida antes do pagamento e não muda depois de aprovada.</p>
      <p><strong>Prazo e reembolso.</strong> A música costuma ficar pronta em poucos minutos. Se não conseguirmos entregar, devolvemos o valor pago. Como a música é feita sob encomenda e entregue na hora, pedidos de arrependimento serão analisados caso a caso, conforme o Código de Defesa do Consumidor.</p>
      <p><strong>Uso da música.</strong> Você pode ouvir, baixar e compartilhar a música para uso pessoal, inclusive em redes sociais. [DESCREVA AQUI O USO COMERCIAL PERMITIDO, DE ACORDO COM A LICENÇA DA ELEVENLABS E O SEU PLANO.]</p>
      <p><strong>O que não é permitido.</strong> Não criamos músicas com conteúdo ofensivo, discriminatório, sexual, que ataque pessoas reais, que imite artistas ou que copie letras existentes.</p>
      <p><strong>Seus dados (LGPD).</strong> Guardamos a história, a letra, seu e-mail, WhatsApp e CPF (se informado) apenas para entregar o pedido, emitir o pagamento e dar suporte. O texto da história é processado por provedores de IA (Anthropic e ElevenLabs) e o pagamento pelo Mercado Pago. Você pode pedir a exclusão dos seus dados pelo e-mail de suporte.</p>
    </main>
  );
}
