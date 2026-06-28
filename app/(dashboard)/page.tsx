"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  UserCheck,
  UserX,
  FileCheckCorner,
  FolderOpen,
  CheckSquare,
  Palmtree,
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Percent,
  Plus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";
import SectionComponent from "@/components/SectionComponent";
import TittleHeader from "@/components/TittleHeader";
import Breadcrumb from "@/components/Breadcrumb";

interface AdminDashboardData {
  company: {
    nomeFantasia: string;
    razaoSocial: string;
    cnpj: string;
    segmento: string | null;
    dataFundacao: string | null;
    logoPreview: string | null;
    createdAt: string;
  } | null;
  collaborators: {
    total: number;
    active: number;
    inactive: number;
    sectors: number;
    distribution: { name: string; value: number }[];
  };
  admissions: {
    total: number;
    underReview: number;
    invited: number;
    active: number;
  };
  onboarding: {
    active: number;
    completed: number;
    inProgress: number;
    pendingItems: number;
    averageProgress: number;
  };
  documents: {
    total: number;
  };
  ponto: {
    total: number;
    today: number;
    pending: number;
  };
  folgas: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

const COLORS = ["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#f43f5e", "#78716c"];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function formatDateString(dateStr: string | null | undefined) {
  if (!dateStr) return "Não cadastrada";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setMounted(true);
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Erro ao buscar dados do dashboard administrativo:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
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

  const navigation = [{ label: "Dashboard", href: "/" }];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-stone-500 font-medium animate-pulse">Carregando painel executivo...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-sm text-stone-500 font-medium">Erro ao carregar o painel administrativo.</p>
      </div>
    );
  }

  // Prepara dados para os gráficos
  const admissionChartData = [
    { name: "Em Análise", value: data.admissions.underReview, color: "#3b82f6" },
    { name: "Form. Enviado", value: data.admissions.invited, color: "#f59e0b" },
    { name: "Admitidos", value: data.admissions.active, color: "#10b981" },
  ].filter(item => item.value > 0);

  const onboardingChartData = [
    { name: "Concluídos", value: data.onboarding.completed, color: "#10b981" },
    { name: "Em Andamento", value: data.onboarding.inProgress, color: "#3b82f6" },
  ].filter(item => item.value > 0);

  const folgasChartData = [
    { status: "Pendentes", quantidade: data.folgas.pending, fill: "#f59e0b" },
    { status: "Aprovadas", quantidade: data.folgas.approved, fill: "#10b981" },
    { status: "Recusadas", quantidade: data.folgas.rejected, fill: "#f43f5e" },
  ];

  return (
    <SectionComponent>
      <TittleHeader tittle="Dashboard Executivo" className="w-full" />
      <div className="w-full flex items-center justify-between flex-wrap gap-4">
        <Breadcrumb items={navigation} />
      </div>

      {/* Banner de Saudação */}
      <div className="w-full p-8 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-800 rounded-3xl shadow-xl text-white relative overflow-hidden animate-fade-in mt-6">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10 scale-150 pointer-events-none">
          <LayoutDashboard className="h-64 w-64" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold tracking-wide uppercase">
            <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
            Painel de Gestão Corporativa
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {getGreeting()}, Administrador! 💼
          </h2>
          <p className="text-stone-300 max-w-xl text-sm leading-relaxed">
            Aqui está um resumo consolidado das atividades, colaboradores, processos admissionais, folhas de ponto e folgas da empresa.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-stone-300">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="capitalize">{currentDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 1: Informações da Empresa & Cards Gerais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 w-full">
        {/* Informações da Empresa */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building2 className="text-blue-500" size={16} />
              Informações da Empresa
            </h3>
            <div className="flex items-center gap-4 mb-6">
              {data.company?.logoPreview ? (
                <img
                  src={data.company.logoPreview}
                  alt="Logo"
                  className="w-16 h-16 rounded-2xl object-contain border border-stone-100 shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-extrabold text-xl shadow-xs">
                  {data.company?.nomeFantasia?.substring(0, 2).toUpperCase() || "CR"}
                </div>
              )}
              <div>
                <h4 className="font-bold text-stone-850 text-base">{data.company?.nomeFantasia || "ConectaRH"}</h4>
                <p className="text-xs text-stone-500 truncate max-w-[200px]">{data.company?.razaoSocial || "Conecta Recursos Humanos LTDA"}</p>
              </div>
            </div>

            <div className="space-y-3.5 border-t border-stone-50 pt-4 text-xs font-semibold text-stone-600">
              <div className="flex justify-between">
                <span className="text-stone-400">CNPJ:</span>
                <span className="text-stone-850 font-bold">{data.company?.cnpj || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Segmento:</span>
                <span className="text-stone-850 font-bold">{data.company?.segmento || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Data de Fundação:</span>
                <span className="text-stone-850 font-bold">{formatDateString(data.company?.dataFundacao)}</span>
              </div>
            </div>
          </div>
          
          <div className="text-[10px] text-stone-400 bg-stone-50/50 p-3 rounded-xl border border-stone-100 mt-4 text-center">
            Empresa ativa desde: <span className="font-bold text-stone-600">{formatDateString(data.company?.createdAt)}</span>
          </div>
        </div>

        {/* Cards de Métricas de Colaboradores */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-md flex items-start gap-4">
            <div className="p-3.5 bg-blue-50 text-blue-500 rounded-2xl shrink-0">
              <Users size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total de Colaboradores</p>
              <p className="text-3xl font-black text-stone-800 mt-1">{data.collaborators.total}</p>
              <p className="text-xs text-stone-400 mt-1">Registrados na base de dados</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-md flex items-start gap-4">
            <div className="p-3.5 bg-violet-50 text-violet-500 rounded-2xl shrink-0">
              <Building2 size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Setores & Cargos</p>
              <p className="text-3xl font-black text-stone-800 mt-1">{data.collaborators.sectors}</p>
              <p className="text-xs text-stone-400 mt-1">Setores estruturados ativos</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-md flex items-start gap-4">
            <div className="p-3.5 bg-emerald-50 text-emerald-500 rounded-2xl shrink-0">
              <UserCheck size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Colaboradores Ativos</p>
              <p className="text-3xl font-black text-stone-800 mt-1">{data.collaborators.active}</p>
              <p className="text-xs text-stone-400 mt-1">Trabalhando atualmente</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-md flex items-start gap-4">
            <div className="p-3.5 bg-rose-50 text-rose-500 rounded-2xl shrink-0">
              <UserX size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Colaboradores Inativos</p>
              <p className="text-3xl font-black text-stone-800 mt-1">{data.collaborators.inactive}</p>
              <p className="text-xs text-stone-400 mt-1">Desativados ou desligados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico 1: Distribuição dos Colaboradores por Setor */}
      <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-md mt-6 w-full">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Users className="text-blue-500" size={16} />
          Distribuição dos Colaboradores por Setor
        </h3>
        <div className="w-full h-80">
          {mounted && data.collaborators.distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.collaborators.distribution}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#a8a29e" fontSize={11} fontWeight="bold" tickLine={false} />
                <YAxis stroke="#a8a29e" fontSize={11} fontWeight="bold" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  labelStyle={{ fontWeight: "bold", color: "#44403c" }}
                />
                <Bar dataKey="value" name="Colaboradores" radius={[8, 8, 0, 0]}>
                  {data.collaborators.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center gap-2">
              <Users size={32} className="text-stone-300" />
              <p className="text-stone-400 text-sm font-semibold">Nenhum colaborador distribuído nos setores cadastrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Seção 2: Admissões & Onboarding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 w-full">
        {/* Resumo das Admissões */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Briefcase className="text-blue-500" size={16} />
              Resumo das Admissões
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total</p>
                <p className="text-xl font-extrabold text-stone-850 mt-1">{data.admissions.total}</p>
              </div>
              <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100/40">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Em análise</p>
                <p className="text-xl font-extrabold text-blue-600 mt-1">{data.admissions.underReview}</p>
              </div>
              <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100/40">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Form. enviado</p>
                <p className="text-xl font-extrabold text-amber-600 mt-1">{data.admissions.invited}</p>
              </div>
              <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/40">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Admitidos</p>
                <p className="text-xl font-extrabold text-emerald-600 mt-1">{data.admissions.active}</p>
              </div>
            </div>
          </div>

          <div className="w-full h-56 flex items-center justify-center">
            {mounted && admissionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={admissionChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {admissionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "16px",
                      border: "1px solid #f1f5f9",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-stone-400 text-xs font-semibold text-center py-6">
                Nenhuma admissão cadastrada no sistema
              </div>
            )}
          </div>
        </div>

        {/* Resumo do Onboarding */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <FileCheckCorner className="text-blue-500" size={16} />
              Resumo do Onboarding
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Ativos</p>
                <p className="text-xl font-extrabold text-stone-850 mt-1">{data.onboarding.active}</p>
              </div>
              <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/40">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Concluídos</p>
                <p className="text-xl font-extrabold text-emerald-600 mt-1">{data.onboarding.completed}</p>
              </div>
              <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100/40">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Em Andamento</p>
                <p className="text-xl font-extrabold text-blue-600 mt-1">{data.onboarding.inProgress}</p>
              </div>
              <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100/40">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Pendências</p>
                <p className="text-xl font-extrabold text-amber-600 mt-1">{data.onboarding.pendingItems}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 justify-around pt-2">
            <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                {/* Circular progress indicators */}
                <div className="w-28 h-28 rounded-full border-8 border-stone-100 flex items-center justify-center">
                  <span className="text-xl font-black text-stone-800">{data.onboarding.averageProgress}%</span>
                </div>
                {/* Absolute overlay visual indicator */}
                <div className="absolute inset-0 w-28 h-28 rounded-full border-8 border-transparent border-t-blue-500 border-r-blue-500 animate-pulse pointer-events-none" />
              </div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mt-3">Progresso Médio Geral</p>
            </div>

            <div className="w-full sm:w-48 h-36">
              {mounted && onboardingChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={onboardingChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {onboardingChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={24} iconType="circle" iconSize={6} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-stone-400 text-xs font-semibold text-center py-10">
                  Nenhum onboarding ativo no momento
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seção 3: Documentos, Controle de Ponto & Central de Folgas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 w-full">
        {/* Documentos */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-md flex flex-col justify-between min-h-[260px]">
          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FolderOpen className="text-blue-500" size={16} />
              Gestão de Documentos
            </h3>
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-4 mt-2">
              <FolderOpen className="text-blue-600 shrink-0" size={32} />
              <div>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Documentos Armazenados</p>
                <p className="text-2xl font-black text-stone-850 mt-0.5">{data.documents.total}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2.5 pt-4 text-xs font-semibold text-stone-500 border-t border-stone-50">
            <div className="flex justify-between">
              <span>Onboarding e Geral:</span>
              <span className="text-stone-750 font-bold">{data.documents.total} arquivos</span>
            </div>
            <p className="text-[10px] text-stone-400 italic">Armazenamento corporativo seguro com criptografia.</p>
          </div>
        </div>

        {/* Controle de Ponto */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-md flex flex-col justify-between min-h-[260px]">
          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckSquare className="text-blue-500" size={16} />
              Controle de Ponto
            </h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total de Pontos</p>
                <p className="text-xl font-extrabold text-stone-850 mt-1">{data.ponto.total}</p>
              </div>
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Batidas Hoje</p>
                <p className="text-xl font-extrabold text-emerald-600 mt-1">{data.ponto.today}</p>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-stone-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
              <AlertCircle className={data.ponto.pending > 0 ? "text-amber-500" : "text-stone-300"} size={16} />
              <span>Pendências/Ajustes:</span>
            </div>
            <span className={`text-sm font-black ${data.ponto.pending > 0 ? "text-amber-600" : "text-stone-600"}`}>
              {data.ponto.pending} registros
            </span>
          </div>
        </div>

        {/* Central de Folgas */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-md flex flex-col justify-between min-h-[260px]">
          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Palmtree className="text-blue-500" size={16} />
              Central de Folgas
            </h3>
            <div className="grid grid-cols-3 gap-2 mt-2 text-center">
              <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/50">
                <p className="text-[9px] font-bold text-amber-500 uppercase">Pendente</p>
                <p className="text-base font-extrabold text-amber-600 mt-0.5">{data.folgas.pending}</p>
              </div>
              <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50">
                <p className="text-[9px] font-bold text-emerald-500 uppercase">Aprovado</p>
                <p className="text-base font-extrabold text-emerald-600 mt-0.5">{data.folgas.approved}</p>
              </div>
              <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/50">
                <p className="text-[9px] font-bold text-rose-500 uppercase">Recusado</p>
                <p className="text-base font-extrabold text-rose-600 mt-0.5">{data.folgas.rejected}</p>
              </div>
            </div>
          </div>
          <div className="w-full h-24">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={folgasChartData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                  <XAxis dataKey="status" stroke="#a8a29e" fontSize={9} fontWeight="bold" tickLine={false} />
                  <YAxis stroke="#a8a29e" fontSize={9} fontWeight="bold" tickLine={false} />
                  <Bar dataKey="quantidade" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>

      {/* Cards de Resumo Geral */}
      <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-md mt-6 w-full">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sparkles className="text-blue-500" size={16} />
          Resumo Geral da Plataforma
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100/80">
            <p className="text-2xl font-black text-stone-800">{data.collaborators.total}</p>
            <p className="text-[9px] font-bold text-stone-400 uppercase mt-1">Colaboradores</p>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100/80">
            <p className="text-2xl font-black text-stone-800">{data.collaborators.sectors}</p>
            <p className="text-[9px] font-bold text-stone-400 uppercase mt-1">Setores</p>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100/80">
            <p className="text-2xl font-black text-stone-800">{data.admissions.total}</p>
            <p className="text-[9px] font-bold text-stone-400 uppercase mt-1">Admissões</p>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100/80">
            <p className="text-2xl font-black text-stone-800">{data.onboarding.active}</p>
            <p className="text-[9px] font-bold text-stone-400 uppercase mt-1">Onboarding</p>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100/80">
            <p className="text-2xl font-black text-stone-800">{data.documents.total}</p>
            <p className="text-[9px] font-bold text-stone-400 uppercase mt-1">Documentos</p>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100/80">
            <p className="text-2xl font-black text-stone-800">{data.ponto.total}</p>
            <p className="text-[9px] font-bold text-stone-400 uppercase mt-1">Pontos</p>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100/80">
            <p className="text-2xl font-black text-stone-800">{data.folgas.total}</p>
            <p className="text-[9px] font-bold text-stone-400 uppercase mt-1">Folgas</p>
          </div>
        </div>
      </div>
    </SectionComponent>
  );
}