export function IconeNota({ cor = '#1A1206', tamanho = 20 }) {
  return (
    <svg aria-hidden="true" width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export function Topo({ nome }) {
  return (
    <a href="/" className="topo">
      <span className="logo">
        <IconeNota />
      </span>
      <span className="marca">{nome}</span>
    </a>
  );
}
