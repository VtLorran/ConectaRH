"use client";

import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  CheckCircle, 
  MessageCircleMore, 
  UserCircle2, 
  LucideSettings, 
  Clock, 
  Calendar,
  Sparkles,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import SectionComponent from "@/components/SectionComponent";
import TittleHeader from "@/components/TittleHeader";
import Breadcrumb from "@/components/Breadcrumb";

interface UserProfile {
  name: string;
  role: string;
}

export default function CollaboratorDashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/auth/me");
        const result = await response.json();
        if (result.success && result.data) {
          setUser(result.data);
        }
      } catch (error) {
        console.error("Erro ao buscar perfil no dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const navigation = [
    { label: "Dashboard", href: "/dashboard" }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-stone-500 font-medium">Carregando painel...</p>
      </div>
    );
  }

  const firstName = user?.name ? user.name.split(" ")[0] : "Colaborador";

  return (
    <SectionComponent>
      <TittleHeader tittle="Área do Colaborador" className="w-full" />
      <div className="w-full">
        <Breadcrumb items={navigation} />
      </div>

      {/* Banner de Boas-vindas */}
      <div className="w-full p-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl shadow-xl text-white relative overflow-hidden animate-fade-in">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10 scale-150 pointer-events-none">
          <LayoutDashboard className="h-64 w-64" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wide uppercase">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Bem-vindo ao ConectaRH
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Olá, {firstName}! 👋
          </h2>
          <p className="text-blue-100 max-w-xl text-sm leading-relaxed">
            Este é o seu portal de trabalho. Aqui você pode gerenciar sua jornada de trabalho, comunicar-se com seu time, revisar seu perfil e configurações pessoais.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-blue-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="capitalize">{currentDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Atalhos Rápidos */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {/* Card Ponto */}
        <Link 
          href="/ponto"
          className="group p-6 bg-white rounded-3xl border border-stone-100/60 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[180px]"
        >
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-sm group-hover:text-blue-600 transition-colors">Controle de Ponto</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Registre sua jornada de trabalho diária e consulte seu histórico de marcações.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 pt-4 border-t border-stone-50 group-hover:translate-x-1 transition-transform">
            <span>Acessar Ponto</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        {/* Card Chat */}
        <Link 
          href="/chat"
          className="group p-6 bg-white rounded-3xl border border-stone-100/60 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[180px]"
        >
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <MessageCircleMore className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-sm group-hover:text-blue-600 transition-colors">Conversas / Chat</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Converse com o suporte corporativo ou envie mensagens para outros colaboradores.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 pt-4 border-t border-stone-50 group-hover:translate-x-1 transition-transform">
            <span>Abrir Chat</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        {/* Card Perfil */}
        <Link 
          href="/perfil"
          className="group p-6 bg-white rounded-3xl border border-stone-100/60 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[180px]"
        >
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              <UserCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-sm group-hover:text-blue-600 transition-colors">Meu Perfil</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Consulte seus dados cadastrais, informações de admissão e documentos.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-indigo-600 pt-4 border-t border-stone-50 group-hover:translate-x-1 transition-transform">
            <span>Visualizar Perfil</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        {/* Card Configurações */}
        <Link 
          href="/configuracoes"
          className="group p-6 bg-white rounded-3xl border border-stone-100/60 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[180px]"
        >
          <div className="space-y-4">
            <div className="p-3 bg-stone-100 text-stone-600 rounded-2xl w-fit group-hover:bg-stone-600 group-hover:text-white transition-all duration-300">
              <LucideSettings className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-sm group-hover:text-blue-600 transition-colors">Configurações</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Personalize o tema do sistema, idioma, preferências e segurança de acesso.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-stone-600 pt-4 border-t border-stone-50 group-hover:translate-x-1 transition-transform">
            <span>Ajustar Configurações</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </div>
    </SectionComponent>
  );
}
