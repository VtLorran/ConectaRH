"use client";

import { useState } from "react";
import {
  FileText,
  Eye,
  Download,
  Plus,
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import Modal from "@/components/Modal";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";

interface DocumentosProps {
  collaboratorId: string;
  formData: Record<string, unknown> | null;
  onUpdate: (updatedData: Record<string, unknown>) => void;
}

export default function Documentos({
  collaboratorId,
  formData,
  onUpdate,
}: DocumentosProps) {
  // Lightbox / Preview States
  const [activePdfBase64, setActivePdfBase64] = useState<string | null>(null);
  const [activePdfName, setActivePdfName] = useState<string>("");
  const [activeImageBase64, setActiveImageBase64] = useState<string | null>(null);
  const [activeImageName, setActiveImageName] = useState<string>("");

  // Add Document Modal States
  const [isAdding, setIsAdding] = useState(false);
  const [docName, setDocName] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingFileKey, setLoadingFileKey] = useState<string | null>(null);

  const isBase64Pdf = (value: unknown): boolean => {
    return typeof value === "string" && value.startsWith("data:application/pdf;base64,");
  };

  const isBase64Image = (value: unknown): boolean => {
    return typeof value === "string" && value.startsWith("data:image/");
  };

  const formatFieldName = (name: string) => {
    const cleanName = name.split(":")[0];
    return cleanName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Filter only documents (PDF or Image) and cast to [string, string][]
  const documents = Object.entries(formData || {}).filter(
    ([, value]) => isBase64Pdf(value) || isBase64Image(value)
  ) as [string, string][];

  const fetchFullFile = async (key: string): Promise<string> => {
    const res = await fetch(`/api/colaboradores/${collaboratorId}/documento?key=${encodeURIComponent(key)}`);
    if (!res.ok) {
      throw new Error("Erro ao buscar o arquivo completo no servidor.");
    }
    const data = await res.json();
    return data.fileData;
  };

  const handlePreviewFile = async (key: string, fileData: string) => {
    if (!fileData) return;
    let dataToPreview = fileData;
    if (fileData.endsWith("PLACEHOLDER")) {
      setLoadingFileKey(key);
      try {
        dataToPreview = await fetchFullFile(key);
      } catch (err) {
        console.error(err);
        alert("Não foi possível carregar o arquivo.");
        setLoadingFileKey(null);
        return;
      }
      setLoadingFileKey(null);
    }

    if (isBase64Pdf(dataToPreview)) {
      setActivePdfBase64(dataToPreview);
      setActivePdfName(key);
    } else if (isBase64Image(dataToPreview)) {
      setActiveImageBase64(dataToPreview);
      setActiveImageName(key);
    } else {
      try {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.title = "Pré-visualização do Arquivo";
          newWindow.document.write(
            `<body style="margin:0; background: #262626; display: flex; align-items: center; justify-content: center;">
              <embed src="${dataToPreview}" width="100%" height="100%" />
            </body>`
          );
          newWindow.document.close();
        }
      } catch (e) {
        console.error(e);
        const link = document.createElement("a");
        link.href = dataToPreview;
        link.target = "_blank";
        link.click();
      }
    }
  };

  const handleDownloadFile = async (key: string, fileData: string, fieldName: string) => {
    let dataToDownload = fileData;
    if (fileData.endsWith("PLACEHOLDER")) {
      setLoadingFileKey(key);
      try {
        dataToDownload = await fetchFullFile(key);
      } catch (err) {
        console.error(err);
        alert("Não foi possível carregar o arquivo.");
        setLoadingFileKey(null);
        return;
      }
      setLoadingFileKey(null);
    }

    const link = document.createElement("a");
    link.href = dataToDownload;
    const extension = isBase64Pdf(dataToDownload) ? "pdf" : "png";
    link.download = `${fieldName}.${extension}`;
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocFile(file);
      setErrorMessage("");
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!docName.trim()) {
      setErrorMessage("Por favor, insira o nome do documento.");
      return;
    }

    if (!docFile) {
      setErrorMessage("Por favor, selecione um arquivo.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(docFile);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });

      const normalizedKey = docName.trim().toLowerCase().replace(/\s+/g, "_") + ":file";

      // Prepare updated form data
      const updatedFormData = {
        ...(formData || {}),
        [normalizedKey]: base64,
      };

      // PATCH request to update collaborator's admission data
      const res = await fetch(`/api/colaboradores/${collaboratorId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData: updatedFormData,
        }),
      });

      if (!res.ok) {
        throw new Error("Erro ao salvar o documento no servidor.");
      }

      const updatedUser = await res.json();
      onUpdate(updatedUser.formData || updatedFormData);

      setSuccessMessage("Documento adicionado com sucesso!");
      setDocName("");
      setDocFile(null);
      
      // Delay closing modal to show success message
      setTimeout(() => {
        setIsAdding(false);
        setSuccessMessage("");
      }, 1200);
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : "Ocorreu um erro ao adicionar o documento.";
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (keyToDelete: string) => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir o documento "${formatFieldName(keyToDelete)}"?`
      )
    ) {
      return;
    }

    try {
      const updatedFormData = { ...(formData || {}) };
      delete updatedFormData[keyToDelete];

      const res = await fetch(`/api/colaboradores/${collaboratorId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData: updatedFormData,
        }),
      });

      if (!res.ok) {
        throw new Error("Erro ao excluir o documento no servidor.");
      }

      const updatedUser = await res.json();
      onUpdate(updatedUser.formData || updatedFormData);
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao excluir o documento."
      );
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-stone-100 pb-3">
        <h3 className="text-md font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
          <FileText className="text-blue-500" size={20} />
          Documentos
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          Adicionar Documento
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* Existing Documents */}
        {documents.map(([key, value]) => {
          const isPdf = isBase64Pdf(value);
          const isImage = isBase64Image(value);
          const fieldName = key.split(":")[0];

          if (isPdf) {
            return (
              <div
                key={key}
                className="flex flex-col justify-between gap-4 bg-stone-50/50 p-5 rounded-2xl border border-stone-100 hover:bg-stone-50 transition-all shadow-sm min-h-[160px]"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    {formatFieldName(key)}
                  </span>
                  <span className="text-xs text-stone-500 italic mt-1.5 flex items-center gap-1.5">
                    <FileText size={14} className="text-red-500 shrink-0" />
                    Documento PDF enviado
                  </span>
                </div>
                <div className="flex gap-2 items-center mt-auto">
                  <button
                    type="button"
                    disabled={loadingFileKey !== null}
                    onClick={() => handlePreviewFile(key, value)}
                    className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 p-2.5 rounded-xl font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03] disabled:opacity-50"
                    title="Visualizar PDF"
                  >
                    {loadingFileKey === key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={loadingFileKey !== null}
                    onClick={() => handleDownloadFile(key, value, fieldName)}
                    className="bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200/50 p-2.5 rounded-xl font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03] disabled:opacity-50"
                    title="Instalar / Baixar PDF"
                  >
                    {loadingFileKey === key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={loadingFileKey !== null}
                    onClick={() => handleDeleteDocument(key)}
                    className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 p-2.5 rounded-xl font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03] disabled:opacity-50"
                    title="Excluir Documento"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          }

          if (isImage) {
            return (
              <div
                key={key}
                className="flex flex-col justify-between gap-4 bg-stone-50/50 p-5 rounded-2xl border border-stone-100 hover:bg-stone-50 transition-all shadow-sm min-h-[160px]"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    {formatFieldName(key)}
                  </span>
                  <span className="text-xs text-stone-500 italic mt-1.5 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-emerald-500 shrink-0" />
                    Imagem / Foto enviada
                  </span>
                </div>
                <div className="flex gap-2 items-center mt-auto">
                  <button
                    type="button"
                    disabled={loadingFileKey !== null}
                    onClick={() => handlePreviewFile(key, value)}
                    className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 p-2.5 rounded-xl font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03] disabled:opacity-50"
                    title="Visualizar Foto"
                  >
                    {loadingFileKey === key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={loadingFileKey !== null}
                    onClick={() => handleDownloadFile(key, value, fieldName)}
                    className="bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200/50 p-2.5 rounded-xl font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03] disabled:opacity-50"
                    title="Instalar / Baixar Foto"
                  >
                    {loadingFileKey === key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={loadingFileKey !== null}
                    onClick={() => handleDeleteDocument(key)}
                    className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 p-2.5 rounded-xl font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03] disabled:opacity-50"
                    title="Excluir Documento"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          }

          return null;
        })}

        {/* Empty State */}
        {documents.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center gap-2 bg-stone-50/50 rounded-2xl border border-stone-100">
            <FileText size={40} className="text-stone-300" />
            <p className="text-stone-500 font-semibold text-sm">
              Nenhum documento de admissão disponível
            </p>
            <p className="text-stone-400 text-xs max-w-xs">
              Adicione novos documentos clicando no botão &quot;Adicionar Documento&quot; acima.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Inserir Novo Documento */}
      {isAdding && (
        <Modal
          isOpen={isAdding}
          onClose={() => {
            setIsAdding(false);
            setDocName("");
            setDocFile(null);
            setErrorMessage("");
            setSuccessMessage("");
          }}
          title="Adicionar Novo Documento"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAddDocument} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Nome do Documento
              </label>
              <InputField
                type="text"
                placeholder="Digite o nome (Ex: RG, CNH, Diploma)"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Arquivo do Documento
              </label>
              <div className="relative w-full">
                <label className="flex items-center justify-center gap-2 border border-stone-300 bg-white hover:bg-stone-50 px-4 py-3 rounded-xl cursor-pointer text-sm font-semibold text-stone-600 transition-all">
                  <Upload size={16} className="text-stone-400" />
                  <span className="truncate max-w-[240px]">
                    {docFile ? docFile.name : "Selecionar PDF ou Imagem"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    className="hidden"
                    required
                  />
                </label>
              </div>
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

            <div className="flex justify-center  gap-3 border-t border-stone-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setDocName("");
                  setDocFile(null);
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
                <span className="text-sm font-bold truncate">
                  Visualizando: {formatFieldName(activePdfName)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivePdfBase64(null);
                  setActivePdfName("");
                }}
                className="text-stone-400 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all duration-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

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
            <div className="bg-stone-900 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="text-blue-400" size={18} />
                <span className="text-sm font-bold truncate">
                  Visualizando: {formatFieldName(activeImageName)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveImageBase64(null);
                  setActiveImageName("");
                }}
                className="text-stone-400 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all duration-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

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
    </div>
  );
}