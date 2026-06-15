"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Palmtree,
  Plus,
  Search,
  Calendar,
  Clock,
  Check,
  X as XIcon,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import Modal from "@/components/Modal";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";

interface Collaborator {
  id: string;
  name: string;
  avatar: string | null;
  jobPosition?: {
    name: string;
    department?: {
      id: string;
      name: string;
    };
  } | null;
}

interface Vacation {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    jobPosition?: {
      name: string;
      department?: {
        id: string;
        name: string;
      };
    } | null;
  };
  approvedBy?: {
    name: string;
  } | null;
}

type TabType =
  | "pendentes"
  | "ativas"
  | "agendadas"
  | "concluidas"
  | "rejeitadas"
  | "calendario";

export default function CentralFerias() {
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("pendentes");
  const [searchQuery, setSearchQuery] = useState("");
  const [sectors, setSectors] = useState<any[]>([]);
  const [selectedSector, setSelectedSector] = useState("all");

  // Modal registration states
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"APPROVED" | "PENDING">("APPROVED");

  // Feedback states
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Cancellation states
  const [isCanceling, setIsCanceling] = useState(false);
  const [vacationToCancelId, setVacationToCancelId] = useState<string | null>(null);
  const [cancelComment, setCancelComment] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  
  // Date state for the monthly vacation vacation calendar view
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Helper functions for calendar view
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const calendarDays = useMemo(() => {
    const days = [];
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDayIndex = getFirstDayOfMonth(calendarDate);

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), i));
    }
    return days;
  }, [calendarDate]);

  const DIAS_SEMANA_SIGLA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const sectorCollaboratorsCount = useMemo(() => {
    if (selectedSector === "all") return 0;
    return collaborators.filter(
      (c) => c.jobPosition?.department?.id === selectedSector
    ).length;
  }, [collaborators, selectedSector]);

  const activeVacationsThisMonth = useMemo(() => {
    if (selectedSector === "all") return [];
    const firstOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
    const lastOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0, 23, 59, 59);

    const filtered = vacations.filter((v) => {
      if (v.status !== "APPROVED") return false;
      const deptId = v.user.jobPosition?.department?.id;
      if (deptId !== selectedSector) return false;

      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      const utcStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
      const utcEnd = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59);

      return utcStart <= lastOfMonth && utcEnd >= firstOfMonth;
    });

    const uniqueUsers = new Map<string, string>();
    filtered.forEach((v) => {
      uniqueUsers.set(v.userId, v.user.name);
    });

    return Array.from(uniqueUsers.entries()).map(([id, name]) => ({ id, name }));
  }, [vacations, selectedSector, calendarDate]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [resVacations, resCollaborators, resSectors] = await Promise.all([
        fetch("/api/ferias"),
        fetch("/api/colaboradores"),
        fetch("/api/setores"),
      ]);

      if (!resVacations.ok || !resCollaborators.ok || !resSectors.ok) {
        throw new Error("Erro ao carregar dados do servidor");
      }

      const valVacations = await resVacations.json();
      const valCollaborators = await resCollaborators.json();
      const valSectors = await resSectors.json();

      if (valVacations.success) {
        setVacations(valVacations.data);
      }
      setCollaborators(valCollaborators);
      setSectors(valSectors || []);
    } catch (error) {
      console.error(
        "Erro ao carregar dados da página central de férias:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRegisterVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedUserId) {
      setErrorMessage("Por favor, selecione um colaborador.");
      return;
    }

    if (!startDate || !endDate) {
      setErrorMessage("Por favor, selecione as datas de início e fim.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      setErrorMessage("A data de término deve ser posterior à data de início.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/ferias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          startDate,
          endDate,
          comment: comment.trim() || null,
          status,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao registrar férias");
      }

      setSuccessMessage(
        status === "APPROVED"
          ? "Férias registradas e aprovadas com sucesso!"
          : "Solicitação de férias cadastrada como pendente!",
      );

      // Reset
      setSelectedUserId("");
      setStartDate("");
      setEndDate("");
      setComment("");
      setStatus("APPROVED");

      await fetchAllData();

      setTimeout(() => {
        setIsAdding(false);
        setSuccessMessage("");
      }, 1500);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Erro ao criar registro de férias.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (
    vacationId: string,
    newStatus: "APPROVED" | "REJECTED",
    rejectionComment?: string,
  ) => {
    try {
      const res = await fetch(`/api/ferias/${vacationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          comment:
            rejectionComment !== undefined ? rejectionComment : undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao atualizar status");
      }

      await fetchAllData();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao alterar status da solicitação.");
    }
  };

  const handleDeleteVacation = async (vacationId: string) => {
    if (
      !window.confirm(
        "Tem certeza que deseja excluir este registro de férias permanentemente do histórico?",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/ferias/${vacationId}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao excluir registro");
      }

      await fetchAllData();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao excluir registro.");
    }
  };

  const openCancelModal = (id: string) => {
    setVacationToCancelId(id);
    setCancelComment("");
    setIsCanceling(true);
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacationToCancelId) return;

    if (!cancelComment.trim()) {
      alert("Por favor, insira uma justificativa para o cancelamento.");
      return;
    }

    setIsSubmittingCancel(true);

    try {
      const res = await fetch(`/api/ferias/${vacationToCancelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
          comment: `Cancelamento: ${cancelComment.trim()}`,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao cancelar férias");
      }

      setIsCanceling(false);
      setVacationToCancelId(null);
      setCancelComment("");

      // Reload lists
      await fetchAllData();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao cancelar férias.");
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const formatDateString = (dateStr: string) => {
    const date = new Date(dateStr);
    const utcDate = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    );
    return utcDate.toLocaleDateString("pt-BR");
  };

  const calculateDays = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Classificar férias
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Verificar se há filtro ativo
  const isFilterActive = searchQuery.trim() !== "" || selectedSector !== "all";

  const filteredVacations = vacations.filter((v) => {
    // Se não há pesquisa nem filtro de setor, não exibe por padrão
    if (!isFilterActive) {
      return false;
    }

    // Filtrar por busca de nome
    if (searchQuery.trim() !== "") {
      const name = v.user.name.toLowerCase();
      if (!name.includes(searchQuery.toLowerCase())) return false;
    }

    // Filtrar por setor
    if (selectedSector !== "all") {
      const deptId = v.user.jobPosition?.department?.id;
      if (deptId !== selectedSector) return false;
    }

    const start = new Date(v.startDate);
    const end = new Date(v.endDate);
    const utcStart = new Date(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate(),
    );
    const utcEnd = new Date(
      end.getUTCFullYear(),
      end.getUTCMonth(),
      end.getUTCDate(),
      23,
      59,
      59,
    );

    if (activeTab === "pendentes") {
      return v.status === "PENDING";
    }
    if (activeTab === "rejeitadas") {
      return v.status === "REJECTED" || v.status === "CANCELLED";
    }
    if (v.status !== "APPROVED") return false;

    if (activeTab === "ativas") {
      return today >= utcStart && today <= utcEnd;
    }
    if (activeTab === "agendadas") {
      return utcStart > today;
    }
    if (activeTab === "concluidas") {
      return utcEnd < today;
    }
    return false;
  });

  // Agrupar férias filtradas por setor
  const groupedVacationsBySector = useMemo(() => {
    const groups: Record<string, { sectorName: string; list: Vacation[] }> = {};

    filteredVacations.forEach((v) => {
      const sectorId = v.user.jobPosition?.department?.id || "unassigned";
      const sectorName = v.user.jobPosition?.department?.name || "Sem Setor";

      if (!groups[sectorId]) {
        groups[sectorId] = { sectorName, list: [] };
      }
      groups[sectorId].list.push(v);
    });

    return Object.values(groups);
  }, [filteredVacations]);

  console.log("DEBUG - CentralFerias:", {
    searchQuery,
    selectedSector,
    isFilterActive,
    vacationsCount: vacations.length,
    filteredCount: filteredVacations.length,
    groupedCount: groupedVacationsBySector.length,
    firstVacation: vacations[0] ? {
      userName: vacations[0].user?.name,
      jobPositionName: vacations[0].user?.jobPosition?.name,
      department: vacations[0].user?.jobPosition?.department
    } : null
  });

  const getStatusBadge = (statusKey: string) => {
    switch (statusKey) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
            <CheckCircle2 size={12} />
            Aprovado
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-wider">
            <XIcon size={12} />
            Recusado
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200 uppercase tracking-wider">
            <XIcon size={12} />
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">
            <Clock size={12} />
            Pendente
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Caixa de Ações Principais */}
      <div className="w-full bg-white p-6 rounded-3xl shadow-xl border border-stone-100/50 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Barra de Pesquisa */}
        <div className="relative w-full md:max-w-md flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Pesquisar por colaborador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200/80 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none  text-stone-700"
          />
        </div>

        {/* Filtro de Setor */}
        <div className="relative w-full md:max-w-[240px] flex items-center gap-2 bg-stone-50 border border-stone-200/80 rounded-2xl px-3.5 py-3 shrink-0">
          <Building2 size={16} className="text-stone-400" />
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-transparent text-sm font-bold text-stone-650 focus:outline-none border-none py-0.5 cursor-pointer w-full"
          >
            <option value="all">Filtrar por Setor</option>
            {sectors.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Registrar Férias */}
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Plus size={18} />
          Registrar / Agendar Férias
        </button>
      </div>

      {/* Container de Fundo Branco Principal */}
      <div className="w-full bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-xl space-y-6">
        {/* Abas de Filtros */}
      <div className="w-full flex border-b border-stone-200/60 overflow-x-auto gap-4">
        {(
          [
            "pendentes",
            "ativas",
            "agendadas",
            "concluidas",
            "rejeitadas",
            "calendario",
          ] as TabType[]
        ).map((tab) => {
          const count = vacations.filter((v) => {
            const start = new Date(v.startDate);
            const end = new Date(v.endDate);

            // Filtro por nome no contador se houver pesquisa ativa
            if (searchQuery.trim() !== "") {
              const name = v.user.name.toLowerCase();
              if (!name.includes(searchQuery.toLowerCase())) return false;
            }

            // Filtro por setor no contador se houver setor ativo
            if (selectedSector !== "all") {
              const deptId = v.user.jobPosition?.department?.id;
              if (deptId !== selectedSector) return false;
            }

            const utcStart = new Date(
              start.getUTCFullYear(),
              start.getUTCMonth(),
              start.getUTCDate(),
            );
            const utcEnd = new Date(
              end.getUTCFullYear(),
              end.getUTCMonth(),
              end.getUTCDate(),
              23,
              59,
              59,
            );

            if (tab === "pendentes") return v.status === "PENDING";
            if (tab === "rejeitadas") return v.status === "REJECTED" || v.status === "CANCELLED";
            if (v.status !== "APPROVED") return false;
            if (tab === "ativas") return today >= utcStart && today <= utcEnd;
            if (tab === "agendadas") return utcStart > today;
            if (tab === "concluidas") return utcEnd < today;
            return false;
          }).length;

          const labelMap: Record<TabType, string> = {
            pendentes: "Solicitações Pendentes",
            ativas: "Férias Ativas",
            agendadas: "Férias Agendadas",
            concluidas: "Histórico Realizado",
            rejeitadas: "Recusadas / Canceladas",
            calendario: "Calendário por Setor",
          };

          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap px-1 flex items-center gap-2 ${
                isActive
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent text-stone-400 hover:text-stone-600"
              }`}
            >
              {tab === "calendario" && <Calendar size={14} className="shrink-0" />}
              {labelMap[tab]}
              {tab !== "calendario" && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? "bg-blue-100 text-blue-600"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Conteúdo Principal */}
      <div className="w-full">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-stone-500 font-semibold text-sm animate-pulse">
              Carregando dados das férias...
            </p>
          </div>
        ) : activeTab === "calendario" ? (
          selectedSector === "all" ? (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-3 bg-stone-50/40 rounded-3xl border border-stone-200/40">
              <Calendar size={48} className="text-stone-300 animate-pulse" />
              <p className="text-stone-500 font-semibold text-sm">
                Selecione um Setor para Visualizar o Calendário
              </p>
              <p className="text-stone-400 text-xs max-w-sm px-4">
                Escolha um setor específico no filtro do topo para carregar a visão mensal de férias da equipe no calendário.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo Estatístico do Setor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-stone-50/50 p-5 rounded-2xl border border-stone-200/45 flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Setor Selecionado</h4>
                    <p className="text-sm font-bold text-stone-700 mt-0.5 truncate max-w-[200px]">
                      {sectors.find((s) => s.id === selectedSector)?.name || "—"}
                    </p>
                  </div>
                </div>

                <div className="bg-stone-50/50 p-5 rounded-2xl border border-stone-200/45 flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Loader2 size={20} className={loading ? "animate-spin" : ""} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Colaboradores do Setor</h4>
                    <p className="text-lg font-bold text-stone-750 mt-0.5">{sectorCollaboratorsCount}</p>
                  </div>
                </div>

                <div className="bg-stone-50/50 p-5 rounded-2xl border border-stone-200/45 flex items-center gap-4">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                    <Palmtree size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">De Férias no Mês</h4>
                    <p className="text-lg font-bold text-orange-700 mt-0.5">{activeVacationsThisMonth.length}</p>
                  </div>
                </div>
              </div>

              {/* Calendário Mensal */}
              <div className="bg-white rounded-3xl border border-stone-200/40 p-6 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 gap-4">
                  <div>
                    <h3 className="text-sm font-black text-stone-750 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="text-blue-500" size={18} />
                      Cronograma de Férias
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-200/80 rounded-xl p-1 shrink-0 w-fit">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1.5 hover:bg-white rounded-lg text-stone-600 transition-all cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-stone-700 px-3 py-1 capitalize select-none min-w-[120px] text-center">
                      {calendarDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="p-1.5 hover:bg-white rounded-lg text-stone-600 transition-all cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Legendas */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-stone-100 pb-4 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-orange-50 border border-orange-200/50 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    </div>
                    <span className="text-stone-600">Férias Aprovadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-amber-50 border border-amber-200/50 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </div>
                    <span className="text-stone-600">Solicitação Pendente</span>
                  </div>
                </div>

                {/* Grade do Calendário (Rolagem horizontal no mobile) */}
                <div className="overflow-x-auto no-scrollbar -mx-6 px-6">
                  <div className="grid grid-cols-7 gap-2 min-w-[750px] lg:min-w-0">
                    {/* Cabeçalho da Semana */}
                    {DIAS_SEMANA_SIGLA.map((sigla) => (
                      <div key={sigla} className="text-center text-[10px] font-bold text-stone-400 uppercase py-1 select-none">
                        {sigla}
                      </div>
                    ))}

                    {/* Dias */}
                    {calendarDays.map((dayDate, idx) => {
                      if (!dayDate) {
                        return <div key={`empty-${idx}`} className="aspect-square bg-transparent rounded-2xl" />;
                      }

                      const dayNum = dayDate.getDate();

                      // Filtrar férias do setor para este dia
                      const dayVacations = vacations.filter((v) => {
                        const deptId = v.user.jobPosition?.department?.id;
                        if (deptId !== selectedSector) return false;
                        if (v.status !== "APPROVED" && v.status !== "PENDING") return false;

                        const start = new Date(v.startDate);
                        const end = new Date(v.endDate);
                        const utcStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
                        const utcEnd = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59);

                        return dayDate >= utcStart && dayDate <= utcEnd;
                      });

                      return (
                        <div
                          key={dayDate.toISOString()}
                          className="min-h-[100px] p-2 rounded-2xl bg-stone-50/50 border border-stone-200/40 flex flex-col justify-between hover:bg-stone-50 transition-colors"
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-extrabold text-stone-500 select-none">{dayNum}</span>
                            {dayVacations.length > 0 && (
                              <span className="text-[9px] font-black bg-orange-100 text-orange-700 px-1.5 py-0.2 rounded-md">
                                {dayVacations.length}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 mt-2 overflow-y-auto max-h-[80px] w-full custom-scrollbar">
                            {dayVacations.map((v) => {
                              const isPending = v.status === "PENDING";
                              return (
                                <div
                                  key={v.id}
                                  className={`w-full flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold truncate ${
                                    isPending
                                      ? "bg-amber-50/50 border-amber-200 text-amber-800"
                                      : "bg-orange-50/50 border-orange-200 text-orange-800"
                                  }`}
                                  title={`${v.user.name} (${isPending ? "Pendente" : "Aprovado"})`}
                                >
                                  <span className={`w-1 h-1 rounded-full shrink-0 ${isPending ? "bg-amber-500" : "bg-orange-500"}`} />
                                  <span className="truncate">{v.user.name.split(" ")[0]}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        ) : !isFilterActive ? (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3 bg-stone-50/40 rounded-3xl border border-stone-200/40">
            <Search size={48} className="text-stone-300 animate-pulse" />
            <p className="text-stone-500 font-semibold text-sm">
              Pesquise ou Filtre por Setor para Visualizar
            </p>
            <p className="text-stone-400 text-xs max-w-sm px-4">
              Digite o nome de um colaborador na barra de pesquisa ou selecione um setor no filtro acima para carregar e exibir os registros correspondentes.
            </p>
          </div>
        ) : filteredVacations.length > 0 ? (
          <div className="space-y-8">
            {groupedVacationsBySector.map((group) => (
              <div key={group.sectorName} className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest flex items-center gap-2">
                    <Building2 className="text-blue-500" size={14} />
                    Setor: {group.sectorName}
                  </h3>
                  <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-2.5 py-0.5 rounded-full">
                    {group.list.length} {group.list.length === 1 ? "registro" : "registros"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.list.map((v) => {
                    const totalDays = calculateDays(v.startDate, v.endDate);
                    const isPending = v.status === "PENDING";

                    return (
                      <div
                        key={v.id}
                        className={`bg-white p-6 rounded-3xl border flex flex-col justify-between gap-5 transition-all hover:border-stone-300 ${
                          isPending 
                            ? "border-amber-200 bg-amber-50/10" 
                            : "border-stone-200/40"
                        }`}
                      >
                        <div className="space-y-4">
                          {/* Colaborador */}
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden border border-stone-100 bg-stone-50 shrink-0 flex items-center justify-center">
                              {v.user.avatar ? (
                                <img
                                  src={v.user.avatar}
                                  alt={v.user.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-500 font-bold text-lg flex items-center justify-center">
                                  {v.user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-stone-800 text-sm truncate">
                                {v.user.name}
                              </h4>
                              <span className="text-[11px] font-semibold text-stone-400 flex items-center gap-1 truncate uppercase">
                                <Building2 size={11} className="shrink-0" />
                                {v.user.jobPosition?.department?.name ||
                                  "Sem Setor"}{" "}
                                • {v.user.jobPosition?.name || "Sem Cargo"}
                              </span>
                            </div>
                          </div>

                          <hr className="border-stone-100" />

                          {/* Período */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                Período de Férias
                              </span>
                              {getStatusBadge(v.status)}
                            </div>
                            <div className="flex items-start gap-2.5">
                              <Calendar
                                className="text-blue-500 shrink-0 mt-0.5"
                                size={16}
                              />
                              <div>
                                <p className="text-sm font-bold text-stone-700">
                                  {formatDateString(v.startDate)} até{" "}
                                  {formatDateString(v.endDate)}
                                </p>
                                <p className="text-xs font-semibold text-stone-500 mt-0.5">
                                  {totalDays} dias de duração
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Observações */}
                          {v.comment && (
                            <div className="text-xs text-stone-500 italic flex gap-1.5 items-start bg-stone-50/50 p-2.5 rounded-xl border border-stone-100/50">
                              <Clock
                                size={12}
                                className="text-stone-450 shrink-0 mt-0.5"
                              />
                              <span className="line-clamp-2">{v.comment}</span>
                            </div>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="flex items-center justify-between border-t border-stone-100 pt-4 mt-1">
                          <span className="text-[10px] text-stone-400 font-medium">
                            {isPending
                              ? `Solicitado em: ${new Date(v.createdAt).toLocaleDateString("pt-BR")}`
                              : v.approvedBy?.name
                                ? `Aprovado por: ${v.approvedBy.name}`
                                : "Processado"}
                          </span>

                          {isPending ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleStatusChange(
                                    v.id,
                                    "REJECTED",
                                    prompt("Digite o motivo da recusa (opcional):") ||
                                      "",
                                  )
                                }
                                className="flex items-center justify-center p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                                title="Recusar Solicitação"
                              >
                                <XIcon size={14} />
                              </button>
                              <button
                                onClick={() => handleStatusChange(v.id, "APPROVED")}
                                className="flex items-center justify-center p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition-all cursor-pointer"
                                title="Aprovar Solicitação"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          ) : (
                            (activeTab === "ativas" || activeTab === "agendadas") ? (
                              <button
                                onClick={() => openCancelModal(v.id)}
                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                Cancelar Férias
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeleteVacation(v.id)}
                                className="text-stone-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                                title="Excluir Registro"
                              >
                                <Trash2 size={15} />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3 bg-stone-50/40 rounded-3xl border border-stone-200/40">
            <Palmtree size={48} className="text-stone-300" />
            <p className="text-stone-500 font-semibold text-sm">
              Nenhum registro de férias nesta categoria
            </p>
            <p className="text-stone-450 text-xs max-w-xs">
              Nenhum colaborador corresponde aos filtros ativos nesta categoria.
            </p>
          </div>
        )}
      </div>
      </div>

      {/* Modal para Registrar/Agendar Férias */}
      {isAdding && (
        <Modal
          isOpen={isAdding}
          onClose={() => {
            setIsAdding(false);
            setSelectedUserId("");
            setStartDate("");
            setEndDate("");
            setComment("");
            setErrorMessage("");
            setSuccessMessage("");
          }}
          title="Registrar / Agendar Férias"
          maxWidth="max-w-md"
        >
          <form
            onSubmit={handleRegisterVacation}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Colaborador
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={isSubmitting}
                className="w-full p-3 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none text-stone-700"
                required
              >
                <option value="">Selecione o colaborador...</option>
                {collaborators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.jobPosition?.name || "Sem cargo"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Tipo de Registro
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setStatus("APPROVED")}
                  className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    status === "APPROVED"
                      ? "bg-blue-50 text-blue-600 border-blue-200"
                      : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  Registrar Aprovadas
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("PENDING")}
                  className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    status === "PENDING"
                      ? "bg-blue-50 text-blue-600 border-blue-200"
                      : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  Cadastrar como Pendente
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Data de Início
                </label>
                <InputField
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Data de Término
                </label>
                <InputField
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Observações / Motivo (Opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
                placeholder="Ex: Férias relativas ao período aquisitivo de 2024."
                className="w-full min-h-[80px] p-3 rounded-xl border border-stone-300 text-sm focus:outline-none resize-none bg-white text-stone-700"
              />
            </div>

            {errorMessage && (
              <div className="text-xs text-red-500 flex items-center gap-1.5 mt-1 bg-red-50 p-2.5 rounded-xl border border-red-100">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="text-xs text-emerald-600 flex items-center gap-1.5 mt-1 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="flex justify-center gap-3 border-t border-stone-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setSelectedUserId("");
                  setStartDate("");
                  setEndDate("");
                  setComment("");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-400/50 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <SubmitButton
                text={isSubmitting ? "Salvando..." : "Confirmar"}
                disabled={isSubmitting}
                className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal para Justificar Cancelamento */}
      {isCanceling && (
        <Modal
          isOpen={isCanceling}
          onClose={() => {
            setIsCanceling(false);
            setVacationToCancelId(null);
            setCancelComment("");
          }}
          title="Confirmar Cancelamento de Férias"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmCancel} className="flex flex-col gap-4">
            <p className="text-xs text-stone-500 font-semibold leading-relaxed">
              Tem certeza de que deseja cancelar estas férias? Esta ação registrará o cancelamento no histórico do colaborador.
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Justificativa / Motivo do Cancelamento
              </label>
              <textarea
                value={cancelComment}
                onChange={(e) => setCancelComment(e.target.value)}
                disabled={isSubmittingCancel}
                placeholder="Insira o motivo do cancelamento..."
                required
                className="w-full min-h-[100px] p-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-550 focus:border-blue-500 resize-none bg-white text-stone-700"
              />
            </div>

            <div className="flex justify-center gap-3 border-t border-stone-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCanceling(false);
                  setVacationToCancelId(null);
                  setCancelComment("");
                }}
                disabled={isSubmittingCancel}
                className="px-4 py-2.5 rounded-xl border border-stone-400/50 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                Voltar
              </button>
              <SubmitButton
                text={isSubmittingCancel ? "Cancelando..." : "Confirmar Cancelamento"}
                disabled={isSubmittingCancel}
                className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs bg-red-500 hover:bg-red-600 text-white shadow-sm cursor-pointer"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
