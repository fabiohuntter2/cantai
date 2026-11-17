'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OCASIOES, ESTILOS, VOZES } from '@/lib/config';

function Escolha({ titulo, opcoes, valor, onChange }) {
  return (
    <div className="campo">
      <span className="rotulo" id={`r-${titulo}`}>{titulo}</span>
      <div className="chips" role="group" aria-labelledby={`r-${titulo}`}>
        {opcoes.map((o) => (
          <button type="button" key={o} className="chip" aria-pressed={valor === o} onClick={() => onChange(o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Criar() {
  const router = useRouter();
  const [f, setF] = useState({ ocasiao: 'Aniversário', estilo: 'Forró', voz: 'Feminina', nome: '', historia: '' });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (f.historia.trim().length < 20) {
      setErro('Conte um pouco mais da história (pelo menos uma frase).');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/letra', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.erro || 'Erro ao criar a letra.');
      try {
        const salvos = JSON.parse(localStorage.getItem('meusPedidos') || '[]');
        localStorage.setItem('meusPedidos', JSON.stringify([d.id, ...salvos].slice(0, 20)));
      } catch {}
      router.push(`/pedido/${d.id}`);
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  return (
    <main className="container">
      <a href="/" className="suave" style={{ textDecoration: 'none', fontSize: 15 }}>← Voltar</a>
      <h1 style={{ fontSize: 30 }}>Conte a história da música</h1>
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <Escolha titulo="Ocasião" opcoes={OCASIOES} valor={f.ocasiao} onChange={set('ocasiao')} />
        <div className="campo">
          <label htmlFor="nome">Para quem é a música?</label>
          <input id="nome" maxLength={60} value={f.nome} onChange={(e) => set('nome')(e.target.value)} placeholder="Ex.: Dona Maria" />
        </div>
        <div className="campo">
          <label htmlFor="historia">O que você quer dizer?</label>
          <textarea
            id="historia"
            rows={6}
            maxLength={1500}
            value={f.historia}
            onChange={(e) => set('historia')(e.target.value)}
            placeholder="Ex.: Minha mãe faz 60 anos. Criou três filhos sozinha, adora forró e o bolo de milho dela é famoso na família."
          />
          <span className="suave pequeno">Quanto mais detalhes (nomes, lugares, lembranças), mais pessoal fica a letra.</span>
        </div>
        <Escolha titulo="Estilo musical" opcoes={ESTILOS} valor={f.estilo} onChange={set('estilo')} />
        <Escolha titulo="Voz" opcoes={VOZES} valor={f.voz} onChange={set('voz')} />
        {erro ? <div className="erro" role="alert">{erro}</div> : null}
        <button className="botao" type="submit" disabled={enviando}>
          {enviando ? (
            <>
              <span className="spinner" aria-hidden="true" /> Escrevendo a letra…
            </>
          ) : (
            'Gerar a letra'
          )}
        </button>
        <p className="suave pequeno" style={{ textAlign: 'center' }}>Ver a letra é grátis. Você só paga se quiser a música.</p>
      </form>
    </main>
  );
}
