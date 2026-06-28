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
    const handleSidebarPref = () => {
      const pref = localStorage.getItem("sidebar-preference") || "default";
      if (pref === "expanded") {
        setIsSidebarCollapsed(false);
      } else if (pref === "collapsed") {
        setIsSidebarCollapsed(true);
      } else {
        const savedCollapsed = localStorage.getItem("sidebar-collapsed");
        setIsSidebarCollapsed(savedCollapsed === "true");
      }
    };

    handleSidebarPref();
    window.addEventListener("sidebar-pref-changed", handleSidebarPref);
    window.addEventListener("storage", handleSidebarPref);

    return () => {
      window.removeEventListener("sidebar-pref-changed", handleSidebarPref);
      window.removeEventListener("storage", handleSidebarPref);
    };
  }, []);

  useEffect(() => {
    const applyTheme = (t: string) => {
      const root = document.documentElement;
      if (t === "dark") {
        root.classList.add("dark");
      } else if (t === "light") {
        root.classList.remove("dark");
      } else {
        // Auto
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        if (systemTheme === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };

    const applyFontSize = (s: string) => {
      const root = document.documentElement;
      root.classList.remove("font-size-small", "font-size-medium", "font-size-large");
      root.classList.add(`font-size-${s}`);
    };

    // Load initial
    const savedTheme = localStorage.getItem("theme-preference") || "auto";
    const savedFontSize = localStorage.getItem("font-size-preference") || "medium";
    applyTheme(savedTheme);
    applyFontSize(savedFontSize);

    // Listen to real-time events
    const handlePrefChange = () => {
      applyTheme(localStorage.getItem("theme-preference") || "auto");
      applyFontSize(localStorage.getItem("font-size-preference") || "medium");
    };

    window.addEventListener("appearance-pref-changed", handlePrefChange);
    window.addEventListener("storage", handlePrefChange);

    return () => {
      window.removeEventListener("appearance-pref-changed", handlePrefChange);
      window.removeEventListener("storage", handlePrefChange);
    };
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

  // Efeito global para ouvir a chegada de novas notificações e tocar o som
  useEffect(() => {
    if (!user) return;

    // Síntese programática de som de notificação para garantir 100% de funcionamento sem assets estáticos
    const playChime = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        gain1.gain.setValueAtTime(0.08, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.25);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.45);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc1.start();
        osc1.stop(ctx.currentTime + 0.25);
        osc2.start(ctx.currentTime + 0.08);
        osc2.stop(ctx.currentTime + 0.45);
      } catch (err) {
        console.error("Erro ao tocar som de notificação:", err);
      }
    };

    const checkNewNotifications = async () => {
      // Só checa se notificações estão ligadas nas preferências
      const isNotificationsEnabled = localStorage.getItem("notifications-preference") !== "false";
      if (!isNotificationsEnabled) return;

      try {
        const res = await fetch("/api/notifications/unread-count");
        const json = await res.json();
        if (json.success) {
          const currentCount = json.unreadCount;
          const lastCountStr = sessionStorage.getItem("last-notification-count");
          
          if (lastCountStr !== null) {
            const lastCount = Number(lastCountStr);
            if (currentCount > lastCount) {
              playChime();
              window.dispatchEvent(new Event("notifications-updated"));
            }
          }
          sessionStorage.setItem("last-notification-count", String(currentCount));
        }
      } catch (err) {
        console.error("Erro ao checar novas notificações:", err);
      }
    };

    const initNotificationsCount = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count");
        const json = await res.json();
        if (json.success) {
          sessionStorage.setItem("last-notification-count", String(json.unreadCount));
        }
      } catch (err) {
        console.error(err);
      }
    };

    initNotificationsCount();

    const interval = setInterval(checkNewNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

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
