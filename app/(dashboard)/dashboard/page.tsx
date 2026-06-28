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
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  FileCheckCorner,
  Timer,
  TrendingUp,
  Star,
  MessageSquare,
  Activity,
  Loader2,
  Palmtree,
  CircleDot,
} from "lucide-react";
import Link from "next/link";
import SectionComponent from "@/components/SectionComponent";
import TittleHeader from "@/components/TittleHeader";
import Breadcrumb from "@/components/Breadcrumb";

interface DashboardData {
  user: {
    name: string;
    email: string;
    avatar: string | null;
    status: string;
    createdAt: string;
    jobPosition: string | null;
    department: string | null;
  };
  company: {
    name: string;
    logo: string | null;
  };
  onboarding: {
    total: number;
    pending: number;
    submitted: number;
    approved: number;
  };
  nextDayOff: { startDate: string; endDate: string } | null;
  lastTimeRecord: {
    date: string;
    entryTime: string | null;
    exitTime: string | null;
  } | null;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function calcTenure(createdAt: string): string {
  const start = new Date(createdAt);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years > 0 && months > 0) return `${years} ano${years > 1 ? "s" : ""} e ${months} ${months > 1 ? "meses" : "mês"}`;
  if (years > 0) return `${years} ano${years > 1 ? "s" : ""}`;
  if (months > 0) return `${months} ${months > 1 ? "meses" : "mês"}`;
  return "Menos de 1 mês";
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function CollaboratorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard/user");
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Erro ao buscar dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }));
    };
    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, []);

  const navigation = [{ label: "Dashboard", href: "/dashboard" }];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-stone-500 font-medium animate-pulse">Carregando painel...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-sm text-stone-500 font-medium">Não foi possível carregar o painel.</p>
      </div>
    );
  }

  const firstName = data.user.name.split(" ")[0];
  const tenure = calcTenure(data.user.createdAt);
  const onb = data.onboarding;
  const onbPercent = onb.total > 0 ? Math.round(((onb.submitted + onb.approved) / onb.total) * 100) : 100;
  const onbDone = onb.pending === 0 && onb.total > 0;

  return (
    <SectionComponent>
      <TittleHeader tittle="Área do Colaborador" className="w-full" />
      <div className="w-full">
        <Breadcrumb items={navigation} />
      </div>

      {/* Banner de Boas-vindas */}
      <div className="w-full p-8 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10 scale-150 pointer-events-none">
          <LayoutDashboard className="h-64 w-64" />
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold tracking-wide uppercase">
            <Building2 className="h-3.5 w-3.5 text-blue-200" />
            {data.company.name}
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {getGreeting()}, {firstName}! 👋
          </h2>
          <p className="text-blue-100 max-w-xl text-sm leading-relaxed">
            Aqui está um resumo das suas informações dentro da empresa. Acompanhe seu vínculo, pendências e atividades.
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

      {/* Cards de Resumo */}
      <div className="w-full">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2 px-1">
          <CircleDot size={14} className="text-blue-500" />
          Informações do Vínculo
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cargo */}
          <div className="bg-white p-5 rounded-2xl border border-stone-100/60 shadow-md flex items-start gap-4">
            <div className="p-2.5 bg-violet-50 text-violet-500 rounded-xl shrink-0">
              <Briefcase size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Cargo</p>
              <p className="text-sm font-bold text-stone-800 mt-0.5 truncate">
                {data.user.jobPosition || "Não definido"}
              </p>
            </div>
          </div>

          {/* Departamento */}
          <div className="bg-white p-5 rounded-2xl border border-stone-100/60 shadow-md flex items-start gap-4">
            <div className="p-2.5 bg-sky-50 text-sky-500 rounded-xl shrink-0">
              <Building2 size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Departamento</p>
              <p className="text-sm font-bold text-stone-800 mt-0.5 truncate">
                {data.user.department || "Não definido"}
              </p>
            </div>
          </div>

          {/* Tempo de Empresa */}
          <div className="bg-white p-5 rounded-2xl border border-stone-100/60 shadow-md flex items-start gap-4">
            <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl shrink-0">
              <Timer size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Tempo de Empresa</p>
              <p className="text-sm font-bold text-stone-800 mt-0.5 truncate">{tenure}</p>
            </div>
          </div>

          {/* Próxima Folga */}
          <div className="bg-white p-5 rounded-2xl border border-stone-100/60 shadow-md flex items-start gap-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl shrink-0">
              <Palmtree size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Próxima Folga</p>
              {data.nextDayOff ? (
                <p className="text-sm font-bold text-stone-800 mt-0.5">
                  {fmtDate(data.nextDayOff.startDate)}
                </p>
              ) : (
                <p className="text-xs font-semibold text-stone-400 mt-0.5">Nenhuma folga programada</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Card */}
      {onb.total > 0 && (
        <div className="w-full">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2 px-1">
            <FileCheckCorner size={14} className="text-blue-500" />
            Onboarding
          </h3>
          <Link href="/onboarding" className="block group">
            <div className="bg-white p-6 rounded-2xl border border-stone-100/60 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl shrink-0 ${onbDone ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-500"}`}>
                    <FileCheckCorner size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-800">
                      {onbDone ? "Onboarding concluído" : `${onb.pending} pendência${onb.pending !== 1 ? "s" : ""}`}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {onb.approved} aprovado{onb.approved !== 1 ? "s" : ""} • {onb.submitted} enviado{onb.submitted !== 1 ? "s" : ""} • {onb.pending} pendente{onb.pending !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto sm:min-w-[220px]">
                  <div className="flex-1 bg-stone-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${onbPercent === 100 ? "bg-emerald-500" : onbPercent > 50 ? "bg-blue-500" : "bg-amber-500"}`}
                      style={{ width: `${onbPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-black text-stone-700 shrink-0 tabular-nums">{onbPercent}%</span>
                </div>
              </div>
              <div className="flex items-center justify-end text-xs font-bold text-blue-500 pt-3 mt-3 border-t border-stone-50 group-hover:translate-x-1 transition-transform">
                <span>Ver Central de Onboarding</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Cards de Desempenho */}
      <div className="w-full">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2 px-1">
          <Activity size={14} className="text-blue-500" />
          Desempenho
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Desempenho Geral */}
          <div className="bg-white p-5 rounded-2xl border border-stone-100/60 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 text-blue-500 rounded-xl"><Star size={18} /></div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Desempenho</p>
            </div>
            <p className="text-2xl font-black text-stone-800">—</p>
            <p className="text-[10px] text-stone-400 mt-1">Avaliação pendente</p>
          </div>

          {/* Última Avaliação */}
          <div className="bg-white p-5 rounded-2xl border border-stone-100/60 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl"><CalendarDays size={18} /></div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Última Avaliação</p>
            </div>
            <p className="text-sm font-bold text-stone-800">Nenhuma avaliação</p>
            <p className="text-[10px] text-stone-400 mt-1">Disponível em breve</p>
          </div>

          {/* Evolução */}
          <div className="bg-white p-5 rounded-2xl border border-stone-100/60 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl"><TrendingUp size={18} /></div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Evolução</p>
            </div>
            <p className="text-sm font-bold text-stone-600 flex items-center gap-1.5">→ Estável</p>
            <p className="text-[10px] text-stone-400 mt-1">Sem variação recente</p>
          </div>

          {/* Feedbacks */}
          <div className="bg-white p-5 rounded-2xl border border-stone-100/60 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><MessageSquare size={18} /></div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Feedbacks</p>
            </div>
            <p className="text-2xl font-black text-stone-800">0</p>
            <p className="text-[10px] text-stone-400 mt-1">Nenhum feedback recebido</p>
          </div>
        </div>
      </div>

      {/* Resumo de Atividades */}
      <div className="w-full">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2 px-1">
          <Sparkles size={14} className="text-blue-500" />
          Resumo de Atividades
        </h3>
        <div className="bg-white rounded-2xl border border-stone-100/60 shadow-md divide-y divide-stone-100/80">
          {/* Pendências de Onboarding */}
          <Link href="/onboarding" className="flex items-center justify-between p-5 hover:bg-stone-50/50 transition-colors group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-amber-50 text-amber-500 rounded-lg shrink-0"><FileCheckCorner size={16} /></div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-stone-700 truncate">Pendências de Onboarding</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {onb.total === 0 ? "Sem solicitações" : onb.pending > 0 ? `${onb.pending} item(s) pendente(s)` : "Todas as solicitações concluídas"}
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-stone-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>

          {/* Próxima Folga */}
          <Link href="/folgas" className="flex items-center justify-between p-5 hover:bg-stone-50/50 transition-colors group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg shrink-0"><Palmtree size={16} /></div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-stone-700 truncate">Próxima Folga</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {data.nextDayOff ? `${fmtDate(data.nextDayOff.startDate)} até ${fmtDate(data.nextDayOff.endDate)}` : "Nenhuma folga programada"}
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-stone-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>

          {/* Último Registro de Ponto */}
          <Link href="/ponto" className="flex items-center justify-between p-5 hover:bg-stone-50/50 transition-colors group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-blue-50 text-blue-500 rounded-lg shrink-0"><CheckCircle size={16} /></div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-stone-700 truncate">Último Registro de Ponto</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {data.lastTimeRecord
                    ? `${fmtDate(data.lastTimeRecord.date)}${data.lastTimeRecord.entryTime ? ` • Entrada: ${fmtTime(data.lastTimeRecord.entryTime)}` : ""}${data.lastTimeRecord.exitTime ? ` • Saída: ${fmtTime(data.lastTimeRecord.exitTime)}` : ""}`
                    : "Nenhum registro encontrado"}
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-stone-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>

          {/* Avaliação de Desempenho */}
          <div className="flex items-center justify-between p-5 opacity-60">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg shrink-0"><Star size={16} /></div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-stone-700 truncate">Última Avaliação de Desempenho</p>
                <p className="text-xs text-stone-400 mt-0.5">Disponível em breve</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <div className="w-full">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2 px-1">
          <ArrowRight size={14} className="text-blue-500" />
          Acesso Rápido
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/ponto" className="group p-5 bg-white rounded-2xl border border-stone-100/60 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0"><CheckCircle size={20} /></div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-stone-800 group-hover:text-blue-600 transition-colors">Ponto</p>
              <p className="text-[10px] text-stone-400">Registrar jornada</p>
            </div>
          </Link>
          <Link href="/chat" className="group p-5 bg-white rounded-2xl border border-stone-100/60 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0"><MessageCircleMore size={20} /></div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-stone-800 group-hover:text-blue-600 transition-colors">Chat</p>
              <p className="text-[10px] text-stone-400">Conversas</p>
            </div>
          </Link>
          <Link href="/perfil" className="group p-5 bg-white rounded-2xl border border-stone-100/60 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-4">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0"><UserCircle2 size={20} /></div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-stone-800 group-hover:text-blue-600 transition-colors">Perfil</p>
              <p className="text-[10px] text-stone-400">Dados cadastrais</p>
            </div>
          </Link>
          <Link href="/configuracoes" className="group p-5 bg-white rounded-2xl border border-stone-100/60 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-4">
            <div className="p-2.5 bg-stone-100 text-stone-600 rounded-xl group-hover:bg-stone-600 group-hover:text-white transition-all shrink-0"><LucideSettings size={20} /></div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-stone-800 group-hover:text-blue-600 transition-colors">Configurações</p>
              <p className="text-[10px] text-stone-400">Preferências</p>
            </div>
          </Link>
        </div>
      </div>
    </SectionComponent>
  );
}
