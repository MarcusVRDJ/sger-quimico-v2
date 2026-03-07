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
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{titulo}</h2>
        {subtitulo && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitulo}</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-700">{usuarioNome}</p>
        <p className="text-xs text-gray-500">{usuarioPerfil}</p>
      </div>
    </header>
  );
}
