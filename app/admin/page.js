'use client';

import { useState } from 'react';

const NOMES = {
  letra: 'Vendo a letra',
  aguardando_pagamento: 'Aguardando Pix',
  pago: 'Pago (na fila)',
  gerando: 'Gerando',
  pronta: 'Entregue',
  erro: 'Erro',
};

export default function Admin() {
  const [senha, setSenha] = useState('');
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');

  async function entrar(e) {
    e?.preventDefault();
    setErro('');
    const res = await fetch('/api/admin', { headers: { Authorization: `Senha ${senha}` }, cache: 'no-store' });
    const d = await res.json();
    if (!res.ok) return setErro(d.erro);
    setDados(d);
  }

  if (!dados) {
    return (
      <main className="container">
        <h1 style={{ fontSize: 28 }}>Painel</h1>
        <form onSubmit={entrar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
          {erro ? <div className="erro">{erro}</div> : null}
          <button className="botao" type="submit">Entrar</button>
        </form>
      </main>
    );
  }

  const pedidos = dados.pedidos;
  const vendidos = pedidos.filter((p) => ['pago', 'gerando', 'pronta', 'erro'].includes(p.status)).length;
  return (
    <main className="container" style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 28 }}>Pedidos</h1>
        <button className="botao secundario" style={{ width: 'auto' }} onClick={entrar}>Atualizar</button>
      </div>
      <p className="suave">{pedidos.length} pedidos recentes · {vendidos} pagos</p>
      <div className="tabela">
        <table>
          <thead>
            <tr><th>Data</th><th>Status</th><th>Para</th><th>Estilo</th><th>Contato</th><th>Pedido</th></tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.criadoEm).toLocaleString('pt-BR')}</td>
                <td>{NOMES[p.status] || p.status}{p.erro ? <div style={{ color: 'var(--erro)' }}>{p.erro}</div> : null}</td>
                <td>{p.nome || '—'}<div className="suave">{p.ocasiao}</div></td>
                <td>{p.estilo}</td>
                <td>{p.email}<div className="suave">{p.whatsapp}</div></td>
                <td><a href={`/pedido/${p.id}`} target="_blank" rel="noreferrer">abrir</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
