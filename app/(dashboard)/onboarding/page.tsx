"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FileCheckCorner,
  Plus,
  Search,
  Building2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  User,
  Paperclip,
  FileText,
  Eye,
  Download,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import SectionComponent from "@/components/SectionComponent";
import TittleHeader from "@/components/TittleHeader";
import Breadcrumb from "@/components/Breadcrumb";
import Modal from "@/components/Modal";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";

interface Requirement {
  name: string;
  type: "file" | "text";
}

interface Answer {
  name: string;
  type: "file" | "text";
  value: string | null;
  status?: "pending" | "approved" | "rejected";
  feedback?: string | null;
}

interface DocumentRequest {
  id: string;
  requirements: Requirement[];
  answers: Answer[];
  createdAt: string;
  updatedAt: string;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  status: string;
  jobPosition?: {
    name: string;
    department?: {
      id: string;
      name: string;
    };
  } | null;
  documentRequests: DocumentRequest[];
}

export default function OnboardingPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");

  // Modal States
  const [isAddingRequest, setIsAddingRequest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalSectorId, setModalSectorId] = useState("");
  const [modalUserId, setModalUserId] = useState("");

  // Current requirement input states
  const [reqName, setReqName] = useState("");
  const [reqType, setReqType] = useState<"file" | "text">("file");
  const [tempRequirements, setTempRequirements] = useState<Requirement[]>([]);

  // Feedback states
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // UI Expanded state for details
  const [expandedCollaboratorId, setExpandedCollaboratorId] = useState<
    string | null
  >(null);

  // Preview file states
  const [previewingFile, setPreviewingFile] = useState<string | null>(null);
  const [previewingFileName, setPreviewingFileName] = useState("");
  const [loadingFileKey, setLoadingFileKey] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [resOnboarding, resSectors] = await Promise.all([
        fetch("/api/onboarding"),
        fetch("/api/setores"),
      ]);

      if (!resOnboarding.ok || !resSectors.ok) {
        throw new Error("Erro ao carregar dados do servidor");
      }

      const valOnboarding = await resOnboarding.json();
      const valSectors = await resSectors.json();

      if (valOnboarding.success) {
        // Filter out admins from the onboarding list unless they have document requests
        const filteredUsers = valOnboarding.data.filter((u: Collaborator) => {
          // If we want everyone, keep everyone
          return true;
        });
        setCollaborators(filteredUsers);
      }
      setSectors(valSectors || []);
    } catch (error) {
      console.error("Erro ao buscar dados do onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const filteredCollaborators = useMemo(() => {
    return collaborators.filter((c) => {
      // Exibe apenas colaboradores com requisições de documentos no painel principal
      if (!c.documentRequests || c.documentRequests.length === 0) return false;

      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());

      const deptId = c.jobPosition?.department?.id;
      const matchesSector =
        selectedSector === "all" || deptId === selectedSector;

      return matchesSearch && matchesSector;
    });
  }, [collaborators, searchQuery, selectedSector]);

  // Filter users inside the modal based on selected sector
  const modalUsers = useMemo(() => {
    if (!modalSectorId) return [];
    return collaborators.filter(
      (c) => c.jobPosition?.department?.id === modalSectorId,
    );
  }, [collaborators, modalSectorId]);

  const handleAddRequirement = () => {
    if (!reqName.trim()) return;

    // Avoid duplicate names in the same request
    if (
      tempRequirements.some(
        (r) => r.name.toLowerCase() === reqName.trim().toLowerCase(),
      )
    ) {
      alert("Já existe um documento com este nome na lista.");
      return;
    }

    setTempRequirements([
      ...tempRequirements,
      { name: reqName.trim(), type: reqType },
    ]);
    setReqName("");
  };

  const handleRemoveRequirement = (index: number) => {
    setTempRequirements(tempRequirements.filter((_, i) => i !== index));
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!modalUserId) {
      setErrorMessage("Por favor, selecione um colaborador.");
      return;
    }

    if (tempRequirements.length === 0) {
      setErrorMessage(
        "Por favor, adicione pelo menos um documento ou informação.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: modalUserId,
          requirements: tempRequirements,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "Erro ao criar requisição de onboarding",
        );
      }

      setSuccessMessage("Requisitos enviados com sucesso para o colaborador!");
      setTempRequirements([]);
      setModalSectorId("");
      setModalUserId("");

      await fetchAllData();

      setTimeout(() => {
        setIsAddingRequest(false);
        setSuccessMessage("");
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.message || "Erro ao enviar requisição.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (
      !window.confirm(
        "Tem certeza que deseja excluir esta requisição de documentos permanentemente?",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/onboarding/${requestId}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao excluir requisição");
      }

      await fetchAllData();
    } catch (error: any) {
      alert(error.message || "Erro ao excluir requisição.");
    }
  };

  const handleReviewAnswer = async (
    requestId: string,
    reqAnswers: Answer[],
    answerName: string,
    action: "approved" | "rejected",
    feedbackText: string | null = null,
  ) => {
    const updatedAnswers = reqAnswers.map((ans) => {
      if (ans.name === answerName) {
        return {
          ...ans,
          status: action,
          feedback: feedbackText,
        };
      }
      return ans;
    });

    try {
      const res = await fetch(`/api/onboarding/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: updatedAnswers }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "Erro ao atualizar status do documento",
        );
      }

      await fetchAllData();
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar status.");
    }
  };

  // Helper to compute progress statistics
  const getCollaboratorProgress = (c: Collaborator) => {
    let total = 0;
    let completed = 0;

    c.documentRequests.forEach((req) => {
      total += req.requirements.length;
      req.answers.forEach((ans) => {
        if (ans.value !== null && ans.value !== "") {
          completed++;
        }
      });
    });

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  const fetchFullFile = async (requestId: string, name: string) => {
    setLoadingFileKey(`${requestId}-${name}`);
    try {
      const res = await fetch(
        `/api/onboarding/${requestId}/documento?name=${encodeURIComponent(name)}`,
      );
      if (!res.ok) {
        throw new Error("Erro ao carregar o arquivo completo.");
      }
      const data = await res.json();
      setPreviewingFile(data.fileData);
      setPreviewingFileName(name);
    } catch (err) {
      console.error(err);
      alert("Não foi possível carregar o arquivo.");
    } finally {
      setLoadingFileKey(null);
    }
  };

  const handlePreviewFile = (
    requestId: string,
    name: string,
    value: string,
  ) => {
    if (value.endsWith("PLACEHOLDER")) {
      fetchFullFile(requestId, name);
    } else {
      setPreviewingFile(value);
      setPreviewingFileName(name);
    }
  };

  const handleDownloadFile = async (
    requestId: string,
    name: string,
    value: string,
  ) => {
    let base64Data = value;
    if (value.endsWith("PLACEHOLDER")) {
      setLoadingFileKey(`${requestId}-${name}`);
      try {
        const res = await fetch(
          `/api/onboarding/${requestId}/documento?name=${encodeURIComponent(name)}`,
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        base64Data = data.fileData;
      } catch (err) {
        alert("Erro ao baixar o arquivo.");
        setLoadingFileKey(null);
        return;
      } finally {
        setLoadingFileKey(null);
      }
    }

    const link = document.createElement("a");
    link.href = base64Data;
    const isPdf = base64Data.startsWith("data:application/pdf");
    link.download = `${name}.${isPdf ? "pdf" : "png"}`;
    link.click();
  };

  const isBase64Pdf = (value: string) =>
    value.startsWith("data:application/pdf");
  const isBase64Image = (value: string) => value.startsWith("data:image/");

  const trilhaNavegacao = [
    { label: "Painel", href: "/" },
    { label: "Onboarding", href: "/onboarding" },
  ];

  return (
    <SectionComponent>
      <TittleHeader
        tittle="Gestão de Onboarding"
        description="Requisição e acompanhamento de documentos dos usuários"
        className="w-full"
      />
      <div className="w-full">
        <Breadcrumb items={trilhaNavegacao} />
      </div>

      {/* Caixa de Ações Principais */}
      <div className="w-full bg-white p-6 rounded-3xl shadow-xl border border-stone-100/50 flex flex-col md:flex-row items-center justify-between  gap-4">
        <div className="flex md:flex-row gap-5">
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
              className="w-full bg-stone-50 border border-stone-200/80 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none text-stone-700 font-medium"
            />
          </div>

          {/* Filtro de Setor */}
          <div className="relative w-full md:max-w-[240px] flex items-center gap-2 bg-stone-50 border border-stone-200/80 rounded-2xl px-3.5 py-3 shrink-0">
            <Building2 size={16} className="text-stone-400" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-transparent text-sm font-semibold  text-stone-500 focus:outline-none border-none py-0.5 cursor-pointer w-full"
            >
              <option value="all">Filtrar por Setor</option>
              {sectors.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Requerer Documentos */}
        <button
          onClick={() => {
            setTempRequirements([]);
            setIsAddingRequest(true);
          }}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Plus size={18} />
          Requerer Documentos
        </button>
      </div>

      {/* Tabela / Grid de Colaboradores */}
      <div className="w-full bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-xl space-y-6">
        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
          <FileCheckCorner className="text-blue-500" size={20} />
          Acompanhamento de Documentações
        </h3>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-stone-500 font-semibold text-sm animate-pulse">
              Carregando dados de onboarding...
            </p>
          </div>
        ) : filteredCollaborators.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredCollaborators.map((c) => {
              const { total, completed, percentage } =
                getCollaboratorProgress(c);
              const isExpanded = expandedCollaboratorId === c.id;

              return (
                <div
                  key={c.id}
                  className="bg-stone-50/40 border border-stone-200/50 rounded-2xl overflow-hidden transition-all duration-200"
                >
                  {/* Linha Resumo */}
                  <div
                    onClick={() =>
                      setExpandedCollaboratorId(isExpanded ? null : c.id)
                    }
                    className="flex flex-col lg:flex-row lg:items-center justify-between p-5 gap-4 cursor-pointer hover:bg-stone-50/80 transition-colors"
                  >
                    {/* Infos do Colaborador */}
                    <div className="flex items-center gap-4 min-w-[250px]">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-stone-200 shrink-0 bg-stone-100 flex items-center justify-center">
                        {c.avatar ? (
                          <img
                            src={c.avatar}
                            alt={c.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={20} className="text-stone-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-stone-800 truncate">
                          {c.name}
                        </h4>
                        <p className="text-xs text-stone-500 truncate mt-0.5">
                          {c.email}
                        </p>
                        <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase tracking-wider">
                          {c.jobPosition?.department?.name || "Sem Setor"} •{" "}
                          {c.jobPosition?.name || "Sem Cargo"}
                        </p>
                      </div>
                    </div>

                    {/* Progresso */}
                    <div className="flex-1 max-w-md flex items-center gap-4">
                      <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            percentage === 100
                              ? "bg-emerald-500"
                              : percentage > 50
                                ? "bg-blue-500"
                                : percentage > 0
                                  ? "bg-amber-500"
                                  : "bg-stone-300"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-center shrink-0">
                        <span className="text-sm font-black  text-stone-750">
                          {percentage}%
                        </span>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mt-0.5">
                          {total > 0
                            ? `${completed}/${total} docs`
                            : "Nenhum req."}
                        </p>
                      </div>
                    </div>

                    {/* Botão Expansão */}
                    <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0">
                      {isExpanded ? (
                        <ChevronUp size={20} className="text-stone-400" />
                      ) : (
                        <ChevronDown size={20} className="text-stone-400" />
                      )}
                    </div>
                  </div>

                  {/* Detalhes Expandidos */}
                  {isExpanded && (
                    <div className="border-t border-stone-200/50 bg-white p-6 space-y-6 animate-fade-in">
                      {c.documentRequests.length > 0 ? (
                        <div className="space-y-6">
                          {c.documentRequests.map((req, rIdx) => (
                            <div
                              key={req.id}
                              className="border border-stone-100 rounded-2xl bg-stone-50/20 p-4 space-y-4"
                            >
                              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                                <span className="text-xs font-bold text-stone-450 flex items-center gap-1.5">
                                  <Calendar size={14} />
                                  Requisitado em{" "}
                                  {new Date(req.createdAt).toLocaleDateString(
                                    "pt-BR",
                                  )}
                                </span>
                                <button
                                  onClick={() => handleDeleteRequest(req.id)}
                                  className="text-stone-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                  title="Excluir requisição"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {req.answers.map((ans, aIdx) => {
                                  const hasValue =
                                    ans.value !== null && ans.value !== "";
                                  return (
                                    <div
                                      key={aIdx}
                                      className="bg-white p-4 rounded-xl flex flex-col justify-between min-h-[120px] shadow-sm"
                                    >
                                      <div>
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-xs font-black text-stone-700 truncate block">
                                            {ans.name}
                                          </span>
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 uppercase">
                                            {ans.type === "file"
                                              ? "Arquivo"
                                              : "Texto"}
                                          </span>
                                        </div>

                                        <div className="mt-2.5 space-y-1.5">
                                          {hasValue ? (
                                            <>
                                              {ans.type === "file" ? (
                                                <span className="text-xs text-stone-600 font-semibold flex items-center gap-1">
                                                  <CheckCircle2
                                                    size={13}
                                                    className="text-emerald-500"
                                                  />
                                                  Arquivo enviado
                                                </span>
                                              ) : (
                                                <p className="text-xs text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-100 font-medium line-clamp-2">
                                                  {ans.value}
                                                </p>
                                              )}

                                              {/* Status Badges */}
                                              <div className="flex flex-col gap-1 mt-1">
                                                {ans.status === "approved" ? (
                                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-full w-fit">
                                                    <CheckCircle2 size={11} />
                                                    Aprovado
                                                  </span>
                                                ) : ans.status ===
                                                  "rejected" ? (
                                                  <>
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-650 bg-red-50 border border-red-200/60 px-2 py-0.5 rounded-full w-fit">
                                                      <AlertCircle size={11} />
                                                      Recusado
                                                    </span>
                                                    {ans.feedback && (
                                                      <p className="text-[10px] text-red-500 italic mt-0.5 leading-tight">
                                                        Motivo: {ans.feedback}
                                                      </p>
                                                    )}
                                                  </>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full w-fit animate-pulse">
                                                    <Loader2
                                                      size={11}
                                                      className="animate-spin"
                                                    />
                                                    Pendente revisão
                                                  </span>
                                                )}
                                              </div>
                                            </>
                                          ) : (
                                            <span className="text-xs text-amber-600 font-semibold flex items-center gap-1 animate-pulse">
                                              <AlertCircle size={13} />
                                              Aguardando envio
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {hasValue && (
                                        <div className="flex gap-2 items-center mt-4 border-t border-stone-50 pt-3">
                                          {ans.type === "file" && ans.value && (
                                            <>
                                              <button
                                                type="button"
                                                disabled={
                                                  loadingFileKey ===
                                                  `${req.id}-${ans.name}`
                                                }
                                                onClick={() =>
                                                  handlePreviewFile(
                                                    req.id,
                                                    ans.name,
                                                    ans.value!,
                                                  )
                                                }
                                                className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 p-2 rounded-lg font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03] disabled:opacity-50"
                                                title="Visualizar Arquivo"
                                              >
                                                {loadingFileKey ===
                                                `${req.id}-${ans.name}` ? (
                                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                  <Eye size={14} />
                                                )}
                                              </button>

                                              <button
                                                type="button"
                                                disabled={
                                                  loadingFileKey ===
                                                  `${req.id}-${ans.name}`
                                                }
                                                onClick={() =>
                                                  handleDownloadFile(
                                                    req.id,
                                                    ans.name,
                                                    ans.value!,
                                                  )
                                                }
                                                className="bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200/50 p-2 rounded-lg font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03] disabled:opacity-50"
                                                title="Baixar Arquivo"
                                              >
                                                {loadingFileKey ===
                                                `${req.id}-${ans.name}` ? (
                                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                  <Download size={14} />
                                                )}
                                              </button>
                                            </>
                                          )}

                                          <div className="flex items-center gap-1.5 ml-auto">
                                            {ans.status !== "approved" && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleReviewAnswer(
                                                    req.id,
                                                    req.answers,
                                                    ans.name,
                                                    "approved",
                                                  )
                                                }
                                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/60 p-2 rounded-lg font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03]"
                                                title="Aprovar"
                                              >
                                                <CheckCircle2 size={13} />
                                              </button>
                                            )}

                                            {ans.status !== "rejected" && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const reason = window.prompt(
                                                    "Motivo da reprovação / correção do documento:",
                                                  );
                                                  if (reason !== null) {
                                                    handleReviewAnswer(
                                                      req.id,
                                                      req.answers,
                                                      ans.name,
                                                      "rejected",
                                                      reason,
                                                    );
                                                  }
                                                }}
                                                className="bg-red-50 hover:bg-red-100 text-red-650 border border-red-200/60 p-2 rounded-lg font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03]"
                                                title="Recusar com Justificativa"
                                              >
                                                <AlertCircle size={13} />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 flex flex-col items-center justify-center text-center gap-2 bg-stone-50/40 rounded-xl border border-stone-200/40">
                          <Paperclip size={24} className="text-stone-300" />
                          <p className="text-stone-500 font-semibold text-xs">
                            Nenhum documento requisitado para este colaborador
                          </p>
                          <p className="text-stone-400 text-[10px]">
                            Utilize o botão &quot;Requerer Documentos&quot; no
                            topo para cadastrar.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3 bg-stone-50/40 rounded-3xl border border-stone-200/40">
            <FileCheckCorner
              size={48}
              className="text-stone-300 animate-pulse"
            />
            <p className="text-stone-500 font-semibold text-sm">
              Nenhum colaborador encontrado
            </p>
            <p className="text-stone-400 text-xs max-w-sm px-4">
              Tente redefinir a busca por texto ou filtro de setor.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Nova Requisição de Documentos */}
      {isAddingRequest && (
        <Modal
          isOpen={isAddingRequest}
          onClose={() => {
            setIsAddingRequest(false);
            setTempRequirements([]);
            setModalSectorId("");
            setModalUserId("");
            setErrorMessage("");
            setSuccessMessage("");
          }}
          title="Nova Requisição de Documentos"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleCreateRequest} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Setor */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Setor
                </label>
                <div className="relative w-full">
                  <select
                    value={modalSectorId}
                    onChange={(e) => {
                      setModalSectorId(e.target.value);
                      setModalUserId("");
                    }}
                    className="w-full bg-stone-50 border border-stone-400/50 rounded-xl px-3 py-3 text-sm cursor-pointer text-stone-700 font-medium"
                    required
                  >
                    <option value="">Selecione o Setor</option>
                    {sectors.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Colaborador */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Colaborador
                </label>
                <div className="relative w-full">
                  <select
                    value={modalUserId}
                    onChange={(e) => setModalUserId(e.target.value)}
                    disabled={!modalSectorId}
                    className="w-full bg-stone-50 border border-stone-400/50 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-550 focus:border-blue-500 cursor-pointer disabled:opacity-50 text-stone-700 font-medium"
                    required
                  >
                    <option value="">Selecione o Colaborador</option>
                    {modalUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Adicionar Requisito */}
            <div className="border-t border-stone-100 pt-4 mt-2">
              <h4 className="text-xs font-black text-stone-600 uppercase tracking-wider mb-3">
                Documentos e Informações Requeridas
              </h4>

              <div className="flex flex-col sm:flex-row gap-3 items-end ">
                {/* Nome do Item */}
                <div className="flex-1 flex flex-col gap-1 w-full">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Nome do Documento / Campo
                  </label>
                  <InputField
                    type="text"
                    placeholder="Ex: Título de Eleitor, Telefone de Emergência"
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Tipo do Item */}
                <div className="w-full sm:w-[150px] flex flex-col gap-1 shrink-0">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Tipo de Resposta
                  </label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-400/50 rounded-xl px-3 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-550 focus:border-blue-500 cursor-pointer text-stone-700 font-medium"
                  >
                    <option value="file">Arquivo (PDF/Img)</option>
                    <option value="text">Texto livre</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAddRequirement}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-3.5 rounded-xl flex items-center justify-center cursor-pointer transition-colors shrink-0 active:scale-95 mb-0.5"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Lista Temporária de Adicionados */}
            {tempRequirements.length > 0 && (
              <div className="bg-stone-50/50 rounded-xl border border-stone-200/50 p-4 max-h-[200px] overflow-y-auto space-y-2">
                {tempRequirements.map((req, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white border border-stone-100 rounded-lg p-2.5 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-stone-700 truncate">
                        {req.name}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 uppercase">
                        {req.type === "file" ? "Arquivo" : "Texto"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(index)}
                      className="text-stone-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

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

            {/* Botões do Modal */}
            <div className="flex justify-end gap-3 border-t border-stone-100 mx-auto pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingRequest(false);
                  setTempRequirements([]);
                  setModalSectorId("");
                  setModalUserId("");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-400/50 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <SubmitButton
                text={isSubmitting ? "Enviando..." : "Enviar Requisição"}
                disabled={isSubmitting}
                className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Lightbox / Preview Modal */}
      {previewingFile && (
        <div
          onClick={() => {
            setPreviewingFile(null);
            setPreviewingFileName("");
          }}
          className="fixed inset-0 bg-stone-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden border border-stone-100 flex flex-col transform transition-all scale-100 relative animate-scale-in"
          >
            {/* Header */}
            <div className="bg-stone-900 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="text-red-500" size={18} />
                <span className="text-sm font-bold truncate">
                  Visualizando: {previewingFileName}
                </span>
              </div>
              <button
                onClick={() => {
                  setPreviewingFile(null);
                  setPreviewingFileName("");
                }}
                className="text-stone-400 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all duration-200 cursor-pointer"
              >
                <Plus className="rotate-45" size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 bg-stone-100 flex items-center justify-center overflow-auto p-4">
              {isBase64Pdf(previewingFile) ? (
                <iframe
                  src={previewingFile}
                  className="w-full h-full border-none rounded-xl"
                  title={previewingFileName}
                />
              ) : isBase64Image(previewingFile) ? (
                <img
                  src={previewingFile}
                  alt={previewingFileName}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-stone-200 bg-white"
                />
              ) : (
                <div className="p-6 text-center text-stone-500">
                  <AlertCircle
                    size={32}
                    className="mx-auto mb-2 text-stone-400"
                  />
                  Visualização não suportada para este tipo de resposta.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SectionComponent>
  );
}
