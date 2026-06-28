"use client";

import { useEffect, useState } from "react";
import SideBar from "@/components/SideBar";
import Footer from "@/components/Footer";
import { Loader2, Construction, User, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/auth/me");
        const result = await response.json();
        if (result.success && result.data) {
          setUser(result.data);
        } else {
          // Desloga para limpar o cookie token inválido e evitar loop com o middleware
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Erro ao carregar perfil no layout:", error);
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch (e) {}
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  useEffect(() => {
    // Carrega o estado de colapsado do localStorage no lado do cliente
    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    if (savedCollapsed === "true") {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const toggleSidebarCollapse = () => {
    const nextVal = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextVal);
    localStorage.setItem("sidebar-collapsed", String(nextVal));
  };

  // Sempre fecha a barra lateral móvel quando muda de rota
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  // Bloqueia a rolagem do corpo e html quando o menu mobile está aberto
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.height = "100vh";
    } else {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
    };
  }, [isMobileSidebarOpen]);

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

  // Se o usuário não for ADMIN, bloqueia o acesso (exceto para a tela de ponto e chat que possuem área de colaborador)
  const isNotAdmin = user && user.role !== "ADMIN" && pathname !== "/ponto" && pathname !== "/chat";

  return (
    <div className="flex min-h-screen w-full bg-[#EDEDED]">
      {/* Sidebar Mobile Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden animate-fade-in touch-none"
          onClick={() => setIsMobileSidebarOpen(false)}
          onTouchMove={(e) => e.preventDefault()}
        />
      )}

      {/* Sidebar Component */}
      <SideBar
        isAdmin={user?.role === "ADMIN"}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Header para Celulares e Tablets */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-stone-200/50 flex items-center justify-between px-5 sticky top-0 z-30 lg:hidden shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className="font-bold text-stone-800 tracking-tight text-lg">ConectaRH</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/perfil" className="h-9 w-9 rounded-full overflow-hidden border border-stone-200 block">
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}`
                }
                alt={user?.name || "Perfil"}
                className="h-full w-full object-cover"
              />
            </Link>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main
          className={`flex-1 p-5 transition-all duration-300 ease-in-out ml-0 flex flex-col justify-between gap-6
            ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}
            ${isNotAdmin ? "items-center justify-center bg-slate-50/50" : ""}
          `}
        >
          <div className={`w-full ${!isNotAdmin ? "flex-1 flex flex-col" : "flex items-center justify-center flex-1"}`}>
            {isNotAdmin ? (
              <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-stone-100 p-10 flex flex-col items-center text-center gap-6 animate-fade-in">
                <div className="p-5 bg-blue-50 text-blue-600 rounded-3xl animate-bounce">
                  <Construction className="h-14 w-14" />
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-stone-800">
                    Olá, {user?.name.split(" ")[0]}! 👋
                  </h1>
                  <h2 className="text-lg font-semibold text-blue-600/90">
                    {pathname === "/perfil" 
                      ? "Perfil do Colaborador em Desenvolvimento" 
                      : "Área do Colaborador em Desenvolvimento"}
                  </h2>
                  <p className="text-sm text-stone-500 leading-relaxed pt-2">
                    {pathname === "/perfil" 
                      ? "A tela de visualização e edição do seu perfil de colaborador está sendo criada. Em breve você poderá gerenciar seus dados cadastrais, enviar novos documentos e atualizar sua foto por aqui!"
                      : "A sua área de trabalho como colaborador ainda está sendo preparada pela nossa equipe de tecnologia. Em breve, você terá acesso a todas as suas ferramentas, holerites, ponto eletrônico e benefícios por aqui!"
                    }
                  </p>
                </div>

                <div className="w-full flex flex-col sm:flex-row gap-3 pt-4">
                  {pathname !== "/perfil" && (
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
            ) : (
              children
            )}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
