import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import './globals.css';
import { config, modoDemo, algumDemo } from '@/lib/config';


export function generateMetadata() {
  const { nomeApp } = config();
  return {
    title: `${nomeApp} — sua história vira música`,
    description: 'Conte a história, aprove a letra e receba uma música personalizada feita com inteligência artificial.',
  };
}

export const viewport = { themeColor: '#12101C', width: 'device-width', initialScale: 1 };

function BannerDemo() {
  if (!algumDemo()) return null;
  const d = modoDemo();
  const partes = [
    d.letra && 'letra',
    d.musica && 'música',
    d.pagamento && 'pagamento',
    d.banco && 'banco de dados',
    d.arquivos && 'arquivos',
  ].filter(Boolean);
  return (
    <div style={{ maxWidth: 560, margin: '12px auto 0', padding: '0 20px' }}>
      <div className="aviso">
        <strong>Modo demonstração:</strong> {partes.join(', ')} ainda sem chave configurada. Nada é cobrado e o áudio é de exemplo.
      </div>
    </div>
  );
}

export default function RootLayout({ children }) {
  const { nomeApp, emailSuporte } = config();
  return (
    <html lang="pt-BR">
      <body>
        <BannerDemo />
        {children}
        <footer className="rodape">
          {nomeApp} · <a href="/termos">Termos e privacidade</a>
          {emailSuporte ? (
            <>
              {' '}· <a href={`mailto:${emailSuporte}`}>Suporte</a>
            </>
          ) : null}
        </footer>
      </body>
    </html>
  );
}
