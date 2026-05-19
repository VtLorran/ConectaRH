"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  User, 
  Mail, 
  FileText, 
  Clock, 
  ShieldCheck, 
  ShieldAlert,
  Eye,
  Download,
  X,
  RefreshCcw,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { formatCPF, formatPhone } from "@/lib/masks";

interface AdmissionDetails {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateCpf: string;
  candidateRole: "USER" | "ADMIN";
  status: "INVITED" | "SUBMITTED" | "UNDER_REVIEW" | "ACTIVE" | "REJECTED";
  formConfig: string[];
  formData: Record<string, string> | null;
}

export default function ReviewAdmissionPage() {
  const params = useParams();
  const router = useRouter();
  const admissionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [admission, setAdmission] = useState<AdmissionDetails | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activePdfBase64, setActivePdfBase64] = useState<string | null>(null);
  const [activePdfName, setActivePdfName] = useState<string>("");
  const [activeImageBase64, setActiveImageBase64] = useState<string | null>(null);
  const [activeImageName, setActiveImageName] = useState<string>("");
  
  // Controle dos Modais de Confirmação
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectAction, setRejectAction] = useState<"CORRECTION" | "PERMANENT">("CORRECTION");
  const [justification, setJustification] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchAdmissionDetails = async () => {
    try {
      const response = await fetch(`/api/admission/${admissionId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setAdmission(result.data);
      } else {
        setError(result.message || "Não foi possível carregar os dados desta admissão.");
      }
    } catch (err) {
      console.error("Erro ao carregar admissão:", err);
      setError("Erro de rede. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admissionId) {
      fetchAdmissionDetails();
    }
  }, [admissionId]);

  const handleEvaluate = async (status: "ACTIVE" | "REJECTED") => {
    setError(null);
    setSuccess(null);
    setIsActionLoading(true);

    try {
      const response = await fetch(`/api/admission/${admissionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(`Admissão ${status === "ACTIVE" ? "aprovada" : "rejeitada"} com sucesso!`);
        
        // Atualiza os dados locais e depois de 2 segundos redireciona de volta
        setTimeout(() => {
          router.push("/admissao");
        }, 2000);
      } else {
        setError(result.message || "Erro ao avaliar a admissão.");
        setIsActionLoading(false);
      }
    } catch (err) {
      console.error("Erro ao avaliar admissão:", err);
      setError("Erro de rede ao enviar a avaliação.");
      setIsActionLoading(false);
    }
  };

  const formatFieldName = (name: string) => {
    const cleanName = name.split(":")[0];
    return cleanName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const isBase64Pdf = (value: any): boolean => {
    return typeof value === "string" && value.startsWith("data:application/pdf;base64,");
  };

  const isBase64Image = (value: any): boolean => {
    return typeof value === "string" && value.startsWith("data:image/");
  };



  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <p className="text-stone-500 font-semibold text-sm animate-pulse">Carregando dados da admissão...</p>
      </div>
    );
  }

  if (error && !admission) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full border border-red-100 flex flex-col items-center gap-4">
          <XCircle className="h-16 w-16 text-red-500" />
          <h1 className="text-xl font-bold text-stone-800">Ops! Algo deu errado.</h1>
          <p className="text-stone-500 text-sm">{error}</p>
          <Link
            href="/admissao"
            className="mt-2 flex items-center gap-2 text-blue-500 hover:text-blue-600 font-semibold text-sm bg-blue-50 px-5 py-2.5 rounded-xl transition-all"
          >
            <ArrowLeft size={16} /> Voltar para Admissões
          </Link>
        </div>
      </div>
    );
  }

  if (!admission) return null;

  return (
    <div className="p-6 w-full mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      
      {/* Botão Voltar */}
      <div>
        <Link
          href="/admissao"
          className="inline-flex w-full items-center gap-2 text-stone-500 hover:text-stone-700 font-semibold text-sm bg-white border border-stone-200/60 px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>
      </div>

      {/* Alertas */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
          <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
          <p className="flex-1">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm font-medium">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <p className="flex-1">{success}</p>
        </div>
      )}

      {/* Banners de Status */}
      {admission.status === "ACTIVE" && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-700 p-5 rounded-2xl flex items-center gap-4">
          <CheckCircle2 className="h-10 w-10 text-green-500 shrink-0" />
          <div>
            <h3 className="font-bold text-sm">Admissão Aprovada</h3>
            <p className="text-xs text-green-600 mt-0.5">
              Este candidato já foi aprovado e sua conta de usuário ativa foi gerada no sistema.
            </p>
          </div>
        </div>
      )}

      {admission.status === "REJECTED" && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 p-5 rounded-2xl flex items-center gap-4">
          <XCircle className="h-10 w-10 text-red-500 shrink-0" />
          <div>
            <h3 className="font-bold text-sm">Admissão Recusada</h3>
            <p className="text-xs text-red-600 mt-0.5">
              O processo admissional deste candidato foi recusado pela equipe de Recursos Humanos.
            </p>
          </div>
        </div>
      )}

      {admission.status === "INVITED" && (
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-700 p-5 rounded-2xl flex items-center gap-4">
          <Clock className="h-10 w-10 text-blue-500 shrink-0" />
          <div>
            <h3 className="font-bold text-sm">Aguardando Preenchimento</h3>
            <p className="text-xs text-blue-600 mt-0.5">
              O link foi enviado por e-mail, mas o colaborador ainda não preencheu o formulário admissional.
            </p>
          </div>
        </div>
      )}

      {/* Bloco de Dados Principais (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card: Perfil Geral */}
        <div className="md:col-span-2 bg-white rounded-3xl shadow-xl border border-stone-100 p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-bold text-stone-700 flex items-center gap-2">
              <User className="text-blue-500" size={20} />
              Dados Principais do Colaborador
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">Informações básicas cadastradas na emissão do convite.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-stone-50 pt-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Nome Completo</span>
              <span className="text-sm font-semibold text-stone-700">{admission.candidateName}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">CPF</span>
              <span className="text-sm font-semibold text-stone-700">{formatCPF(admission.candidateCpf)}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">E-mail</span>
              <span className="text-sm font-semibold text-stone-700">{admission.candidateEmail}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Perfil Solicitado</span>
              <span className="inline-flex items-center w-fit text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg mt-1 border border-blue-100">
                {admission.candidateRole === "ADMIN" ? "Administrador / RH" : "Colaborador Comum"}
              </span>
            </div>
          </div>
        </div>

        {/* Card: Status Adicional */}
        <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2">
              <ShieldCheck className="text-blue-500" size={18} />
              Situação Cadastral
            </h3>
            
            <div className="flex flex-col gap-1 bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Status Atual</span>
              <span className={`text-xs font-bold uppercase mt-1 px-3 py-1 rounded-xl w-fit ${
                admission.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                admission.status === "REJECTED" ? "bg-red-100 text-red-700" :
                admission.status === "UNDER_REVIEW" ? "bg-amber-100 text-amber-700" :
                "bg-blue-100 text-blue-700"
              }`}>
                {admission.status === "ACTIVE" ? "Aprovado" :
                 admission.status === "REJECTED" ? "Recusado" :
                 admission.status === "UNDER_REVIEW" ? "Em Análise" :
                 "Pendente"}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-stone-400 border-t border-stone-100 pt-4 mt-4">
            ID do Processo:<br />
            <span className="font-mono text-stone-500 break-all">{admission.id}</span>
          </div>
        </div>
      </div>

      {/* Card: Dados Preenchidos pelo Candidato (Ficha Admissional) */}
      <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold text-stone-700 flex items-center gap-2">
            <FileText className="text-blue-500" size={20} />
            Ficha Admissional Preenchida
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">Informações adicionais fornecidas pelo próprio colaborador.</p>
        </div>

        <div className="border-t border-stone-50 pt-5">
          {!admission.formData || Object.keys(admission.formData).length === 0 ? (
            <div className="text-center py-8 text-stone-400 italic text-sm">
              Nenhuma informação foi preenchida pelo candidato ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(admission.formData).map(([key, value]) => {
                const isPdf = isBase64Pdf(value);
                const isImage = isBase64Image(value);
                const fieldName = key.split(":")[0];

                if (isPdf) {
                  return (
                    <div key={key} className="flex flex-col justify-between gap-4 bg-stone-50/50 p-4 rounded-2xl border border-stone-100 hover:bg-stone-50 transition-all shadow-sm min-h-[120px]">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          {formatFieldName(key)}
                        </span>
                        <span className="text-xs text-stone-500 italic mt-0.5 flex items-center gap-1.5">
                          <FileText size={12} className="text-red-500 shrink-0" />
                          Documento PDF anexado
                        </span>
                      </div>
                      <div className="flex gap-2 items-center mt-auto">
                        {/* Olhinho Icon Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setActivePdfBase64(value);
                            setActivePdfName(key);
                          }}
                          className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 p-2.5 rounded-xl font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03]"
                          title="Visualizar PDF"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Instalar / Download Button */}
                        <a
                          href={value}
                          download={`${fieldName}.pdf`}
                          className="bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200/50 p-2.5 rounded-xl font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03]"
                          title="Instalar / Baixar PDF"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    </div>
                  );
                }

                if (isImage) {
                  return (
                    <div key={key} className="flex flex-col justify-between gap-4 bg-stone-50/50 p-4 rounded-2xl border border-stone-100 hover:bg-stone-50 transition-all shadow-sm min-h-[150px]">
                      <div className="flex flex-col gap-3 min-w-0">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          {formatFieldName(key)}
                        </span>
                        <div className="relative group w-fit max-w-full">
                          <img 
                            src={value} 
                            alt={formatFieldName(key)} 
                            className="max-h-40 rounded-xl object-contain border border-stone-200 shadow-sm transition-all duration-200 hover:scale-[1.02] bg-stone-100 cursor-pointer"
                            onClick={() => {
                              setActiveImageBase64(value);
                              setActiveImageName(key);
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 items-center mt-auto">
                        {/* Olhinho Icon Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveImageBase64(value);
                            setActiveImageName(key);
                          }}
                          className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 p-2.5 rounded-xl font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03]"
                          title="Visualizar Foto"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Instalar / Download Button */}
                        <a
                          href={value}
                          download={`${fieldName}.png`}
                          className="bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200/50 p-2.5 rounded-xl font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03]"
                          title="Instalar / Baixar Foto"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    </div>
                  );
                }

                let displayValue = value;
                const normalizedFieldName = fieldName.toLowerCase();
                if (normalizedFieldName === "cpf") {
                  displayValue = formatCPF(value);
                } else if (
                  normalizedFieldName.includes("telefone") ||
                  normalizedFieldName.includes("celular") ||
                  normalizedFieldName.includes("phone")
                ) {
                  displayValue = formatPhone(value);
                }

                return (
                  <div key={key} className="flex flex-col gap-1 bg-stone-50/50 p-4 rounded-2xl border border-stone-100 hover:bg-stone-50 transition-all shadow-sm min-h-[100px]">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      {formatFieldName(key)}
                    </span>
                    <span className="text-sm font-semibold text-stone-700 mt-1 leading-relaxed break-words">
                      {displayValue || <span className="italic text-stone-400 font-normal">Não informado</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ações de Avaliação (Só exibe se estiver em UNDER_REVIEW) */}
      {admission.status === "UNDER_REVIEW" && !isActionLoading && (
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          
          {/* Botão Reprovar */}
          <button
            onClick={() => {
              setRejectAction("CORRECTION");
              setJustification("");
              setModalError(null);
              setShowRejectModal(true);
            }}
            disabled={isActionLoading || !!success}
            className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 py-4 px-6 rounded-2xl font-bold shadow-sm hover:shadow transition-all active:scale-[0.99] flex justify-center items-center gap-2 cursor-pointer"
          >
            <XCircle size={18} />
            Recusar Admissão
          </button>
 
          {/* Botão Aprovar */}
          <button
            onClick={() => {
              setModalError(null);
              setShowApproveModal(true);
            }}
            disabled={isActionLoading || !!success}
            className="flex-1 bg-[linear-gradient(to_right,#2f5fd0,#2ec4b6)] hover:brightness-110 text-white py-4 px-6 rounded-2xl font-bold shadow-lg transition-all active:scale-[0.99] flex justify-center items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 size={18} />
            Aprovar Admissão
          </button>
        </div>
      )}

      {/* Feedback de Loading ao Executar Ação */}
      {isActionLoading && (
        <div className="bg-white border border-stone-100 p-6 rounded-2xl shadow-lg flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <p className="text-stone-500 font-semibold text-sm">Enviando sua avaliação admissional...</p>
        </div>
      )}

      {/* Lightbox / Modal de Pré-visualização do PDF */}
      {activePdfBase64 && (
        <div
          onClick={() => {
            setActivePdfBase64(null);
            setActivePdfName("");
          }}
          className="fixed inset-0 bg-stone-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden border border-stone-100 flex flex-col transform transition-all scale-100 relative animate-scale-in"
          >
            {/* Lightbox Header */}
            <div className="bg-stone-900 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="text-red-500" size={18} />
                <span className="text-sm font-bold truncate">Visualizando: {formatFieldName(activePdfName)}</span>
              </div>
              <button
                onClick={() => {
                  setActivePdfBase64(null);
                  setActivePdfName("");
                }}
                className="text-stone-400 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all duration-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Lightbox Content - IFrame */}
            <div className="flex-1 bg-stone-100">
              <iframe
                src={activePdfBase64}
                className="w-full h-full border-none"
                title={activePdfName}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Modal de Pré-visualização de Imagem */}
      {activeImageBase64 && (
        <div
          onClick={() => {
            setActiveImageBase64(null);
            setActiveImageName("");
          }}
          className="fixed inset-0 bg-stone-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden border border-stone-100 flex flex-col transform transition-all scale-100 relative animate-scale-in"
          >
            {/* Lightbox Header */}
            <div className="bg-stone-900 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="text-blue-400" size={18} />
                <span className="text-sm font-bold truncate">Visualizando: {formatFieldName(activeImageName)}</span>
              </div>
              <button
                onClick={() => {
                  setActiveImageBase64(null);
                  setActiveImageName("");
                }}
                className="text-stone-400 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all duration-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Lightbox Content - Image Preview */}
            <div className="flex-1 bg-stone-100 flex items-center justify-center p-6 overflow-auto">
              <img
                src={activeImageBase64}
                alt={activeImageName}
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-stone-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Aprovação */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-stone-100 p-6 flex flex-col gap-5 transform transition-all scale-100 relative animate-scale-in">
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle2 size={28} className="text-green-500 shrink-0" />
              <h3 className="text-lg font-bold text-stone-800">Confirmar Aprovação</h3>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              Você tem certeza que deseja aprovar a admissão de <strong className="text-stone-700">{admission.candidateName}</strong>?
            </p>
            <div className="bg-green-50/50 border border-green-100 p-4 rounded-2xl flex flex-col gap-2">
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Ações que serão realizadas:</span>
              <ul className="text-xs text-green-700/80 list-disc list-inside flex flex-col gap-1">
                <li>O status do processo será alterado para <strong>Ativo</strong>.</li>
                <li>Uma conta de colaborador válida será criada no sistema.</li>
                <li>Um e-mail parabenizando e enviando o link de login será disparado.</li>
              </ul>
            </div>

            {modalError && (
              <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 p-3 rounded-xl">
                {modalError}
              </div>
            )}

            <div className="flex gap-3 mt-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowApproveModal(false);
                  setModalError(null);
                }}
                disabled={isActionLoading}
                className="flex-1 bg-white hover:bg-stone-50 text-stone-500 border border-stone-200/60 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsActionLoading(true);
                  setModalError(null);
                  try {
                    const response = await fetch(`/api/admission/${admissionId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "ACTIVE" }),
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                      setSuccess("Admissão aprovada com sucesso! E-mail enviado.");
                      setShowApproveModal(false);
                      setTimeout(() => router.push("/admissao"), 2000);
                    } else {
                      setModalError(result.message || "Erro ao aprovar a admissão.");
                      setIsActionLoading(false);
                    }
                  } catch (err) {
                    setModalError("Erro de conexão ao enviar a aprovação.");
                    setIsActionLoading(false);
                  }
                }}
                disabled={isActionLoading}
                className="flex-1 bg-[linear-gradient(to_right,#10B981,#059669)] hover:brightness-110 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex justify-center items-center gap-1.5 cursor-pointer border-none"
              >
                {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : "Sim, Aprovar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rejeição Integrado */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-stone-100 p-6 flex flex-col gap-5 transform transition-all scale-100 relative animate-scale-in">
            <div className="flex items-center gap-3 text-red-600">
              <XCircle size={28} className="text-red-500 shrink-0" />
              <h3 className="text-lg font-bold text-stone-800">Recusar Admissão</h3>
            </div>
            
            <p className="text-sm text-stone-500 leading-relaxed">
              Como você deseja proceder com a recusa de <strong className="text-stone-700">{admission.candidateName}</strong>?
            </p>

            {/* Seleção do Tipo de Recusa (Cards de Seleção Rápida) */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setRejectAction("CORRECTION");
                  setModalError(null);
                }}
                className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  rejectAction === "CORRECTION"
                    ? "border-amber-400 bg-amber-50/20 ring-2 ring-amber-400/20"
                    : "border-stone-200 bg-white hover:bg-stone-50/50"
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                  <RefreshCcw size={13} className={rejectAction === "CORRECTION" ? "text-amber-500" : "text-stone-400"} />
                  Para Correção
                </span>
                <span className="text-[10px] text-stone-400 mt-1 leading-snug">
                  Mantém a admissão no sistema e permite que o candidato corrija os dados enviados.
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRejectAction("PERMANENT");
                  setModalError(null);
                }}
                className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  rejectAction === "PERMANENT"
                    ? "border-red-400 bg-red-50/20 ring-2 ring-red-400/20"
                    : "border-stone-200 bg-white hover:bg-stone-50/50"
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                  <Trash2 size={13} className={rejectAction === "PERMANENT" ? "text-red-500" : "text-stone-400"} />
                  Permanente
                </span>
                <span className="text-[10px] text-stone-400 mt-1 leading-snug">
                  Exclui a admissão do banco de dados definitivamente e cancela o processo.
                </span>
              </button>
            </div>

            {/* Feedback / Inputs Dinâmicos */}
            {rejectAction === "CORRECTION" ? (
              <div className="flex flex-col gap-2 animate-fade-in">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider ml-1">
                  Justificativa de Correção <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Explique quais documentos ou informações precisam ser corrigidos pelo candidato (ex: CPF incorreto, RG ilegível, etc.)"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none text-sm text-stone-700 resize-none leading-relaxed transition-all"
                />
                <p className="text-[10px] text-stone-400 italic leading-snug">
                  Este feedback e o link para preenchimento serão enviados automaticamente por e-mail para o colaborador.
                </p>
              </div>
            ) : (
              <div className="bg-red-50/50 border border-red-100 p-4 rounded-2xl flex flex-col gap-1.5 animate-fade-in">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert size={12} />
                  Ação Irreversível
                </span>
                <p className="text-xs text-red-700/80 leading-relaxed">
                  A admissão deste candidato será **excluída fisicamente** do banco de dados e o processo será cancelado. Um e-mail notificando e lamentando o cancelamento do processo será enviado para ele.
                </p>
              </div>
            )}

            {modalError && (
              <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 p-3 rounded-xl">
                {modalError}
              </div>
            )}

            <div className="flex gap-3 mt-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setJustification("");
                  setModalError(null);
                }}
                disabled={isActionLoading}
                className="flex-1 bg-white hover:bg-stone-50 text-stone-500 border border-stone-200/60 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (rejectAction === "CORRECTION" && !justification.trim()) {
                    setModalError("Por favor, informe a justificativa para que o candidato saiba o que deve ser corrigido.");
                    return;
                  }

                  setIsActionLoading(true);
                  setModalError(null);

                  try {
                    const response = await fetch(`/api/admission/${admissionId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        status: "REJECTED",
                        action: rejectAction,
                        justification: rejectAction === "CORRECTION" ? justification : undefined,
                      }),
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                      setSuccess(
                        rejectAction === "CORRECTION"
                          ? "Admissão enviada para correção e e-mail com feedback disparado!"
                          : "Admissão excluída permanentemente com sucesso!"
                      );
                      setShowRejectModal(false);
                      setTimeout(() => router.push("/admissao"), 2000);
                    } else {
                      setModalError(result.message || "Erro ao processar a recusa da admissão.");
                      setIsActionLoading(false);
                    }
                  } catch (err) {
                    setModalError("Erro de conexão ao enviar a recusa.");
                    setIsActionLoading(false);
                  }
                }}
                disabled={isActionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex justify-center items-center gap-1.5 cursor-pointer border-none"
              >
                {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : "Confirmar Recusa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
