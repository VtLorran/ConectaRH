"use client";

import { useEffect, useState } from "react";
import SideBar from "@/components/SideBar";
import { Loader2, Construction, User, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/auth/me");
        const result = await response.json();
        if (result.success && result.data) {
          setUser(result.data);
        }
      } catch (error) {
        console.error("Erro ao carregar perfil no layout:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-stone-500 font-semibold text-sm animate-pulse">
            Carregando sistema...
          </p>
        </div>
      </div>
    );
  }

  // Se o usuário não for ADMIN, bloqueia o acesso e mostra a tela em desenvolvimento adequada
  const isNotAdmin = user && user.role !== "ADMIN";

  if (isNotAdmin) {
    const isProfileRoute = pathname === "/perfil";

    return (
      <div className="flex min-h-screen w-full bg-slate-50/50">
        <SideBar isAdmin={false} />

        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-stone-100 p-10 flex flex-col items-center text-center gap-6 animate-fade-in">
            <div className="p-5 bg-blue-50 text-blue-600 rounded-3xl animate-bounce">
              <Construction className="h-14 w-14" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-stone-800">
                Olá, {user.name.split(" ")[0]}! 👋
              </h1>
              <h2 className="text-lg font-semibold text-blue-600/90">
                {isProfileRoute ? "Perfil do Colaborador em Desenvolvimento" : "Área do Colaborador em Desenvolvimento"}
              </h2>
              <p className="text-sm text-stone-500 leading-relaxed pt-2">
                {isProfileRoute 
                  ? "A tela de visualização e edição do seu perfil de colaborador está sendo criada. Em breve você poderá gerenciar seus dados cadastrais, enviar novos documentos e atualizar sua foto por aqui!"
                  : "A sua área de trabalho como colaborador ainda está sendo preparada pela nossa equipe de tecnologia. Em breve, você terá acesso a todas as suas ferramentas, holerites, ponto eletrônico e benefícios por aqui!"
                }
              </p>
            </div>

            <div className="w-full flex flex-col sm:flex-row gap-3 pt-4">
              {!isProfileRoute && (
                <Link
                  href="/perfil"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer text-sm"
                >
                  <User className="h-4 w-4" />
                  Verificar Perfil
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 font-semibold py-3.5 px-6 rounded-xl transition-all active:scale-95 cursor-pointer text-sm"
              >
                <LogOut className="h-4 w-4" strokeWidth={2.5} />
                Sair da Conta
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <SideBar isAdmin={true} />

      {/* Conteúdo da página */}
      <main className="flex-1 p-5">{children}</main>
    </div>
  );
}
