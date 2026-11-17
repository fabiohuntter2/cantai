'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

const ACOMPANHAR = ['aguardando_pagamento', 'pago', 'gerando'];

function letraParaTexto(letra) {
  return letra.secoes.map((s) => `[${s.nome}]\n${s.linhas.join('\n')}`).join('\n\n');
}

function Letra({ letra }) {
  return (
    <div className="card">
      {letra.secoes.map((s, i) => (
        <div key={i}>
          <div className="secao-letra">{s.nome}</div>
          {s.linhas.map((l, j) => (
            <div className="verso" key={j}>{l}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Tags({ b }) {
  return (
    <div className="chips">
      <span className="tag">{b.ocasiao}</span>
      <span className="tag">{b.estilo}</span>
      <span className="tag">Voz {b.voz.toLowerCase()}</span>
    </div>
  );
}

export default function Pedido() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState('');
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState('');
  const [pagando, setPagando] = useState(false);
  const [contato, setContato] = useState({ email: '', whatsapp: '', cpf: '' });
  const [copiado, setCopiado] = useState(false);
  const [agora, setAgora] = useState(Date.now());
  const timer = useRef(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch(`/api/pedido/${id}`, { cache: 'no-store' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.erro || 'Pedido não encontrado.');
      setP(d);
    } catch (e) {
      setErro(e.message);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Acompanha o pagamento e a geração
  useEffect(() => {
    clearInterval(timer.current);
    if (p && ACOMPANHAR.includes(p.status)) {
      timer.current = setInterval(() => {
        setAgora(Date.now());
        carregar();
      }, 4000);
    }
    return () => clearInterval(timer.current);
  }, [p?.status, carregar]);

  async function chamar(url, opcoes, rotulo) {
    setErro('');
    setOcupado(rotulo);
    try {
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opcoes });
      const d = await res.json();
      if (!res.ok) throw new Error(d.erro || 'Algo deu errado.');
      setP(d);
      return d;
    } catch (e) {
      setErro(e.message);
      return null;
    } finally {
      setOcupado('');
    }
  }

  if (!p && erro) {
    return (
      <main className="container">
        <div className="erro">{erro}</div>
        <a className="botao" href="/criar">Criar uma música</a>
      </main>
    );
  }
  if (!p) {
    return (
      <main className="container" style={{ alignItems: 'center', paddingTop: 80 }}>
        <span className="spinner" aria-label="Carregando" />
      </main>
    );
  }

  const b = p.briefing;
  const erroBox = erro ? <div className="erro" role="alert">{erro}</div> : null;

  // 1. Letra pronta: aprovar, refazer ou editar
  if (p.status === 'letra') {
    return (
      <main className="container">
        <a href="/criar" className="suave" style={{ textDecoration: 'none', fontSize: 15 }}>← Nova história</a>
        <h1 style={{ fontSize: 30 }}>{p.letra.titulo}</h1>
        <Tags b={b} />
        {editando ? (
          <div className="campo">
            <label htmlFor="letra">Edite a letra (mantenha os títulos entre colchetes)</label>
            <textarea id="letra" rows={18} value={texto} onChange={(e) => setTexto(e.target.value)} />
            <div className="linha2">
              <button className="botao secundario" type="button" onClick={() => setEditando(false)}>Cancelar</button>
              <button
                className="botao"
                type="button"
                disabled={!!ocupado}
                onClick={async () => {
                  const d = await chamar(`/api/pedido/${id}/letra`, { method: 'PUT', body: JSON.stringify({ texto }) }, 'salvar');
                  if (d) setEditando(false);
                }}
              >
                Salvar letra
              </button>
            </div>
          </div>
        ) : (
          <Letra letra={p.letra} />
        )}
        {erroBox}
        {!editando && !pagando ? (
          <>
            <div className="linha2">
              <button
                className="botao secundario"
                type="button"
                disabled={!!ocupado}
                onClick={() => chamar('/api/letra', { method: 'POST', body: JSON.stringify({ pedidoId: id }) }, 'refazer')}
              >
                {ocupado === 'refazer' ? 'Escrevendo…' : 'Outra versão'}
              </button>
              <button
                className="botao secundario"
                type="button"
                onClick={() => {
                  setTexto(letraParaTexto(p.letra));
                  setEditando(true);
                }}
              >
                Editar à mão
              </button>
            </div>
            <button className="botao" type="button" onClick={() => setPagando(true)}>Aprovar e criar a música</button>
          </>
        ) : null}
        {pagando && !editando ? (
          <form
            className="card"
            style={{ gap: 16 }}
            onSubmit={(e) => {
              e.preventDefault();
              chamar(`/api/pedido/${id}/pagar`, { method: 'POST', body: JSON.stringify(contato) }, 'pagar');
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20 }}>Quase lá! Para onde mandamos a música?</h2>
            <div className="campo">
              <label htmlFor="email">E-mail</label>
              <input id="email" type="email" required autoComplete="email" value={contato.email} onChange={(e) => setContato({ ...contato, email: e.target.value })} />
            </div>
            <div className="campo">
              <label htmlFor="whatsapp">WhatsApp (opcional)</label>
              <input id="whatsapp" inputMode="tel" autoComplete="tel" placeholder="(85) 99999-9999" value={contato.whatsapp} onChange={(e) => setContato({ ...contato, whatsapp: e.target.value })} />
            </div>
            <div className="campo">
              <label htmlFor="cpf">CPF (opcional, para a nota do Pix)</label>
              <input id="cpf" inputMode="numeric" value={contato.cpf} onChange={(e) => setContato({ ...contato, cpf: e.target.value })} />
            </div>
            <p className="suave pequeno">
              Ao continuar, você aprova a letra acima e aceita os <a href="/termos" target="_blank">Termos de uso</a>. Depois de aprovada, a letra não muda mais.
            </p>
            <div className="linha2">
              <button className="botao secundario" type="button" onClick={() => setPagando(false)}>Voltar</button>
              <button className="botao" type="submit" disabled={!!ocupado}>{ocupado === 'pagar' ? 'Gerando Pix…' : 'Pagar com Pix'}</button>
            </div>
          </form>
        ) : null}
      </main>
    );
  }

  // 2. Aguardando o Pix
  if (p.status === 'aguardando_pagamento') {
    return (
      <main className="container">
        <h1 style={{ fontSize: 30 }}>Pague com Pix</h1>
        <p className="suave">Abra o app do seu banco, escolha Pix e leia o QR Code ou use o código copia e cola. Esta página atualiza sozinha quando o pagamento cair.</p>
        {p.pix?.qrBase64 ? <img className="qr" src={`data:image/png;base64,${p.pix.qrBase64}`} alt="QR Code do Pix" /> : null}
        {p.pix?.qr ? (
          <>
            <div className="copia">{p.pix.qr}</div>
            <button
              className="botao"
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(p.pix.qr);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 2500);
                } catch {}
              }}
            >
              {copiado ? 'Código copiado!' : 'Copiar código Pix'}
            </button>
          </>
        ) : null}
        {p.pix?.ticketUrl ? <a className="botao secundario" href={p.pix.ticketUrl} target="_blank" rel="noreferrer">Abrir página do Pix</a> : null}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="suave">
          <span className="spinner" aria-hidden="true" /> Aguardando a confirmação do pagamento…
        </div>
        {erroBox}
      </main>
    );
  }

  // 3. Criando a música
  if (p.status === 'pago' || p.status === 'gerando') {
    const decorrido = p.gerandoDesde ? (agora - Date.parse(p.gerandoDesde)) / 1000 : 0;
    const pct = Math.min(95, Math.round((decorrido / 150) * 100));
    const etapas = [
      ['Compondo a melodia', 25],
      ['Gravando a voz', 60],
      ['Mixando e finalizando', 90],
    ];
    return (
      <main className="container" style={{ paddingTop: 48 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', textAlign: 'center' }}>
          <h1 style={{ fontSize: 28 }}>Pagamento confirmado! Criando sua música…</h1>
          <p className="suave">Leva de 1 a 3 minutos. Pode deixar esta página aberta. O link dela fica salvo para você voltar depois.</p>
        </div>
        <div className="barra"><div style={{ width: `${pct}%` }} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {etapas.map(([t, lim]) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, color: pct >= lim ? 'var(--texto)' : 'var(--suave)' }}>
              <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--borda)', background: pct >= lim ? 'var(--destaque)' : 'transparent' }} />
              {t}
            </div>
          ))}
        </div>
      </main>
    );
  }

  // 4. Música pronta
  if (p.status === 'pronta') {
    const link = typeof window !== 'undefined' ? window.location.href : '';
    const zap = `https://wa.me/?text=${encodeURIComponent(`Fiz uma música especial para você: ${link}`)}`;
    return (
      <main className="container">
        <h1 style={{ fontSize: 30 }}>Sua música ficou pronta!</h1>
        <div className="capa">
          <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{b.estilo} · {b.ocasiao}</span>
          <span className="titulo">{p.letra.titulo}</span>
        </div>
        {p.musicas.map((m) => (
          <div className="card" key={m.versao} style={{ gap: 12 }}>
            <strong>Versão {m.versao}</strong>
            <audio controls preload="metadata" src={m.url} />
            <a className="botao secundario" href={m.url} download={`${p.letra.titulo} - versao ${m.versao}.mp3`} target="_blank" rel="noreferrer">Baixar versão {m.versao}</a>
          </div>
        ))}
        <a className="botao" href={zap} target="_blank" rel="noreferrer">Enviar no WhatsApp</a>
        <details>
          <summary className="suave" style={{ cursor: 'pointer' }}>Ver a letra</summary>
          <div style={{ marginTop: 12 }}><Letra letra={p.letra} /></div>
        </details>
        <a className="botao secundario" href="/criar">Criar outra música</a>
      </main>
    );
  }

  // 5. Erro
  return (
    <main className="container">
      <h1 style={{ fontSize: 28 }}>Tivemos um problema</h1>
      <div className="erro">{p.erro || 'Não foi possível concluir o pedido.'}</div>
      <p className="suave">Guarde o código do pedido: <strong>{p.id}</strong>. Fale com o suporte pelo link no fim da página.</p>
    </main>
  );
}
