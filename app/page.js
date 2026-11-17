import { config, OCASIOES } from '@/lib/config';
import { Topo } from './components';

export default function Inicio() {
  const { nomeApp, precoTexto } = config();
  return (
    <main className="container">
      <Topo nome={nomeApp} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1>Sua história vira música em minutos.</h1>
        <p className="suave" style={{ fontSize: 17 }}>
          Conte para quem é e o que aconteceu. A gente escreve a letra, compõe e entrega a música pronta para enviar no WhatsApp.
        </p>
      </div>
      <a className="botao" href="/criar">Criar minha música</a>
      <p className="suave pequeno" style={{ marginTop: -12, textAlign: 'center' }}>
        Você vê a letra antes de pagar. {precoTexto} por música, com 2 versões.
      </p>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 className="secao">Como funciona</h2>
        {[
          ['Conte a história', 'Ocasião, nome e o que você quer dizer.'],
          ['Aprove a letra', 'Não gostou? Peça outra versão ou edite à mão.'],
          ['Receba a música', 'Pague com Pix e receba 2 versões com voz e arranjo.'],
        ].map(([t, d], i) => (
          <div className="passos" key={t}>
            <div className="num">{i + 1}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{t}</div>
              <div className="suave" style={{ fontSize: 14, marginTop: 2 }}>{d}</div>
            </div>
          </div>
        ))}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 className="secao">Para toda ocasião</h2>
        <div className="chips">
          {OCASIOES.filter((o) => o !== 'Outra').map((o) => (
            <span className="tag" key={o} style={{ fontSize: 14, padding: '8px 14px' }}>{o}</span>
          ))}
        </div>
      </section>
    </main>
  );
}
