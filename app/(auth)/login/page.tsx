"use client";

import Image from "next/image";
import conecta from "@/public/conectaRH_horizontal.png";
import InputField from "@/components/InputField";
import { IdCard, LockIcon, ShieldCheck } from "lucide-react";
import SubmitButton from "@/components/SubmitButton";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCPF } from "@/lib/masks";

export default function LoginPage() {
  const [cpf, setCPF] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ocorreu um erro ao fazer login");
      }

      window.location.href = "/";
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
        alert(error.message);
      } else {
        setError("Erro interno no servidor.");
        alert("Erro interno no servidor.");
      }
      console.error("Erro ao autenticar:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="min-h-screen w-full bg-[url('/NovoLogin.png')] bg-cover bg-center bg-no-repeat
    flex justify-center items-center
    "
    >
      <div
        className="bg-white h-140 w-120 rounded-2xl shadow-xl
      flex flex-col items-center"
      >
        <div className="m-10">
          <Image
            src={conecta}
            alt="ConectaRH"
            height={190}
            width={190}
            priority
            className=" w-auto h-auto"
          />
        </div>
        <div className="w-full px-10 flex flex-col gap-1">
          <h1 className="font-semibold text-2xl">Bem vindo!</h1>
          <p className="text-sm text-stone-600">
            Acesse sua conta e continue de onde parou.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 w-full px-10 mt-5"
        >
          <div>
            <label className="text-sm font-medium">CPF</label>
            <InputField
              icon={<IdCard className="text-stone-500/50" />}
              placeholder="Insira seu CPF"
              classNameInput="text-sm"
              type="text"
              value={cpf}
              onChange={(e) => setCPF(formatCPF(e.target.value))}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Senha</label>
            <InputField
              icon={<LockIcon className="text-stone-500/50" />}
              placeholder="Insira sua senha"
              type="password"
              classNameInput="text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="mt-3">
            <SubmitButton
              text={loading ? "Carregando..." : "Entrar"}
              disabled={loading}
            />
          </div>

          <div className="flex justify-center items-center gap-1 mt-5 ">
            <ShieldCheck className="text-blue-500 h-5 w-5" />
            <h1 className="text-sm text-stone-600/90">
              Seus dados estão protegidos com segurança
            </h1>
          </div>
        </form>
      </div>
    </section>
  );
}
