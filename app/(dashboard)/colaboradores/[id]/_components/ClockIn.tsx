"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Plus,
  Trash2,
  Edit,
  X,
  Info,
  Calendar,
  Coffee,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
  Settings
} from "lucide-react";
import Modal from "@/components/Modal";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";

interface PauseCategory {
  id: string;
  name: string;
  duration: number; // in minutes
}

interface TimeRecordPause {
  id: string;
  pauseCategoryId: string;
  pauseCategory: PauseCategory;
  startTime: string; // ISO String
  endTime: string | null; // ISO String
}

interface TimeRecord {
  id: string;
  userId: string;
  date: string; // ISO String
  entryTime: string | null; // ISO String
  exitTime: string | null; // ISO String
  pauses: TimeRecordPause[];
  createdAt: string;
}

interface ClockInProps {
  collaboratorId: string;
  onUpdate?: () => void;
}

interface PauseFormInput {
  pauseCategoryId: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

export default function ClockIn({ collaboratorId, onUpdate }: ClockInProps) {
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [pauseCategories, setPauseCategories] = useState<PauseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal manual record states
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const [recordDate, setRecordDate] = useState("");
  const [entryTime, setEntryTime] = useState("08:00");
  const [exitTime, setExitTime] = useState("17:00");
  const [formPauses, setFormPauses] = useState<PauseFormInput[]>([]);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Modal pause categories states
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDuration, setNewCategoryDuration] = useState("60");
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // UI state
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const getTodayLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchPontoData = async () => {
    try {
      setLoading(true);
      const [resRecords, resCategories] = await Promise.all([
        fetch(`/api/ponto?userId=${collaboratorId}`),
        fetch(`/api/ponto/categorias`)
      ]);

      if (resRecords.ok) {
        const result = await resRecords.json();
        if (result.success) {
          setRecords(result.data);
        }
      }

      if (resCategories.ok) {
        const result = await resCategories.json();
        if (result.success) {
          setPauseCategories(result.data);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do ponto:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collaboratorId) {
      fetchPontoData();
    }
  }, [collaboratorId]);

  // Duration calculations helper
  const getDurationMinutes = (startStr: string, endStr: string | null) => {
    if (!endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffMs = end.getTime() - start.getTime();
    return Math.max(0, Math.floor(diffMs / 1000 / 60));
  };

  const calculateWorkedMinutes = (entryStr: string | null, exitStr: string | null, pauses: TimeRecordPause[]) => {
    if (!entryStr || !exitStr) return 0;
    const entry = new Date(entryStr);
    const exit = new Date(exitStr);
    let totalMinutes = Math.floor((exit.getTime() - entry.getTime()) / 1000 / 60);

    // Subtract break intervals
    for (const pause of pauses) {
      if (pause.startTime && pause.endTime) {
        totalMinutes -= getDurationMinutes(pause.startTime, pause.endTime);
      }
    }

    return Math.max(0, totalMinutes);
  };

  const formatMinutesToHoursStr = (totalMinutes: number) => {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs}h ${mins.toString().padStart(2, "0")}m`;
  };

  const formatTimeOnly = (dateIsoStr: string | null) => {
    if (!dateIsoStr) return "";
    const date = new Date(dateIsoStr);
    // Use local time fields
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const formatDateLong = (dateIsoStr: string) => {
    const date = new Date(dateIsoStr);
    // Avoid UTC timezone shifts on date-only fields
    const localDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const day = localDate.getDate().toString().padStart(2, "0");
    
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const month = months[localDate.getMonth()];
    
    const weekdays = [
      "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
      "Quinta-feira", "Sexta-feira", "Sábado"
    ];
    const weekday = weekdays[localDate.getDay()];

    return {
      dayMonth: `${day} de ${month}`,
      weekday
    };
  };

  // Grouping time records by month
  const groupRecordsByMonth = (recordsList: TimeRecord[]) => {
    // Only display cards if there's both entry and exit
    const validRecords = recordsList.filter(r => r.entryTime && r.exitTime);

    const groups: Record<string, {
      monthYearLabel: string;
      monthKey: string;
      year: number;
      month: number;
      records: (TimeRecord & { workedMinutes: number })[];
      totalMinutesWorked: number;
    }> = {};

    validRecords.forEach(record => {
      const date = new Date(record.date);
      // Use UTC to prevent offset issues on YYYY-MM-DD dates
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();

      const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];
      const label = `${monthNames[month]} de ${year}`;
      const key = `${year}-${month}`;

      if (!groups[key]) {
        groups[key] = {
          monthYearLabel: label,
          monthKey: key,
          year,
          month,
          records: [],
          totalMinutesWorked: 0
        };
      }

      const workedMinutes = calculateWorkedMinutes(record.entryTime, record.exitTime, record.pauses);
      groups[key].records.push({
        ...record,
        workedMinutes
      });
      groups[key].totalMinutesWorked += workedMinutes;
    });

    // Sort days inside group descending
    Object.values(groups).forEach(g => {
      g.records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    // Sort month groups descending
    return Object.values(groups).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  };

  const toggleMonthCollapse = (monthKey: string) => {
    setCollapsedMonths(prev => ({
      ...prev,
      [monthKey]: !prev[monthKey]
    }));
  };

  // Save manual record handler
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!recordDate || !entryTime || !exitTime) {
      setErrorMessage("Por favor, preencha os horários de entrada e saída.");
      return;
    }

    // Validate pause times if any
    for (let i = 0; i < formPauses.length; i++) {
      const p = formPauses[i];
      if (!p.pauseCategoryId) {
        setErrorMessage(`Por favor, selecione a categoria da pausa #${i + 1}`);
        return;
      }
      if (!p.startTime || !p.endTime) {
        setErrorMessage(`Por favor, informe o início e fim da pausa #${i + 1}`);
        return;
      }
      if (p.endTime <= p.startTime) {
        setErrorMessage(`A hora de término da pausa #${i + 1} deve ser posterior ao início.`);
        return;
      }
    }

