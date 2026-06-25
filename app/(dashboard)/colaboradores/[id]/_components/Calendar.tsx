"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Info,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";
import Modal from "@/components/Modal";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";

interface WorkSchedule {
  id: string;
  userId: string;
  type: "FIXED" | "SPECIFIC";
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  scheduleData: {
    dias: Record<string, { trabalha: boolean; horas: number }>;
  };
  createdAt: string;
}

interface Vacation {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface CalendarProps {
  collaboratorId: string;
  readOnly?: boolean;
}

const DIAS_SEMANA_MAP = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const DIAS_SEMANA_SIGLA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function CalendarTab({ collaboratorId, readOnly = false }: CalendarProps) {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [timeRecords, setTimeRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para edição da semana fixa
  const [isEditingFixed, setIsEditingFixed] = useState(false);
  const [fixedDays, setFixedDays] = useState<Record<string, { trabalha: boolean; horas: number }>>({
    "0": { trabalha: false, horas: 0 },
    "1": { trabalha: true, horas: 8 },
    "2": { trabalha: true, horas: 8 },
    "3": { trabalha: true, horas: 8 },
    "4": { trabalha: true, horas: 8 },
    "5": { trabalha: true, horas: 8 },
    "6": { trabalha: false, horas: 0 },
  });

  // Estados para semana específica
  const [isAddingSpecific, setIsAddingSpecific] = useState(false);
  const [specStartDate, setSpecStartDate] = useState("");
  const [specEndDate, setSpecEndDate] = useState("");
  const [specDescription, setSpecDescription] = useState("");
  const [specDays, setSpecDays] = useState<Record<string, { trabalha: boolean; horas: number }>>({});
  const [isSubmittingSpecific, setIsSubmittingSpecific] = useState(false);
  const [step, setStep] = useState(1); // 1: Selecionar data, 2: Configurar dias

  // Estados do Calendário Mensal
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchSchedulesAndVacations = async () => {
    try {
      setLoading(true);
      const [resSchedules, resVacations, resPonto] = await Promise.all([
        fetch(`/api/escala?userId=${collaboratorId}`),
        fetch(`/api/ferias?userId=${collaboratorId}`),
        fetch(`/api/ponto?userId=${collaboratorId}`),
      ]);

      if (resSchedules.ok) {
        const data = await resSchedules.json();
        if (data.success) {
          setSchedules(data.data);
          // Atualiza a semana fixa se existir no banco
          const fixed = data.data.find((s: WorkSchedule) => s.type === "FIXED");
          if (fixed && fixed.scheduleData?.dias) {
            setFixedDays(fixed.scheduleData.dias);
          }
        }
      }

      if (resVacations.ok) {
        const data = await resVacations.json();
        if (data.success) {
          setVacations(data.data.filter((v: Vacation) => v.status === "APPROVED"));
        }
      }

      if (resPonto.ok) {
        const data = await resPonto.json();
        if (data.success) {
          setTimeRecords(data.data);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar escalas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collaboratorId) {
      fetchSchedulesAndVacations();
    }
  }, [collaboratorId]);

  // Salvar Semana Fixa
  const handleSaveFixed = async () => {
    try {
      const res = await fetch("/api/escala", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: collaboratorId,
          type: "FIXED",
          scheduleData: { dias: fixedDays },
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar semana fixa");
      const result = await res.json();
      if (result.success) {
        setIsEditingFixed(false);
        await fetchSchedulesAndVacations();
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar escala fixa.");
    }
  };

  // Gerar dias entre as datas da semana específica
  const handleNextStepSpecific = () => {
    if (!specStartDate || !specEndDate) {
      alert("Por favor, selecione as datas de início e fim.");
      return;
    }

    const start = new Date(specStartDate);
    const end = new Date(specEndDate);

    if (end < start) {
      alert("A data de término deve ser posterior à data de início.");
      return;
    }

    // Gerar objeto de dias
    const tempDays: Record<string, { trabalha: boolean; horas: number }> = {};
    const curr = new Date(start);
    while (curr <= end) {
      const dateString = curr.toISOString().split("T")[0];
      // Tenta herdar da semana fixa original
      const dayOfWeek = curr.getDay().toString();
      const fixedDefault = fixedDays[dayOfWeek] || { trabalha: false, horas: 0 };
      tempDays[dateString] = { trabalha: fixedDefault.trabalha, horas: fixedDefault.horas };
      curr.setDate(curr.getDate() + 1);
    }

    setSpecDays(tempDays);
    setStep(2);
  };

  // Salvar Semana Específica
  const handleSaveSpecific = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSpecific(true);

    try {
      const res = await fetch("/api/escala", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: collaboratorId,
          type: "SPECIFIC",
          startDate: specStartDate,
          endDate: specEndDate,
          description: specDescription.trim() || null,
          scheduleData: { dias: specDays },
        }),
      });

      if (!res.ok) throw new Error("Erro ao registrar semana específica");
      const result = await res.json();
      if (result.success) {
        setIsAddingSpecific(false);
        setSpecStartDate("");
        setSpecEndDate("");
        setSpecDescription("");
        setSpecDays({});
        setStep(1);
        await fetchSchedulesAndVacations();
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar escala específica.");
    } finally {
      setIsSubmittingSpecific(false);
    }
  };

  // Deletar Semana Específica
  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm("Deseja realmente remover esta escala específica?")) {
      return;
    }

    try {
      const res = await fetch(`/api/escala/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erro ao deletar escala");
      await fetchSchedulesAndVacations();
    } catch (error) {
      console.error(error);
      alert("Erro ao deletar escala.");
    }
  };

  // Auxiliares de cálculos de resumos
  const totalFixedWorkDays = Object.values(fixedDays).filter((d) => d.trabalha).length;
  const totalFixedHours = Object.values(fixedDays).reduce((acc, d) => acc + (d.trabalha ? d.horas : 0), 0);
  const monthlyEstimatedDays = Math.round(totalFixedWorkDays * 4.33);
  const monthlyEstimatedHours = Math.round(totalFixedHours * 4.33);

  // Auxiliares do Calendário Mensal
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Determinar status de um dia específico do mês para renderizar
  const getDayStatus = (dayDate: Date) => {
    const dateStr = dayDate.toISOString().split("T")[0];

    // 1. Verificar Férias Aprovadas
    const onVacation = vacations.some((v) => {
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      const utcStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
      const utcEnd = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59);
      return dayDate >= utcStart && dayDate <= utcEnd;
    });

    if (onVacation) {
      return { type: "VACATION", label: "Férias", horas: 0 };
    }

    // 2. Verificar Semanas Específicas (Ordem decrescente de criação/ID para pegar a mais recente se sobrepor)
    const specificSchedules = schedules.filter((s) => s.type === "SPECIFIC");
    for (const spec of specificSchedules) {
      if (spec.startDate && spec.endDate) {
        const start = new Date(spec.startDate);
        const end = new Date(spec.endDate);
        const utcStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
        const utcEnd = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59);

        if (dayDate >= utcStart && dayDate <= utcEnd) {
          const specDayConfig = spec.scheduleData.dias[dateStr];
          if (specDayConfig) {
            return {
              type: "SPECIFIC",
              label: specDayConfig.trabalha ? `${specDayConfig.horas}h` : "Folga",
              horas: specDayConfig.horas,
              trabalha: specDayConfig.trabalha,
              description: spec.description || "Escala Específica",
            };
          }
        }
      }
    }

    // 3. Semana Fixa padrão
    const dayOfWeek = dayDate.getDay().toString();
    const fixedConfig = fixedDays[dayOfWeek] || { trabalha: false, horas: 0 };
    return {
      type: "FIXED",
      label: fixedConfig.trabalha ? `${fixedConfig.horas}h` : "Folga",
      horas: fixedConfig.horas,
      trabalha: fixedConfig.trabalha,
    };
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-stone-500 font-semibold text-sm animate-pulse">
          Carregando calendário do colaborador...
        </p>
      </div>
    );
  }

  // Montar Grid do Calendário
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayIndex = getFirstDayOfMonth(currentDate);
  const calendarDays = [];

  // Espaços em branco antes do dia 1
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }

  // Dias do mês
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }

  const specificPeriods = schedules.filter((s) => s.type === "SPECIFIC");

  return (
    <div className="w-full space-y-6">
      {/* 1. SEÇÃO DE CONFIGURAÇÃO FIXA */}
      <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-md font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
              <Clock className="text-blue-500" size={20} />
              Jornada de Trabalho Padrão (Semana Fixa)
            </h3>
            <p className="text-xs text-stone-400 font-semibold mt-1">
              Define os dias de trabalho padrão recorrentes do colaborador.
            </p>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-2">
              {isEditingFixed ? (
                <>
                  <button
                    onClick={() => setIsEditingFixed(false)}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveFixed}
                    className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Save size={14} />
                    Salvar Alterações
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditingFixed(true)}
                  className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  <Edit size={14} />
                  Editar Semana Fixa
                </button>
              )}
            </div>
          )}
        </div>

        {/* Resumo Rápido de Horas/Dias */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100/60 text-center">
            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Dias/Semana</h4>
            <p className="text-lg font-bold text-stone-700 mt-1">{totalFixedWorkDays} dias</p>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100/60 text-center">
            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Horas/Semana</h4>
            <p className="text-lg font-bold text-stone-700 mt-1">{totalFixedHours}h</p>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100/60 text-center">
            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Dias/Mês (Estimado)</h4>
            <p className="text-lg font-bold text-stone-700 mt-1">{monthlyEstimatedDays} dias</p>
          </div>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100/60 text-center">
            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Horas/Mês (Estimado)</h4>
            <p className="text-lg font-bold text-stone-700 mt-1">{monthlyEstimatedHours}h</p>
          </div>
        </div>

        {/* Grade de Dias da Semana Fixa */}
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {DIAS_SEMANA_MAP.map((diaNome, idx) => {
            const diaKey = idx.toString();
            const config = fixedDays[diaKey] || { trabalha: false, horas: 0 };

            return (
              <div
                key={diaKey}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-between gap-3 transition-all ${
                  config.trabalha
                    ? "bg-emerald-50/40 border-emerald-100 text-emerald-800"
                    : "bg-stone-50/40 border-stone-200/80 text-stone-400"
                }`}
              >
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-wider">{DIAS_SEMANA_SIGLA[idx]}</p>
                  <p className="text-[9px] text-stone-400 font-semibold leading-3">{diaNome}</p>
                </div>

                {isEditingFixed ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    {/* Toggle Trabalha/Folga */}
                    <button
                      onClick={() =>
                        setFixedDays((prev) => ({
                          ...prev,
                          [diaKey]: {
                            ...prev[diaKey],
                            trabalha: !prev[diaKey].trabalha,
                            horas: !prev[diaKey].trabalha ? 8 : 0, // padrão 8h ao ativar
                          },
                        }))
                      }
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border w-full text-center transition-all cursor-pointer ${
                        config.trabalha
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50"
                      }`}
                    >
                      {config.trabalha ? "Trabalho" : "Folga"}
                    </button>

                    {/* Inputs de Horas se Trabalha */}
                    {config.trabalha && (
                      <div className="flex items-center gap-1 w-full mt-1">
                        <input
                          type="number"
                          min="1"
                          max="24"
                          value={config.horas}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setFixedDays((prev) => ({
                              ...prev,
                              [diaKey]: { ...prev[diaKey], horas: val },
                            }));
                          }}
                          className="w-full bg-white border border-stone-250 rounded-lg py-1 px-1.5 text-center text-xs font-bold text-stone-700 focus:outline-none"
                        />
                        <span className="text-[10px] font-bold text-stone-500">h</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    {config.trabalha ? (
                      <div className="flex flex-col items-center">
                        <span className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Trabalho
                        </span>
                        <span className="text-md font-bold mt-1 text-emerald-800">{config.horas}h</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="bg-stone-200 text-stone-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Folga
                        </span>
                        <span className="text-md font-bold mt-1 text-stone-400">—</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. SEÇÃO DE PERÍODOS ESPECÍFICOS / TEMPORÁRIOS */}
      <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-md font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="text-blue-500" size={20} />
              Períodos Específicos (Semana Específica/Temporária)
            </h3>
            <p className="text-xs text-stone-400 font-semibold mt-1">
              Cadastre escalas com datas de início e fim que sobrepõem a semana fixa temporariamente.
            </p>
          </div>

          {!readOnly && (
            <button
              onClick={() => {
                setStep(1);
                setIsAddingSpecific(true);
              }}
              className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus size={16} />
              Inserir Semana Específica
            </button>
          )}
        </div>

        {/* Lista de Escalas Específicas Cadastradas */}
        {specificPeriods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specificPeriods.map((spec) => {
              const startStr = spec.startDate ? new Date(spec.startDate).toLocaleDateString("pt-BR") : "";
              const endStr = spec.endDate ? new Date(spec.endDate).toLocaleDateString("pt-BR") : "";
              const workDaysCount = Object.values(spec.scheduleData.dias).filter((d) => d.trabalha).length;

              return (
                <div key={spec.id} className="bg-stone-50/50 p-5 rounded-2xl border border-stone-200/60 shadow-sm flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Específica/Temporária
                      </span>
                      {!readOnly && (
                        <button
                          onClick={() => handleDeleteSchedule(spec.id)}
                          className="text-stone-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                          title="Excluir período"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <Calendar className="text-blue-500 shrink-0" size={16} />
                      <p className="text-sm font-bold text-stone-700">
                        {startStr} até {endStr}
                      </p>
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <Clock className="text-stone-400 shrink-0" size={16} />
                      <p className="text-xs text-stone-500 font-semibold">
                        {workDaysCount} dias de trabalho cadastrados
                      </p>
                    </div>

                    {spec.description && (
                      <div className="mt-2.5 flex items-start gap-1.5 bg-white p-2.5 rounded-xl border border-stone-150 text-xs text-stone-500 italic">
                        <FileText size={14} className="text-stone-400 shrink-0 mt-0.5" />
                        <span>{spec.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-stone-400 italic text-xs bg-stone-50/50 p-4 rounded-xl border border-stone-100">
            Nenhum período específico ou de plantão cadastrado.
          </p>
        )}
      </div>

      {/* 3. CALENDÁRIO MENSAL VISUAL */}
      <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-md font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="text-blue-500" size={20} />
              Calendário Mensal do Colaborador
            </h3>
            <p className="text-xs text-stone-400 font-semibold mt-1">
              Visualização dos dias de expediente do mês. Períodos específicos e férias sobrepõem a escala fixa.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200/80 rounded-xl p-1 shrink-0">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-lg text-stone-600 transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-stone-700 px-3 py-1 capitalize select-none">
              {currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
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
            <div className="w-3.5 h-3.5 rounded-md bg-emerald-500" />
            <span className="text-stone-600">Trabalho (Fixo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-md bg-blue-500" />
            <span className="text-stone-600">Período Específico</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-md bg-orange-400" />
            <span className="text-stone-600">Férias</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-md bg-stone-100 border border-stone-200" />
            <span className="text-stone-500">Folga</span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-600">
            <Check size={14} className="text-blue-500 animate-pulse" strokeWidth={3} />
            <span>Trabalhado (Expediente)</span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-600">
            <div className="flex items-center gap-0.5 text-orange-500">
              <Check size={14} strokeWidth={3} />
              <Info size={11} strokeWidth={2.5} />
            </div>
            <span>Trabalhado (Folga/Extra)</span>
          </div>
        </div>

        {/* Grade do Calendário */}
        <div className="w-full overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
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
              const dayStatus = getDayStatus(dayDate);

              // Verificar se houve registro de ponto finalizado para este dia
              const record = timeRecords.find((r) => {
                const rDate = new Date(r.date);
                const ry = rDate.getUTCFullYear();
                const rm = rDate.getUTCMonth();
                const rd = rDate.getUTCDate();
                
                return (
                  ry === dayDate.getFullYear() &&
                  rm === dayDate.getMonth() &&
                  rd === dayDate.getDate()
                );
              });
              const hasWorked = record && record.entryTime && record.exitTime;

              let dayClasses = "bg-stone-50 text-stone-400 border border-stone-150/40";
              let badgeClasses = "bg-stone-200 text-stone-500";
              if (dayStatus.type === "VACATION") {
                dayClasses = "bg-orange-50 text-orange-855 border border-orange-200 shadow-sm";
                badgeClasses = "bg-orange-400 text-white";
              } else if (dayStatus.type === "SPECIFIC") {
                if (dayStatus.trabalha) {
                  dayClasses = "bg-blue-50/80 text-blue-900 border border-blue-200 shadow-sm";
                  badgeClasses = "bg-blue-500 text-white";
                } else {
                  dayClasses = "bg-stone-100/80 text-stone-450 border border-stone-250/50 italic";
                  badgeClasses = "bg-stone-300 text-stone-600";
                }
              } else if (dayStatus.type === "FIXED" && dayStatus.trabalha) {
                dayClasses = "bg-emerald-50 text-emerald-900 border border-emerald-100 shadow-sm";
                badgeClasses = "bg-emerald-500 text-white";
              }

              return (
                <div
                  key={dayDate.toISOString()}
                  className={`aspect-square p-2 rounded-2xl flex flex-col justify-between items-start transition-all hover:scale-[1.02] hover:z-30 relative group ${dayClasses}`}
                >
                  <span className="text-xs font-extrabold select-none">{dayNum}</span>

                  <div className="w-full flex items-center justify-between mt-auto pt-1">
                    {/* Indicador de Ponto Batido (Trabalhado) */}
                    <div className="flex items-center">
                      {hasWorked && (
                        dayStatus.trabalha ? (
                          <div className="flex items-center text-blue-500" title="Usuário trabalhou nesse dia">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5 text-orange-500 group/tooltip relative cursor-help">
                            <Check size={14} strokeWidth={3} />
                            <Info size={11} strokeWidth={2.5} />
                            
                            {/* Tooltip personalizado */}
                            <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover/tooltip:block z-35 bg-stone-900 text-stone-50 text-[10px] py-1.5 px-2.5 rounded-xl shadow-lg w-48 text-left border border-stone-800 leading-relaxed font-semibold">
                              Colaborador trabalhou em um dia que não era de expediente (folga/férias).
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md leading-3 select-none ${badgeClasses}`}>
                      {dayStatus.label}
                    </span>
                  </div>

                  {/* Tooltip de descrição se houver escala específica */}
                  {dayStatus.type === "SPECIFIC" && dayStatus.description && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 bg-stone-900 text-stone-50 text-[10px] py-1.5 px-2.5 rounded-xl shadow-lg w-48 text-center border border-stone-800">
                      <p className="font-bold text-blue-300 uppercase tracking-wider text-[8px] mb-0.5">Escala Temporária</p>
                      <p className="leading-relaxed">&quot;{dayStatus.description}&quot;</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. MODAL PARA INSERIR SEMANA ESPECÍFICA */}
      {isAddingSpecific && (
        <Modal
          isOpen={isAddingSpecific}
          onClose={() => {
            setIsAddingSpecific(false);
            setSpecStartDate("");
            setSpecEndDate("");
            setSpecDescription("");
            setSpecDays({});
            setStep(1);
          }}
          title="Inserir Semana Específica"
          maxWidth={step === 1 ? "max-w-md" : "max-w-xl"}
        >
          {step === 1 ? (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                Selecione as datas de início e fim da semana específica. Ela irá sobrepor a semana fixa padrão nesse período.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Data de Início
                  </label>
                  <InputField
                    type="date"
                    value={specStartDate}
                    onChange={(e) => setSpecStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Data de Término
                  </label>
                  <InputField
                    type="date"
                    value={specEndDate}
                    onChange={(e) => setSpecEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-stone-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSpecific(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-400/50 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-semibold cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleNextStepSpecific}
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Configurar Dias
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveSpecific} className="flex flex-col gap-5">
              <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-2xl flex items-start gap-2 text-xs text-blue-700 font-semibold">
                <Info size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p>Configurando período temporário:</p>
                  <p className="font-bold text-sm mt-0.5">
                    {new Date(specStartDate).toLocaleDateString("pt-BR")} até {new Date(specEndDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              {/* Tabela Interativa de Dias do Período */}
              <div className="w-full max-h-[300px] overflow-y-auto border border-stone-200/80 rounded-2xl divide-y divide-stone-100 bg-white">
                {Object.entries(specDays).map(([dateStr, config]) => {
                  const date = new Date(`${dateStr}T12:00:00`); // Evita fuso horário local
                  const weekdayName = DIAS_SEMANA_MAP[date.getDay()];
                  const formattedDate = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

                  return (
                    <div key={dateStr} className="flex items-center justify-between p-3.5 gap-4">
                      <div>
                        <p className="text-sm font-bold text-stone-700">
                          {formattedDate} - {weekdayName}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Toggle de folga/trabalho */}
                        <button
                          type="button"
                          onClick={() =>
                            setSpecDays((prev) => ({
                              ...prev,
                              [dateStr]: {
                                ...prev[dateStr],
                                trabalha: !prev[dateStr].trabalha,
                                horas: !prev[dateStr].trabalha ? 8 : 0,
                              },
                            }))
                          }
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            config.trabalha
                              ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                              : "bg-stone-50 text-stone-500 border-stone-250 hover:bg-stone-100"
                          }`}
                        >
                          {config.trabalha ? "Trabalho" : "Folga"}
                        </button>

                        {/* Input de Horas se trabalha */}
                        {config.trabalha && (
                          <div className="flex items-center gap-1 w-20">
                            <input
                              type="number"
                              min="1"
                              max="24"
                              value={config.horas}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setSpecDays((prev) => ({
                                  ...prev,
                                  [dateStr]: { ...prev[dateStr], horas: val },
                                }));
                              }}
                              className="w-full bg-white border border-stone-250 rounded-lg py-1 px-1.5 text-center text-xs font-bold text-stone-700 focus:outline-none"
                            />
                            <span className="text-[10px] font-bold text-stone-500">h</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Descrição / Motivo (Ex: Plantão, Mutirão de testes)
                </label>
                <textarea
                  value={specDescription}
                  onChange={(e) => setSpecDescription(e.target.value)}
                  disabled={isSubmittingSpecific}
                  placeholder="Insira observações ou descrição do motivo..."
                  className="w-full min-h-[70px] p-3 rounded-xl border border-stone-300 text-sm focus:outline-none resize-none bg-white text-stone-700"
                />
              </div>

              {/* Ações */}
              <div className="flex justify-center gap-3 border-t border-stone-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isSubmittingSpecific}
                  className="px-4 py-2.5 rounded-xl border border-stone-400/50 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-semibold cursor-pointer"
                >
                  Voltar
                </button>
                <SubmitButton
                  text={isSubmittingSpecific ? "Salvando..." : "Confirmar e Salvar"}
                  disabled={isSubmittingSpecific}
                  className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs bg-blue-500 hover:bg-blue-600 text-white shadow-sm cursor-pointer"
                />
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
