interface HeaderProps {
  titulo: string;
  subtitulo?: string;
  usuarioNome: string;
  usuarioPerfil: string;
}

export function Header({
  titulo,
  subtitulo,
  usuarioNome,
  usuarioPerfil,
}: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{titulo}</h2>
        {subtitulo && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitulo}</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-foreground">{usuarioNome}</p>
        <p className="text-xs text-muted-foreground">{usuarioPerfil}</p>
      </div>
    </header>
  );
}