    setIsSubmittingRecord(true);

    try {
      const res = await fetch("/api/ponto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: collaboratorId,
          date: recordDate,
          entryTime,
          exitTime,
          pauses: formPauses
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao registrar ponto");
      }

      setSuccessMessage(editingRecordId ? "Ponto atualizado com sucesso!" : "Ponto registrado com sucesso!");
      await fetchPontoData();
      if (onUpdate) onUpdate();

      setTimeout(() => {
        setIsAddingRecord(false);
        setEditingRecordId(null);
        setFormPauses([]);
        setSuccessMessage("");
      }, 1500);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Erro ao salvar registro de ponto.");
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  // Populate record for edit mode
  const handleEditRecord = (record: TimeRecord) => {
    setEditingRecordId(record.id);
    const dateObj = new Date(record.date);
    const y = dateObj.getUTCFullYear();
    const m = (dateObj.getUTCMonth() + 1).toString().padStart(2, "0");
    const d = dateObj.getUTCDate().toString().padStart(2, "0");
    
    setRecordDate(`${y}-${m}-${d}`);
    setEntryTime(formatTimeOnly(record.entryTime));
    setExitTime(formatTimeOnly(record.exitTime));

    const recordPauses = record.pauses.map(p => ({
      pauseCategoryId: p.pauseCategoryId,
      startTime: formatTimeOnly(p.startTime),
      endTime: formatTimeOnly(p.endTime)
    }));
    setFormPauses(recordPauses);
    
    setIsAddingRecord(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    // Wait, let's implement deleting via standard patch since we don't have separate DELETE endpoint for point.
    // Setting entryTime and exitTime to null will clear it out, or we can add delete record route.
    // Since we don't have a direct delete endpoint, we can do it by sending an API request. Let's make an API call to delete if we need to.
    // Wait, let's look at prisma: a simple route DELETE /api/ponto/[id] is easy.
    // Let's create `/api/ponto/[id]/route.ts` next to support direct deletion. We'll write it right after writing this component.
    // For now, let's write the handler that calls DELETE `/api/ponto/${recordId}`:
    if (!window.confirm("Deseja realmente excluir este registro de ponto?")) {
      return;
    }

    try {
      const res = await fetch(`/api/ponto/${recordId}`, {
        method: "DELETE"
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao excluir ponto");
      }
      await fetchPontoData();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao excluir registro.");
    }
  };

  // Add/Remove break fields inside manual record form
  const addPauseField = () => {
    setFormPauses(prev => [...prev, { pauseCategoryId: "", startTime: "12:00", endTime: "13:00" }]);
  };

  const removePauseField = (index: number) => {
    setFormPauses(prev => prev.filter((_, i) => i !== index));
  };

  const handlePauseFieldChange = (index: number, field: keyof PauseFormInput, value: string) => {
    setFormPauses(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value
      };
      return copy;
    });
  };

  // Create Break Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!newCategoryName.trim() || !newCategoryDuration) {
      setErrorMessage("Por favor, preencha todos os campos.");
      return;
    }

    setIsSubmittingCategory(true);

