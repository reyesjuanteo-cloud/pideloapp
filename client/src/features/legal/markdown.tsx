import type { ReactNode } from "react";

// Renderizador mínimo de markdown para los documentos legales: títulos,
// párrafos, listas, tablas, citas y negritas. Suficiente para estos textos y
// sin sumar una dependencia al paquete que descarga el usuario.
function conNegritas(texto: string, clave: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) => {
    if (parte.startsWith("**") && parte.endsWith("**")) {
      return (
        <strong key={`${clave}-${i}`} className="font-semibold text-ink">
          {parte.slice(2, -2)}
        </strong>
      );
    }
    return parte;
  });
}

export function Markdown({ texto }: { texto: string }) {
  const bloques: ReactNode[] = [];
  let lista: string[] = [];
  let tabla: string[] = [];

  const cerrarLista = () => {
    if (lista.length === 0) return;
    const items = lista;
    lista = [];
    bloques.push(
      <ul key={`l${bloques.length}`} className="flex list-disc flex-col gap-1.5 pl-5">
        {items.map((item, i) => (
          <li key={i} className="text-body font-body text-muted">
            {conNegritas(item, `li${i}`)}
          </li>
        ))}
      </ul>
    );
  };

  const cerrarTabla = () => {
    if (tabla.length === 0) return;
    const filas = tabla
      .filter((f) => !/^\|[\s|:-]+\|$/.test(f))
      .map((f) => f.split("|").slice(1, -1).map((c) => c.trim()));
    tabla = [];
    const [encabezado, ...cuerpo] = filas;
    if (!encabezado) return;
    bloques.push(
      <div key={`t${bloques.length}`} className="overflow-x-auto">
        <table className="w-full border-collapse text-caption font-body">
          <thead>
            <tr>
              {encabezado.map((c, i) => (
                <th
                  key={i}
                  className="border-b border-border px-2 py-2 text-left font-semibold text-ink"
                >
                  {conNegritas(c, `th${i}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cuerpo.map((fila, i) => (
              <tr key={i}>
                {fila.map((c, j) => (
                  <td
                    key={j}
                    className="border-b border-border px-2 py-2 align-top text-muted"
                  >
                    {conNegritas(c, `td${i}-${j}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const cerrarTodo = () => {
    cerrarLista();
    cerrarTabla();
  };

  texto.split("\n").forEach((linea, indice) => {
    const l = linea.trimEnd();

    if (l.startsWith("|")) {
      cerrarLista();
      tabla.push(l);
      return;
    }
    if (l.startsWith("- ")) {
      cerrarTabla();
      lista.push(l.slice(2));
      return;
    }
    if (/^\d+\.\s/.test(l)) {
      cerrarTabla();
      lista.push(l.replace(/^\d+\.\s/, ""));
      return;
    }

    cerrarTodo();
    if (l === "" || l === "---") return;

    if (l.startsWith("### ")) {
      bloques.push(
        <h3 key={indice} className="mt-4 font-display text-h3 font-semibold text-ink">
          {l.slice(4)}
        </h3>
      );
    } else if (l.startsWith("## ")) {
      bloques.push(
        <h2 key={indice} className="mt-6 font-display text-h2 font-semibold text-ink">
          {l.slice(3)}
        </h2>
      );
    } else if (l.startsWith("# ")) {
      bloques.push(
        <h1 key={indice} className="font-display text-display font-bold text-ink">
          {l.slice(2)}
        </h1>
      );
    } else if (l.startsWith("> ")) {
      bloques.push(
        <p
          key={indice}
          className="rounded-md border-l-4 border-accent bg-accent/10 p-3 text-body font-body text-ink"
        >
          {conNegritas(l.slice(2), `q${indice}`)}
        </p>
      );
    } else {
      bloques.push(
        <p key={indice} className="text-body font-body leading-relaxed text-muted">
          {conNegritas(l, `p${indice}`)}
        </p>
      );
    }
  });

  cerrarTodo();
  return <div className="flex flex-col gap-3">{bloques}</div>;
}
