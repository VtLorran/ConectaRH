"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FileCheckCorner,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  UploadCloud,
  Send,
  Clock,
  XCircle,
  ShieldCheck,
  Type,
} from "lucide-react";
import SectionComponent from "@/components/SectionComponent";
import TittleHeader from "@/components/TittleHeader";
import Breadcrumb from "@/components/Breadcrumb";

interface Answer {
  name: string;
  type: "file" | "text";
  value: string | null;
  status?: "pending" | "submitted" | "approved" | "rejected";
  feedback?: string | null;
}

interface DocumentRequest {
  id: string;
  requirements: { name: string; type: "file" | "text" }[];
  answers: Answer[];
  createdAt: string;
  updatedAt: string;
}

interface FlatItem {
  requestId: string;
  name: string;
  type: "file" | "text";
  value: string | null;
  status: string;
  feedback: string | null;
  createdAt: string;
}

export default function UserOnboarding() {
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (json.success && json.data) {
        setDocumentRequests(json.data.documentRequests || []);
      }
    } catch (err) {
      console.error("Erro ao carregar dados de onboarding:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Flatten all items across document requests
  const allItems = useMemo<FlatItem[]>(() => {
    const items: FlatItem[] = [];
    documentRequests.forEach((req) => {
      req.answers.forEach((ans) => {
        items.push({
          requestId: req.id,
          name: ans.name,
          type: ans.type,
          value: ans.value,
          status: ans.status || "pending",
          feedback: ans.feedback || null,
          createdAt: req.createdAt,
        });
      });
    });
    return items;
  }, [documentRequests]);

  // Progress
  const progress = useMemo(() => {
    const total = allItems.length;
    const completed = allItems.filter(
      (i) => i.status === "submitted" || i.status === "approved"
    ).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [allItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return allItems;
    return allItems.filter((i) => i.status === activeFilter);
  }, [allItems, activeFilter]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allItems.length, pending: 0, submitted: 0, approved: 0, rejected: 0 };
    allItems.forEach((i) => {
      if (i.status in counts) counts[i.status]++;
    });
    return counts;
  }, [allItems]);

  const handleInputChange = (key: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (key: string, file: File | null) => {
    if (!file) {
      setInputValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("O arquivo é muito grande. O tamanho máximo permitido é 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setInputValues((prev) => ({ ...prev, [key]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitItem = async (requestId: string, itemName: string) => {
    const key = `${requestId}-${itemName}`;
    const value = inputValues[key];
    if (!value) {
      alert("Por favor, preencha o campo antes de enviar.");
      return;
    }

    setSubmittingKey(key);
    try {
      const request = documentRequests.find((r) => r.id === requestId);
      if (!request) throw new Error("Requisição não encontrada");

      const updatedAnswers = request.answers.map((ans) => {
        if (ans.name === itemName) {
          return { ...ans, value };
        }
        return ans;
      });

      const res = await fetch(`/api/onboarding/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: updatedAnswers }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao enviar");
      }

      setSuccessKey(key);
      setTimeout(() => setSuccessKey(null), 2500);
      // Clear input value for this key
      setInputValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Erro ao enviar resposta.");
    } finally {
      setSubmittingKey(null);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pendente";
      case "submitted": return "Enviado";
      case "approved": return "Aprovado";
      case "rejected": return "Rejeitado";
      default: return status;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-50 text-amber-600 border-amber-200/60";
      case "submitted": return "bg-blue-50 text-blue-600 border-blue-200";
      case "approved": return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "rejected": return "bg-red-50 text-red-600 border-red-200/60";
      default: return "bg-stone-50 text-stone-600 border-stone-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock size={12} />;
      case "submitted": return <Send size={12} />;
      case "approved": return <CheckCircle2 size={12} />;
      case "rejected": return <XCircle size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const trilhaNavegacao = [
    { label: "Painel", href: "/dashboard" },
    { label: "Central de Onboarding", href: "/onboarding" },
  ];

  const filterTabs = [
    { key: "all", label: "Todos" },
    { key: "pending", label: "Pendentes" },
    { key: "submitted", label: "Enviados" },
    { key: "approved", label: "Aprovados" },
    { key: "rejected", label: "Rejeitados" },
  ];

  return (
    <SectionComponent>
      <TittleHeader
        tittle="Central de Onboarding"
        description="Acompanhe e envie as informações solicitadas pelo RH"
        className="w-full"
      />
      <div className="w-full">
        <Breadcrumb items={trilhaNavegacao} />
      </div>

      {loading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-stone-500 font-semibold text-sm animate-pulse">
            Carregando seu onboarding...
          </p>
        </div>
      ) : allItems.length === 0 ? (
        <div className="w-full py-16 flex flex-col items-center justify-center text-center gap-3 bg-white rounded-3xl border border-stone-100 shadow-xl">
          <ShieldCheck size={48} className="text-emerald-400" />
          <h3 className="text-stone-700 font-bold text-base">
            Nenhuma solicitação pendente
          </h3>
          <p className="text-stone-400 text-xs max-w-sm px-4">
            Você não possui nenhuma solicitação de onboarding no momento. Quando
            o RH solicitar documentos ou informações, eles aparecerão aqui.
          </p>
        </div>
      ) : (
        <>
          {/* Progress Bar Section */}
          <div className="w-full bg-white p-6 rounded-3xl shadow-xl border border-stone-100/50">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2">
                  <FileCheckCorner size={16} className="text-blue-500" />
                  Progresso do Onboarding
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {progress.completed} de {progress.total} itens concluídos
                </p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto md:min-w-[320px]">
                <div className="flex-1 bg-stone-200 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      progress.percentage === 100
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                        : progress.percentage > 50
                          ? "bg-gradient-to-r from-blue-400 to-blue-500"
                          : progress.percentage > 0
                            ? "bg-gradient-to-r from-amber-400 to-amber-500"
                            : "bg-stone-300"
                    }`}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <span className="text-lg font-black text-stone-700 shrink-0 tabular-nums">
                  {progress.percentage}%
                </span>
              </div>
            </div>

            {progress.percentage === 100 && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-700 font-semibold">
                  Parabéns! Você completou todas as solicitações de onboarding. Aguarde a análise do RH.
                </p>
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="w-full flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === tab.key
                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                    : "bg-white text-stone-500 border border-stone-200/80 hover:bg-stone-50 hover:border-stone-300"
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 ${activeFilter === tab.key ? "text-blue-200" : "text-stone-300"}`}>
                  {statusCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {/* Items List */}
          <div className="w-full space-y-4">
            {filteredItems.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-2 bg-white rounded-3xl border border-stone-100 shadow-xl">
                <FileCheckCorner size={36} className="text-stone-300" />
                <p className="text-stone-500 font-semibold text-sm">
                  Nenhum item encontrado para este filtro
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const key = `${item.requestId}-${item.name}`;
                const isSubmitting = submittingKey === key;
                const isSuccess = successKey === key;
                const canEdit = item.status === "pending" || item.status === "rejected";
                const hasExistingValue = item.value !== null && item.value !== "";
                const currentInputValue = inputValues[key] || "";

                return (
                  <div
                    key={key}
                    className={`bg-white rounded-2xl border shadow-lg overflow-hidden transition-all duration-300 ${
                      isSuccess
                        ? "border-emerald-300 ring-2 ring-emerald-100"
                        : "border-stone-100/50"
                    }`}
                  >
                    {/* Item Header */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${
                          item.type === "file"
                            ? "bg-violet-50 text-violet-500"
                            : "bg-sky-50 text-sky-500"
                        }`}>
                          {item.type === "file" ? <UploadCloud size={18} /> : <Type size={18} />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-stone-800 truncate">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-500 uppercase">
                              {item.type === "file" ? "Arquivo" : "Texto"}
                            </span>
                            <span className="text-[10px] text-stone-400 font-medium">
                              Solicitado em{" "}
                              {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border shrink-0 w-fit ${getStatusStyles(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {getStatusLabel(item.status)}
                      </div>
                    </div>

                    {/* Feedback if rejected */}
                    {item.status === "rejected" && item.feedback && (
                      <div className="mx-5 mb-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-[11px] font-bold text-red-600 mb-0.5 flex items-center gap-1">
                          <AlertCircle size={12} />
                          Motivo da Recusa
                        </p>
                        <p className="text-xs text-red-500 leading-relaxed">
                          {item.feedback}
                        </p>
                      </div>
                    )}

                    {/* Display existing value for submitted/approved items */}
                    {hasExistingValue && !canEdit && (
                      <div className="mx-5 mb-3 p-3 bg-stone-50 border border-stone-100 rounded-xl">
                        {item.type === "text" ? (
                          <div>
                            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-0.5">
                              Resposta enviada
                            </span>
                            <p className="text-xs text-stone-600 font-medium">
                              {item.value}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                            <span className="text-xs text-stone-600 font-semibold">
                              Arquivo enviado com sucesso
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Input Area (only if pending or rejected) */}
                    {canEdit && (
                      <div className="px-5 pb-5 pt-2 border-t border-stone-100/50">
                        {item.type === "text" ? (
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              type="text"
                              placeholder={`Digite: ${item.name}`}
                              value={currentInputValue}
                              onChange={(e) => handleInputChange(key, e.target.value)}
                              disabled={isSubmitting}
                              className="flex-1 bg-stone-50 border border-stone-200/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-stone-700 font-medium placeholder:text-stone-400 disabled:opacity-50 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => handleSubmitItem(item.requestId, item.name)}
                              disabled={isSubmitting || !currentInputValue}
                              className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                            >
                              {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send size={15} />
                              )}
                              Enviar
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            <div className="relative w-full border-2 border-dashed border-stone-200 hover:border-blue-400 rounded-xl p-5 bg-stone-50/50 hover:bg-blue-50/30 transition-all group cursor-pointer">
                              <input
                                type="file"
                                accept=".pdf,image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  handleFileChange(key, file);
                                }}
                                disabled={isSubmitting}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                              <div className="flex flex-col items-center text-center gap-2">
                                {currentInputValue ? (
                                  <>
                                    <div className="p-2 bg-emerald-50 rounded-lg">
                                      <FileText size={22} className="text-emerald-500" />
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600">
                                      ✓ Arquivo selecionado
                                    </span>
                                    <span className="text-[10px] text-stone-400">
                                      Clique em &quot;Enviar&quot; para confirmar
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <div className="p-2 bg-stone-100 group-hover:bg-blue-100 rounded-lg transition-colors">
                                      <UploadCloud size={22} className="text-stone-400 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    <span className="text-xs font-semibold text-stone-500 group-hover:text-blue-600 transition-colors">
                                      Clique para selecionar um arquivo
                                    </span>
                                    <span className="text-[10px] text-stone-400">
                                      PDF ou Imagem • Máximo 5MB
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSubmitItem(item.requestId, item.name)}
                              disabled={isSubmitting || !currentInputValue}
                              className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto sm:self-end"
                            >
                              {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send size={15} />
                              )}
                              Enviar
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Success banner */}
                    {isSuccess && (
                      <div className="px-5 pb-4">
                        <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 animate-fade-in">
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                          <span className="text-xs text-emerald-700 font-semibold">
                            Enviado com sucesso!
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </SectionComponent>
  );
}
