"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { guardarPerfilCliente, type Sexo } from "./perfil-cliente";

const opcionesSexo: { valor: Sexo; etiqueta: string }[] = [
  { valor: "masculino", etiqueta: "Hombre" },
  { valor: "femenino", etiqueta: "Mujer" },
  { valor: "otro", etiqueta: "Prefiero no decir" },
];

export function DatosCliente() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [sexo, setSexo] = useState<Sexo | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function continuar() {
    const e: Record<string, string> = {};
    if (nombre.trim().split(/\s+/).length < 2) {
      e.nombre = "Escribe tu nombre y tu apellido.";
    }
    if (!sexo) e.sexo = "Elige una opción.";
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setGuardando(true);
    const r = await guardarPerfilCliente({ nombre: nombre.trim(), sexo: sexo! });
    setGuardando(false);
    if (!r.ok) {
      setErrores({ envio: r.error ?? "No se pudo guardar. Inténtalo de nuevo." });
      return;
    }
    router.replace("/mapa");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-5 py-6">
      <h1 className="mt-2 font-display text-h2 font-semibold text-ink">
        Cuéntanos de ti
      </h1>
      <p className="mt-1 text-body font-body text-muted">
        Así el mensajero sabe a quién le entrega.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <Input
          label="Nombre completo"
          name="nombre"
          autoFocus
          autoComplete="name"
          placeholder="Juan Camilo Reyes"
          icon={<User className="size-4" />}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          error={errores.nombre}
        />

        <div className="flex flex-col gap-1.5">
          <p className="text-label font-semibold uppercase tracking-wide text-muted font-body">
            Sexo
          </p>
          <div className="flex flex-wrap gap-2">
            {opcionesSexo.map(({ valor, etiqueta }) => (
              <Chip key={valor} active={sexo === valor} onClick={() => setSexo(valor)}>
                {etiqueta}
              </Chip>
            ))}
          </div>
          {errores.sexo && (
            <p className="text-caption text-error font-body">{errores.sexo}</p>
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2 pb-4 pt-8">
        {errores.envio && (
          <p className="text-caption text-error font-body">{errores.envio}</p>
        )}
        <Button fullWidth pending={guardando} onClick={continuar}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