    try {
      const res = await fetch("/api/ponto/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          duration: newCategoryDuration
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao criar categoria");
      }

      setSuccessMessage("Categoria criada com sucesso!");
      setNewCategoryName("");
      setNewCategoryDuration("60");
      
      // Reload categories list
      const resCat = await fetch(`/api/ponto/categorias`);
      if (resCat.ok) {
        const resultCat = await resCat.json();
        if (resultCat.success) setPauseCategories(resultCat.data);
      }

      setTimeout(() => {
        setSuccessMessage("");
      }, 1500);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Erro ao salvar categoria.");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  // Delete Break Category
  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm("Deseja realmente remover esta categoria de pausa?")) {
      return;
    }

    try {
      const res = await fetch(`/api/ponto/categorias/${categoryId}`, {
        method: "DELETE"
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao excluir categoria");
      }

      // Reload categories list
      const resCat = await fetch(`/api/ponto/categorias`);
      if (resCat.ok) {
        const resultCat = await resCat.json();
        if (resultCat.success) setPauseCategories(resultCat.data);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao deletar categoria.");
    }
  };

  const monthlyGroups = groupRecordsByMonth(records);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-stone-500 font-semibold text-sm animate-pulse">
          Carregando espelho de ponto...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 border-b border-stone-100/50 pb-3">
        <div>
          <h3 className="text-md font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
            <Clock className="text-blue-500" size={20} />
            Folha de Ponto / Espelho de Horas
          </h3>
          <p className="text-xs text-stone-400 font-semibold mt-1">
            Histórico mensal de entradas, saídas e pausas registradas para este colaborador.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewCategoryName("");
              setNewCategoryDuration("60");
              setErrorMessage("");
              setSuccessMessage("");
              setIsManagingCategories(true);
            }}
            className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <Settings size={15} />
            Gerenciar Pausas
          </button>

          <button
            onClick={() => {
              setEditingRecordId(null);
              setRecordDate(getTodayLocalDateStr());
              setEntryTime("08:00");
              setExitTime("17:00");
              setFormPauses([]);
              setErrorMessage("");
              setSuccessMessage("");
              setIsAddingRecord(true);
            }}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            Lançar Ponto Manual
          </button>
        </div>
      </div>

      {/* Month-based Groups */}
      {monthlyGroups.length > 0 ? (
        <div className="space-y-6">
          {monthlyGroups.map((group) => {
            const isCollapsed = collapsedMonths[group.monthKey] || false;
            
            return (
              <div key={group.monthKey} className="bg-white rounded-3xl border border-stone-100/30 shadow-sm overflow-hidden transition-all duration-300">
                {/* Header Section */}
                <div
                  onClick={() => toggleMonthCollapse(group.monthKey)}
                  className="flex items-center justify-between p-5 bg-stone-50/50 hover:bg-stone-50 border-b border-stone-100/50 cursor-pointer select-none"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
                    <h4 className="text-md font-bold text-stone-700 uppercase tracking-wide">
                      {group.monthYearLabel}
                    </h4>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100/60">
                      <FileSpreadsheet size={13} />
                      Horas Trabalhadas: {formatMinutesToHoursStr(group.totalMinutesWorked)}
                    </span>
                  </div>

                  <button className="text-stone-400 p-1.5 hover:bg-white rounded-xl transition-colors">
                    {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </button>
                </div>

                {/* Cards Grid (Visible if not collapsed) */}
                {!isCollapsed && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {group.records.map((record) => {
                        const { dayMonth, weekday } = formatDateLong(record.date);
                        
                        return (
                          <div
                            key={record.id}
                            className="bg-white p-5 rounded-2xl border border-stone-100/40 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md hover:border-stone-200/50 transition-all relative group"
                          >
                            {/* Card Top Title & Actions */}
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-xs text-stone-400 font-extrabold uppercase tracking-widest">{weekday}</span>
                                <h5 className="text-md font-extrabold text-stone-850 tracking-tight mt-0.5">{dayMonth}</h5>
                              </div>

                              {/* Admin action buttons */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-white/90 pl-2 py-0.5 rounded-lg">
                                <button
                                  onClick={() => handleEditRecord(record)}
                                  className="text-stone-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-stone-50 transition-all cursor-pointer"
                                  title="Editar registro"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteRecord(record.id)}
                                  className="text-stone-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-stone-50 transition-all cursor-pointer"
                                  title="Excluir registro"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Clock In / Out Visual */}
                            <div className="grid grid-cols-2 gap-4 bg-stone-50/70 p-3.5 rounded-xl border border-stone-100/30">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Entrada</span>
                                <span className="text-sm font-bold text-stone-700 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                                  {formatTimeOnly(record.entryTime)}
                                </span>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Saída</span>
                                <span className="text-sm font-bold text-stone-700 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                                  {formatTimeOnly(record.exitTime)}
                                </span>
                              </div>
                            </div>

                            {/* Breaks / Pauses List */}
                            {record.pauses.length > 0 ? (
                              <div className="space-y-2">
                                <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-widest block">Pausas / Intervalos</span>
                                <div className="space-y-1.5">
                                  {record.pauses.map((pause) => {
                                    const minutes = getDurationMinutes(pause.startTime, pause.endTime);
                                    return (
                                      <div
                                        key={pause.id}
                                        className="flex items-center justify-between text-xs bg-stone-50/50 p-2.5 rounded-xl border border-stone-100/20"
                                      >
                                        <span className="font-semibold text-stone-600 flex items-center gap-1">
                                          <Coffee size={12} className="text-blue-500 shrink-0" />
                                          {pause.pauseCategory?.name || "Pausa"}
                                        </span>
                                        <span className="text-stone-500 font-medium">
                                          {formatTimeOnly(pause.startTime)} às {formatTimeOnly(pause.endTime)}
                                          <span className="text-[10px] text-stone-400 font-semibold ml-1.5">({minutes} min)</span>
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="py-1 flex items-center gap-1.5 text-stone-400 italic text-[11px]">
                                <Coffee size={12} className="text-stone-300" />
                                <span>Nenhum intervalo registrado neste dia.</span>
                              </div>
                            )}

                            {/* Day Hours Summary */}
                            <div className="border-t border-stone-100/50 pt-3 flex items-center justify-between mt-1">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Total Trabalhado</span>
                              <span className="text-sm font-black text-emerald-600 tracking-tight">
                                {formatMinutesToHoursStr(record.workedMinutes)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-stone-50/40 p-12 text-center rounded-3xl border border-stone-100/30 flex flex-col items-center justify-center gap-4">
          <div className="p-4 bg-stone-100 text-stone-400 rounded-full">
            <Clock size={32} />
          </div>
          <div className="max-w-xs space-y-1">
            <p className="font-extrabold text-stone-700 text-sm">Nenhum ponto registrado</p>
            <p className="text-xs text-stone-400 leading-relaxed font-semibold">
              Este colaborador ainda não possui registros de ponto com entrada e saída finalizados.
            </p>
          </div>
        </div>
      )}

      {/* MODAL: Lançar Ponto Manual */}
      {isAddingRecord && (
        <Modal
          isOpen={isAddingRecord}
          onClose={() => {
            setIsAddingRecord(false);
            setEditingRecordId(null);
            setFormPauses([]);
          }}
          title={editingRecordId ? "Editar Registro de Ponto" : "Lançar Ponto Manual"}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveRecord} className="flex flex-col gap-4">
            <p className="text-xs text-stone-500 font-semibold leading-relaxed mb-1">
              Registre a entrada e saída padrão, juntamente com as pausas do colaborador. O card de ponto só aparecerá se ambos os horários estiverem cadastrados.
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Data do Expediente
              </label>
              <InputField
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                disabled={isSubmittingRecord}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Horário de Entrada
                </label>
                <InputField
                  type="time"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  disabled={isSubmittingRecord}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Horário de Saída
                </label>
                <InputField
                  type="time"
                  value={exitTime}
                  onChange={(e) => setExitTime(e.target.value)}
                  disabled={isSubmittingRecord}
                  required
                />
              </div>
            </div>

            {/* Pauses Subform */}
            <div className="space-y-3 mt-1">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Coffee size={14} className="text-blue-500" />
                  Intervalos / Pausas ({formPauses.length})
                </span>
                <button
                  type="button"
                  onClick={addPauseField}
                  disabled={isSubmittingRecord || pauseCategories.length === 0}
                  className="flex items-center gap-1 text-[11px] font-bold bg-stone-50 border border-stone-200 text-stone-700 py-1.5 px-3 rounded-lg hover:bg-stone-100 disabled:opacity-50 cursor-pointer"
                >
                  <Plus size={12} /> Adicionar Pausa
                </button>
              </div>

              {pauseCategories.length === 0 && (
                <p className="text-[10px] text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-100 font-semibold leading-relaxed">
                  Aviso: Nenhuma categoria de pausa cadastrada pelo RH. Cadastre em &quot;Gerenciar Pausas&quot; para adicionar intervalos.
                </p>
              )}

              {formPauses.length > 0 && (
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                  {formPauses.map((pause, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 bg-stone-50/50 p-3 rounded-2xl border border-stone-200/60 items-end">
                      {/* Dropdown category */}
                      <div className="col-span-5 flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Categoria</label>
                        <select
                          value={pause.pauseCategoryId}
                          onChange={(e) => handlePauseFieldChange(idx, "pauseCategoryId", e.target.value)}
                          className="flex w-full border border-stone-300 rounded-xl py-2 px-2.5 text-xs bg-white outline-none focus:border-stone-500 text-stone-850"
                          required
                          disabled={isSubmittingRecord}
                        >
                          <option value="">-- Selecione --</option>
                          {pauseCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} ({cat.duration}m)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Start Time */}
                      <div className="col-span-3 flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Início</label>
                        <input
                          type="time"
                          value={pause.startTime}
                          onChange={(e) => handlePauseFieldChange(idx, "startTime", e.target.value)}
                          className="flex w-full border border-stone-300 rounded-xl py-2 px-2.5 text-xs bg-white outline-none focus:border-stone-500 text-stone-850"
                          required
                          disabled={isSubmittingRecord}
                        />
                      </div>

                      {/* End Time */}
                      <div className="col-span-3 flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Fim</label>
                        <input
                          type="time"
                          value={pause.endTime}
                          onChange={(e) => handlePauseFieldChange(idx, "endTime", e.target.value)}
                          className="flex w-full border border-stone-300 rounded-xl py-2 px-2.5 text-xs bg-white outline-none focus:border-stone-500 text-stone-850"
                          required
                          disabled={isSubmittingRecord}
                        />
                      </div>

                      {/* Remove button */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => removePauseField(idx)}
                          disabled={isSubmittingRecord}
                          className="text-stone-400 hover:text-red-500 p-1.5 hover:bg-white border border-transparent hover:border-stone-200 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  setIsAddingRecord(false);
                  setEditingRecordId(null);
                  setFormPauses([]);
                }}
                disabled={isSubmittingRecord}
                className="px-4 py-2.5 rounded-xl border border-stone-400/50 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <SubmitButton
                text={isSubmittingRecord ? "Salvando..." : "Salvar Ponto"}
                disabled={isSubmittingRecord}
                className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Gerenciar Pausas */}
      {isManagingCategories && (
        <Modal
          isOpen={isManagingCategories}
          onClose={() => setIsManagingCategories(false)}
          title="Configuração de Categorias de Pausa"
          maxWidth="max-w-md"
        >
          <div className="space-y-5">
            <p className="text-xs text-stone-500 font-semibold leading-relaxed">
              Adicione ou remova categorias de pausa (Ex: Lanche, Almoço, Intervalo Técnico) que ficam salvas no banco para os registros de ponto.
            </p>

            {/* Form to Create Category */}
            <form onSubmit={handleCreateCategory} className="bg-stone-50 p-4 rounded-2xl border border-stone-100/30 space-y-4">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Nova Categoria de Pausa</h4>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Nome da Pausa</label>
                <InputField
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Pausa para Café"
                  required
                  disabled={isSubmittingCategory}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Duração recomendada (minutos)</label>
                <InputField
                  type="number"
                  value={newCategoryDuration}
                  onChange={(e) => setNewCategoryDuration(e.target.value)}
                  placeholder="Ex: 15"
                  min="1"
                  required
                  disabled={isSubmittingCategory}
                />
              </div>

              {errorMessage && (
                <div className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-150">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="text-xs text-emerald-600 flex items-center gap-1.5 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-150">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingCategory}
                  className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Plus size={14} /> Adicionar Categoria
                </button>
              </div>
            </form>

            {/* List of existing Categories */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-100 pb-2">Categorias Ativas</h4>

              {pauseCategories.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {pauseCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-100/30 shadow-sm"
                    >
                      <div>
                        <p className="text-xs font-extrabold text-stone-750">{cat.name}</p>
                        <p className="text-[10px] text-stone-400 font-semibold mt-0.5">Duração padrão: {cat.duration} minutos</p>
                      </div>

                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-stone-400 hover:text-red-500 p-1.5 hover:bg-stone-50 border border-transparent hover:border-stone-200 rounded-xl transition-all cursor-pointer"
                        title="Excluir categoria"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-400 italic text-xs bg-stone-50/50 p-4 rounded-xl border border-stone-100">
                  Nenhuma categoria de pausa cadastrada ainda.
                </p>
              )}
            </div>

            <div className="flex justify-center border-t border-stone-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setIsManagingCategories(false)}
                className="px-5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
