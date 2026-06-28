"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  MessageSquare,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Info
} from "lucide-react";
import SectionComponent from "@/components/SectionComponent";
import TittleHeader from "@/components/TittleHeader";
import Breadcrumb from "@/components/Breadcrumb";
import Modal from "@/components/Modal";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";

interface DayOffRequest {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  comment: string | null;
  createdAt: string;
}

export default function CentralFolgas() {
  const [dayOffs, setDayOffs] = useState<DayOffRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de solicitação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigation = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Central de Folgas", href: "/folgas" }
  ];

  const fetchDayOffs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/folgas");
      const json = await res.json();
      if (json.success && json.data) {
        setDayOffs(json.data);
      }
    } catch (err) {
      console.error("Erro ao buscar histórico de folgas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDayOffs();
  }, []);

  const handleRequestDayOff = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!startDate || !endDate) {
      setErrorMsg("Por favor, preencha as datas de início e fim.");
      return;
    }

    if (!comment.trim()) {
      setErrorMsg("Por favor, informe a justificativa para a solicitação.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      setErrorMsg("A data de término deve ser posterior à data de início.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/folgas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          comment: comment.trim()
        })
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao enviar solicitação.");
      }

      setSuccessMsg("Solicitação de folga enviada com sucesso!");
      setStartDate("");
      setEndDate("");
      setComment("");

      // Atualiza histórico
      await fetchDayOffs();

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg("");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de conexão ao enviar solicitação.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    if (!window.confirm("Tem certeza de que deseja cancelar esta solicitação de folga?")) {
      return;
    }

    try {
      const res = await fetch(`/api/folgas/${id}`, {
        method: "DELETE"
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao cancelar solicitação");
      }

      await fetchDayOffs();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao cancelar solicitação.");
    }
  };

  const formatDateString = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const calculateDays = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getStatusDetails = (status: string, endDateStr: string) => {
    if (status === "PENDING") {
      return { label: "Pendente", bg: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    if (status === "REJECTED") {
      return { label: "Recusada", bg: "bg-rose-50 text-rose-700 border-rose-200" };
    }
    if (status === "CANCELLED") {
      return { label: "Cancelada", bg: "bg-stone-50 text-stone-500 border-stone-200" };
    }
    if (status === "APPROVED") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);
      if (today > end) {
        return { label: "Concluída", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      }
      return { label: "Aprovada", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    return { label: status, bg: "bg-stone-100 text-stone-700 border-stone-200" };
  };

  return (
    <SectionComponent>
      <TittleHeader tittle="Central de Folgas" className="w-full" />
      <div className="w-full flex items-center justify-between flex-wrap gap-4">
        <Breadcrumb items={navigation} />
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={18} />
          Solicitar Folga
        </button>
      </div>

      <div className="w-full bg-white rounded-3xl shadow-xl border border-stone-100 p-8 mt-6">
        <h3 className="text-md font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2 mb-6">
          <Clock className="text-blue-500" size={20} />
          Meu Histórico de Folgas
        </h3>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-stone-400 text-sm font-medium">Carregando histórico de folgas...</p>
          </div>
        ) : (
          <div className="w-full">
            {dayOffs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dayOffs.map((d) => {
                  const totalDays = calculateDays(d.startDate, d.endDate);
                  const isPending = d.status === "PENDING";
                  const statusInfo = getStatusDetails(d.status, d.endDate);

                  return (
                    <div
                      key={d.id}
                      className="flex flex-col justify-between gap-5 bg-stone-50/50 p-6 rounded-2xl border border-stone-200/60 hover:bg-stone-50 transition-all shadow-xs min-h-[170px]"
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider border ${statusInfo.bg}`}>
                            {statusInfo.label}
                          </span>
                          {isPending && (
                            <button
                              onClick={() => handleCancelRequest(d.id)}
                              className="text-stone-400 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-xl cursor-pointer"
                              title="Cancelar solicitação"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar className="text-blue-500 shrink-0 mt-0.5" size={18} />
                          <div>
                            <p className="text-sm font-bold text-stone-850">
                              {formatDateString(d.startDate)} - {formatDateString(d.endDate)}
                            </p>
                            <p className="text-xs font-semibold text-stone-500 mt-1">
                              {totalDays} {totalDays === 1 ? "dia" : "dias"} de duração
                            </p>
                          </div>
                        </div>

                        {d.comment && (
                          <div className="text-xs text-stone-600 bg-white p-3 rounded-xl border border-stone-200/50 flex gap-2 items-start">
                            <MessageSquare size={14} className="text-stone-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{d.comment}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400 border-t border-stone-200/50 pt-2.5 flex items-center justify-between">
                        <span>Solicitado em:</span>
                        <span className="font-semibold">{formatDateString(d.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center gap-3 bg-stone-50/20 rounded-2xl border border-stone-150">
                <Clock size={44} className="text-stone-300 animate-pulse" />
                <p className="text-stone-600 font-bold text-sm">Nenhuma solicitação de folga registrada</p>
                <p className="text-stone-450 text-xs max-w-sm">
                  Precisa de um descanso? Clique no botão no canto superior direito para solicitar uma folga ao time de Recursos Humanos.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para Solicitar Folga */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setStartDate("");
            setEndDate("");
            setComment("");
            setErrorMsg("");
            setSuccessMsg("");
          }}
          title="Nova Solicitação de Folga"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRequestDayOff} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Data de Início
                </label>
                <InputField
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Data de Término
                </label>
                <InputField
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                Justificativa / Motivo
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={submitting}
                placeholder="Informe o motivo da solicitação de folga..."
                required
                className="w-full min-h-[100px] p-3.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white text-stone-700 placeholder-stone-400"
              />
            </div>

            {errorMsg && (
              <div className="text-xs text-red-600 flex items-center gap-2 bg-red-50 p-3 rounded-xl border border-red-200">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="text-xs text-emerald-700 flex items-center gap-2 font-semibold bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex justify-center gap-3 border-t border-stone-100 pt-5 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setStartDate("");
                  setEndDate("");
                  setComment("");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                disabled={submitting}
                className="px-5 py-3 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <SubmitButton
                text={submitting ? "Enviando..." : "Confirmar"}
                disabled={submitting}
                className="!w-auto !py-3 !px-6 rounded-xl font-bold text-xs shadow-md cursor-pointer"
              />
            </div>
          </form>
        </Modal>
      )}
    </SectionComponent>
  );
}
