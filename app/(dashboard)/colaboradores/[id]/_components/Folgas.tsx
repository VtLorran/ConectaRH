"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Plus,
  Clock,
  Check,
  X as XIcon,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
} from "lucide-react";
import Modal from "@/components/Modal";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";

interface DayOff {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  comment: string | null;
  createdAt: string;
  approvedBy?: {
    name: string;
  } | null;
}

interface FolgasProps {
  collaboratorId: string;
  onUpdate?: () => void;
}

export default function Folgas({ collaboratorId, onUpdate }: FolgasProps) {
  const [dayOffs, setDayOffs] = useState<DayOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"APPROVED" | "PENDING">("APPROVED"); // Admins default to APPROVED

  // Feedback states
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchDayOffs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/folgas?userId=${collaboratorId}`);
      if (!res.ok) throw new Error("Erro ao buscar folgas");
      const result = await res.json();
      if (result.success) {
        setDayOffs(result.data);
      }
    } catch (error) {
      console.error("Erro ao carregar folgas do colaborador:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collaboratorId) {
      fetchDayOffs();
    }
  }, [collaboratorId]);

  const handleRegisterDayOff = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!startDate || !endDate) {
      setErrorMessage("Por favor, preencha as datas de início e fim.");
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
      const res = await fetch("/api/folgas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: collaboratorId,
          startDate,
          endDate,
          comment: comment.trim() || null,
          status,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao registrar folga");
      }

      setSuccessMessage(
        status === "APPROVED"
          ? "Folga registrada e aprovada com sucesso!"
          : "Solicitação de folga enviada com sucesso!"
      );
      
      // Reset form
      setStartDate("");
      setEndDate("");
      setComment("");
      setStatus("APPROVED");

      // Reload list
      await fetchDayOffs();
      if (onUpdate) onUpdate();

      setTimeout(() => {
        setIsAdding(false);
        setSuccessMessage("");
      }, 1500);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Erro ao salvar registro de folga.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (dayOffId: string, newStatus: "APPROVED" | "REJECTED", rejectionComment?: string) => {
    try {
      const res = await fetch(`/api/folgas/${dayOffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          comment: rejectionComment !== undefined ? rejectionComment : undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao atualizar status");
      }

      // Reload list
      await fetchDayOffs();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao processar alteração de status.");
    }
  };

  const handleDeleteDayOff = async (dayOffId: string) => {
    if (!window.confirm("Tem certeza de que deseja excluir este registro de folga do histórico? Isso também reverterá a escala específica.")) {
      return;
    }

    try {
      const res = await fetch(`/api/folgas/${dayOffId}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao excluir folga");
      }

      await fetchDayOffs();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao excluir folga.");
    }
  };

  const formatDateString = (dateStr: string) => {
    const date = new Date(dateStr);
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString("pt-BR");
  };

  const calculateDays = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

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

  const pendingRequests = dayOffs.filter((d) => d.status === "PENDING");
  const approvedRequests = dayOffs.filter((d) => d.status === "APPROVED");
  const inactiveRequests = dayOffs.filter((d) => d.status === "REJECTED" || d.status === "CANCELLED");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Classificar aprovadas entre em andamento, futuras e passadas
  const activeDayOffs = approvedRequests.filter((d) => {
    const start = new Date(d.startDate);
    const end = new Date(d.endDate);
    const utcStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const utcEnd = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59);
    return today >= utcStart && today <= utcEnd;
  });

  const scheduledDayOffs = approvedRequests.filter((d) => {
    const start = new Date(d.startDate);
    const utcStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    return utcStart > today;
  });

  const pastDayOffs = approvedRequests.filter((d) => {
    const end = new Date(d.endDate);
    const utcEnd = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59);
    return utcEnd < today;
  });

  const historyDayOffs = [...pastDayOffs, ...inactiveRequests].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-stone-500 font-semibold text-sm animate-pulse">
          Carregando histórico de folgas...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 border-b border-stone-100 pb-3">
        <h3 className="text-md font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="text-blue-500" size={20} />
          Folgas do Colaborador
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          Registrar / Agendar Folga
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/60 flex items-center gap-4">
          <div className="p-3 bg-emerald-500 text-white rounded-xl">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Folga Hoje</h4>
            <p className="text-lg font-bold text-emerald-800">{activeDayOffs.length > 0 ? "Sim (De Folga)" : "Não"}</p>
          </div>
        </div>

        <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100/60 flex items-center gap-4">
          <div className="p-3 bg-blue-500 text-white rounded-xl">
            <Calendar size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Folgas Agendadas</h4>
            <p className="text-lg font-bold text-blue-800">{scheduledDayOffs.length}</p>
          </div>
        </div>

        <div className="bg-stone-50/50 p-4 rounded-2xl border border-stone-200/50 flex items-center gap-4">
          <div className="p-3 bg-stone-500 text-white rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Folgas Gozadas (Histórico)</h4>
            <p className="text-lg font-bold text-stone-700">{pastDayOffs.length}</p>
          </div>
        </div>
      </div>

      {/* Grid de Seções de Folga */}
      <div className="space-y-6">
        {/* 1. Solicitações Pendentes */}
        {pendingRequests.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} /> Solicitações Pendentes de Aprovação ({pendingRequests.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((d) => {
                const totalDays = calculateDays(d.startDate, d.endDate);
                return (
                  <div key={d.id} className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Período Solicitado</span>
                        {getStatusBadge(d.status)}
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="text-amber-500 shrink-0" size={18} />
                        <div className="text-sm font-bold text-stone-800">
                          {formatDateString(d.startDate)} até {formatDateString(d.endDate)}
                          <span className="block text-xs font-semibold text-stone-500 mt-0.5">{totalDays} {totalDays === 1 ? "dia" : "dias"} de duração</span>
                        </div>
                      </div>
                      {d.comment && (
                        <div className="flex gap-1.5 bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-xs text-stone-600 mt-2 italic">
                          <MessageSquare size={14} className="text-stone-400 shrink-0 mt-0.5" />
                          <span>&quot;{d.comment}&quot;</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-stone-100 pt-3 mt-1">
                      <span className="text-[10px] text-stone-400 font-medium">Solicitado em: {new Date(d.createdAt).toLocaleDateString("pt-BR")}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(d.id, "REJECTED", prompt("Digite a justificativa da recusa (opcional):") || "")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold cursor-pointer transition-all"
                        >
                          <XIcon size={14} /> Recusar
                        </button>
                        <button
                          onClick={() => handleStatusChange(d.id, "APPROVED")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-bold cursor-pointer transition-all"
                        >
                          <Check size={14} /> Aprovar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Folgas Ativas */}
        {activeDayOffs.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Folgas Ativas (Ocorrendo Hoje)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeDayOffs.map((d) => {
                const totalDays = calculateDays(d.startDate, d.endDate);
                return (
                  <div key={d.id} className="bg-gradient-to-r from-emerald-50/50 to-teal-50/20 p-5 rounded-2xl border border-emerald-100 shadow-md flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Período Corrente</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white uppercase tracking-wider animate-pulse">EM ANDAMENTO</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="text-emerald-500 shrink-0" size={18} />
                      <div className="text-sm font-bold text-stone-800">
                        {formatDateString(d.startDate)} até {formatDateString(d.endDate)}
                        <span className="block text-xs font-semibold text-emerald-600 mt-0.5">{totalDays} {totalDays === 1 ? "dia" : "dias"} de folga</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-stone-100 pt-3 mt-1 text-[10px] text-stone-400">
                      <span>Aprovado por: {d.approvedBy?.name || "RH"}</span>
                      <button
                        onClick={() => handleDeleteDayOff(d.id)}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Excluir / Cancelar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Folgas Agendadas */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={14} /> Folgas Agendadas Futuramente ({scheduledDayOffs.length})
          </h4>
          {scheduledDayOffs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scheduledDayOffs.map((d) => {
                const totalDays = calculateDays(d.startDate, d.endDate);
                return (
                  <div key={d.id} className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex flex-col gap-3 hover:border-blue-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Período Agendado</span>
                      {getStatusBadge(d.status)}
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="text-blue-500 shrink-0" size={18} />
                      <div className="text-sm font-bold text-stone-800">
                        {formatDateString(d.startDate)} até {formatDateString(d.endDate)}
                        <span className="block text-xs font-semibold text-stone-500 mt-0.5">{totalDays} {totalDays === 1 ? "dia" : "dias"} agendados</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-stone-100 pt-3 mt-1 text-[10px] text-stone-400">
                      <span>Aprovado por: {d.approvedBy?.name || "RH"}</span>
                      <button
                        onClick={() => handleDeleteDayOff(d.id)}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Excluir / Cancelar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-stone-400 italic text-xs bg-stone-50/50 p-4 rounded-xl border border-stone-100">Nenhuma folga futura agendada.</p>
          )}
        </div>

        {/* 4. Histórico (Realizadas e Rejeitadas) */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} /> Histórico de Folgas e Decisões ({historyDayOffs.length})
          </h4>
          {historyDayOffs.length > 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-x-auto no-scrollbar shadow-sm">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    <th className="p-4">Período</th>
                    <th className="p-4">Duração</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Detalhes</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {historyDayOffs.map((d) => {
                    const totalDays = calculateDays(d.startDate, d.endDate);
                    return (
                      <tr key={d.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-4 font-bold text-stone-700">
                          {formatDateString(d.startDate)} - {formatDateString(d.endDate)}
                        </td>
                        <td className="p-4 text-stone-500 font-semibold">{totalDays} {totalDays === 1 ? "dia" : "dias"}</td>
                        <td className="p-4">{getStatusBadge(d.status)}</td>
                        <td className="p-4 text-xs text-stone-500 max-w-xs truncate">
                          {d.status === "REJECTED" && (
                            <span className="text-rose-600 block font-medium">
                              Motivo da recusa: {d.comment || "Não informado"}
                            </span>
                          )}
                          {d.status === "CANCELLED" && (
                            <span className="text-stone-650 block font-medium">
                              {d.comment || "Folga cancelada"}
                            </span>
                          )}
                          {d.status === "APPROVED" && (
                            <span className="block text-[11px] text-stone-400">
                              Realizadas com sucesso • Aprovadas por {d.approvedBy?.name || "RH"}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteDayOff(d.id)}
                            className="text-stone-450 hover:text-red-500 p-1.5 rounded transition-all inline-flex cursor-pointer"
                            title="Remover do histórico"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-stone-400 italic text-xs bg-stone-50/50 p-4 rounded-xl border border-stone-100">Sem histórico registrado.</p>
          )}
        </div>
      </div>

      {/* Modal para Adicionar / Agendar Folga */}
      {isAdding && (
        <Modal
          isOpen={isAdding}
          onClose={() => {
            setIsAdding(false);
            setStartDate("");
            setEndDate("");
            setComment("");
            setErrorMessage("");
            setSuccessMessage("");
          }}
          title="Registrar / Agendar Folga"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRegisterDayOff} className="flex flex-col gap-4">
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
                  Criar como Pendente
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
                Observações / Justificativa (Opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
                placeholder="Ex: Folga compensatória referente ao plantão de feriado"
                className="w-full min-h-[80px] p-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-550 focus:border-blue-500 resize-none bg-white text-stone-700"
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
    </div>
  );
}
