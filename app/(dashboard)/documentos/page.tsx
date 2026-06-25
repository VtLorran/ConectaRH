"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Folder as FolderIcon,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Eye,
  Download,
  Calendar,
  ChevronRight,
  ArrowLeft,
  Upload,
} from "lucide-react";
import SectionComponent from "@/components/SectionComponent";
import TittleHeader from "@/components/TittleHeader";
import Breadcrumb from "@/components/Breadcrumb";
import Modal from "@/components/Modal";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";
import { useRouter } from "next/navigation";

interface DocumentItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Folder {
  id: string;
  name: string;
  documents: DocumentItem[];
  createdAt: string;
  updatedAt: string;
}

export default function DocumentosPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Navigation state: selected folder
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const router = useRouter();

  // Modal States - Folder
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderSubmitting, setFolderSubmitting] = useState(false);
  const [folderError, setFolderError] = useState("");

  // Modal States - Document Upload
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docError, setDocError] = useState("");

  // Document preview state
  const [previewingFile, setPreviewingFile] = useState<string | null>(null);
  const [previewingFileName, setPreviewingFileName] = useState("");
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);

  const fetchFolders = async (selectFolderIdToRefresh?: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/folders");
      if (!res.ok) throw new Error("Erro ao buscar pastas.");
      const result = await res.json();
      if (result.success) {
        setFolders(result.data);
        if (selectFolderIdToRefresh) {
          const updatedSelected = result.data.find(
            (f: Folder) => f.id === selectFolderIdToRefresh,
          );
          if (updatedSelected) {
            setSelectedFolder(updatedSelected);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFolderError("");
    if (!newFolderName.trim()) {
      setFolderError("O nome da pasta é obrigatório");
      return;
    }
    setFolderSubmitting(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao criar pasta");
      }
      setNewFolderName("");
      setIsAddingFolder(false);
      await fetchFolders();
    } catch (err: any) {
      setFolderError(err.message || "Erro ao criar pasta.");
    } finally {
      setFolderSubmitting(false);
    }
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Tem certeza que deseja excluir esta pasta e TODOS os seus arquivos permanentemente?",
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao excluir pasta");
      }
      if (selectedFolder && selectedFolder.id === folderId) {
        setSelectedFolder(null);
      }
      await fetchFolders();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir pasta.");
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocError("");
    if (!selectedFolder) return;
    if (!selectedFile) {
      setDocError("Por favor, selecione um arquivo.");
      return;
    }

    const docName = newDocName.trim() || selectedFile.name;
    setDocSubmitting(true);

    try {
      // Convert file to Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: docName,
          value: base64,
          folderId: selectedFolder.id,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao fazer upload do documento.");
      }

      setNewDocName("");
      setSelectedFile(null);
      setIsAddingDoc(false);
      await fetchFolders(selectedFolder.id);
    } catch (err: any) {
      setDocError(err.message || "Erro ao fazer upload.");
    } finally {
      setDocSubmitting(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm("Deseja realmente excluir este documento?")) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao excluir documento");
      }
      if (selectedFolder) {
        await fetchFolders(selectedFolder.id);
      }
    } catch (err: any) {
      alert(err.message || "Erro ao excluir documento.");
    }
  };

  const handlePreviewFile = async (docId: string, name: string) => {
    setLoadingFileId(docId);
    try {
      const res = await fetch(`/api/documents/${docId}`);
      if (!res.ok) throw new Error();
      const result = await res.json();
      if (result.success) {
        setPreviewingFile(result.data.value);
        setPreviewingFileName(name);
      }
    } catch (err) {
      alert("Não foi possível carregar o arquivo.");
    } finally {
      setLoadingFileId(null);
    }
  };

  const handleDownloadFile = async (docId: string, name: string) => {
    setLoadingFileId(docId);
    try {
      const res = await fetch(`/api/documents/${docId}`);
      if (!res.ok) throw new Error();
      const result = await res.json();
      if (result.success) {
        const link = document.createElement("a");
        link.href = result.data.value;
        const isPdf = result.data.value.startsWith("data:application/pdf");
        link.download = `${name}.${isPdf ? "pdf" : "png"}`;
        link.click();
      }
    } catch (err) {
      alert("Não foi possível baixar o arquivo.");
    } finally {
      setLoadingFileId(null);
    }
  };

  const filteredFolders = useMemo(() => {
    return folders.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [folders, searchQuery]);

  const filteredDocuments = useMemo(() => {
    if (!selectedFolder) return [];
    return selectedFolder.documents.filter((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [selectedFolder, searchQuery]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isBase64Pdf = (value: string) =>
    value.startsWith("data:application/pdf");
  const isBase64Image = (value: string) => value.startsWith("data:image/");

  const breadcrumbs = [
    { label: "Painel", href: "/" },
    { label: "Documentos", href: "/documentos" },
    ...(selectedFolder ? [{ label: selectedFolder.name, href: "#" }] : []),
  ];

  const alternativeBreadcrumbs = [
    { label: "Painel", href: "/" },
    { label: "Documentos", onclick: () => router.back() },
    ...(selectedFolder ? [{ label: selectedFolder.name, href: "#" }] : []),
  ];

  return (
    <SectionComponent>
      <TittleHeader
        tittle="Arquivos e Documentos"
        description="Criação de pastas e armazenamento de documentos"
        className="w-full"
      />
      <div className="w-full">
        {selectedFolder ? (
          <Breadcrumb items={alternativeBreadcrumbs} />
        ) : (
          <Breadcrumb items={breadcrumbs} />
        )}
      </div>

      {/* Main Layout Area */}
      <div className="w-full space-y-6">
        {/* Toolbar */}
        <div className="w-full bg-white p-6 rounded-3xl shadow-xl border border-stone-100/50 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Back button or search */}
          <div className="flex items-center gap-3 w-full md:max-w-md flex-1">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                size={18}
              />
              <input
                type="text"
                placeholder={
                  selectedFolder
                    ? "Pesquisar documentos..."
                    : "Pesquisar pastas..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200/80 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none text-stone-700 font-medium"
              />
            </div>
          </div>

          {/* Action Button */}
          {selectedFolder ? (
            <button
              onClick={() => {
                setDocError("");
                setSelectedFile(null);
                setNewDocName("");
                setIsAddingDoc(true);
              }}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Upload size={18} />
              Enviar Documento
            </button>
          ) : (
            <button
              onClick={() => {
                setFolderError("");
                setNewFolderName("");
                setIsAddingFolder(true);
              }}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus size={18} />
              Nova Pasta
            </button>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && folders.length === 0 ? (
          <div className="py-24 w-full bg-white rounded-3xl border border-stone-100 shadow-xl flex flex-col items-center justify-center text-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-stone-500 font-semibold text-sm animate-pulse">
              Carregando documentos da empresa...
            </p>
          </div>
        ) : (
          <div className="w-full bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-xl min-h-[400px]">
            {/* FOLDER SELECTION VIEW */}
            {!selectedFolder ? (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
                  <FolderIcon className="text-blue-500" size={20} />
                  Pastas Gerais
                </h3>

                {filteredFolders.length === 0 ? (
                  <div className="py-16 text-center">
                    <FolderIcon
                      size={48}
                      className="mx-auto text-stone-300 mb-4"
                    />
                    <h4 className="text-stone-700 font-bold text-base">
                      Nenhuma pasta encontrada
                    </h4>
                    <p className="text-stone-400 text-xs mt-1">
                      Crie pastas para organizar seus documentos.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFolders.map((folder) => (
                      <div
                        key={folder.id}
                        onClick={() => {
                          setSelectedFolder(folder);
                          setSearchQuery("");
                        }}
                        className="group bg-stone-50/40 hover:bg-stone-50 border border-stone-200/50 hover:border-blue-200 p-5 rounded-2xl cursor-pointer shadow-sm hover:shadow transition-all flex items-start gap-4 relative"
                      >
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
                          <FolderIcon size={24} />
                        </div>
                        <div className="min-w-0 pr-8">
                          <h4 className="font-bold text-stone-850 truncate group-hover:text-blue-600 transition-colors">
                            {folder.name}
                          </h4>
                          <p className="text-xs text-stone-500 mt-1 font-semibold">
                            {folder.documents.length === 0
                              ? "Sem documentos"
                              : folder.documents.length === 1
                                ? "1 documento"
                                : `${folder.documents.length} documentos`}
                          </p>
                          <p className="text-[10px] text-stone-400 mt-2">
                            Criado em {formatDate(folder.createdAt)}
                          </p>
                        </div>

                        {/* Delete Folder */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteFolder(folder.id, e)}
                          className="absolute top-4 right-4 text-stone-350 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50/80 cursor-pointer"
                          title="Excluir Pasta"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* DOCUMENTS WITHIN SELECTED FOLDER VIEW */
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                    <FolderOpen className="text-blue-500" size={20} />
                    {selectedFolder.name}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedFolder(null);
                      setSearchQuery("");
                    }}
                    className="text-xs font-bold text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    Voltar para Pastas
                  </button>
                </div>

                {filteredDocuments.length === 0 ? (
                  <div className="py-16 text-center">
                    <FileText
                      size={48}
                      className="mx-auto text-stone-300 mb-4"
                    />
                    <h4 className="text-stone-700 font-bold text-base">
                      Nenhum documento nesta pasta
                    </h4>
                    <p className="text-stone-400 text-xs mt-1">
                      Clique em "Enviar Documento" para carregar arquivos nesta
                      pasta.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDocuments.map((doc) => {
                      const fileKey = doc.id;
                      const isLoading = loadingFileId === fileKey;

                      return (
                        <div
                          key={doc.id}
                          className="bg-stone-50/40 border border-stone-200/50 hover:border-stone-200 p-5 rounded-2xl shadow-sm transition-all flex flex-col justify-between min-h-[150px] relative"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-4">
                              <div className="p-2.5 bg-blue-50 text-blue-500 rounded-lg shrink-0">
                                <FileText size={20} />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="text-stone-350 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                title="Excluir Documento"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            <h4
                              className="font-bold text-stone-850 mt-3.5 leading-snug line-clamp-2"
                              title={doc.name}
                            >
                              {doc.name}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between border-t border-stone-100 pt-3 mt-4">
                            <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
                              <Calendar size={11} />
                              {formatDate(doc.createdAt)}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={loadingFileId !== null}
                                onClick={() =>
                                  handlePreviewFile(doc.id, doc.name)
                                }
                                className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 p-2 rounded-lg font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm disabled:opacity-50"
                                title="Visualizar Documento"
                              >
                                {isLoading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Eye size={14} />
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={loadingFileId !== null}
                                onClick={() =>
                                  handleDownloadFile(doc.id, doc.name)
                                }
                                className="bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200/50 p-2 rounded-lg font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm disabled:opacity-50"
                                title="Baixar Documento"
                              >
                                {isLoading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Download size={14} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: New Folder */}
      {isAddingFolder && (
        <Modal
          isOpen={isAddingFolder}
          title="Criar Nova Pasta"
          onClose={() => {
            setIsAddingFolder(false);
            setNewFolderName("");
            setFolderError("");
          }}
        >
          <form onSubmit={handleCreateFolder} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="folder-name"
                className="text-xs font-bold text-stone-700"
              >
                Nome da Pasta
              </label>
              <InputField
                id="folder-name"
                placeholder="Ex: Contratos, Jovem Aprendizes, Termos..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                required
              />
            </div>

            {folderError && (
              <div className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-100">
                <AlertCircle size={14} className="shrink-0" />
                <span>{folderError}</span>
              </div>
            )}

            <div className="flex justify-center gap-3 border-t border-stone-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingFolder(false);
                  setNewFolderName("");
                  setFolderError("");
                }}
                disabled={folderSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-400/50 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <SubmitButton
                text={folderSubmitting ? "Criando..." : "Criar Pasta"}
                disabled={folderSubmitting}
                className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Upload Document */}
      {isAddingDoc && (
        <Modal
          isOpen={isAddingDoc}
          title="Enviar Documento"
          onClose={() => {
            setIsAddingDoc(false);
            setNewDocName("");
            setSelectedFile(null);
            setDocError("");
          }}
        >
          <form onSubmit={handleUploadDocument} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="doc-name"
                className="text-xs font-bold text-stone-700"
              >
                Nome do Documento (Opcional)
              </label>
              <InputField
                id="doc-name"
                placeholder="Deixe em branco para usar o nome original do arquivo"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">
                Selecione o Arquivo (PDF ou Imagem)
              </label>
              <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-stone-300 hover:border-blue-500 bg-stone-50/50 hover:bg-stone-50 py-8 px-4 rounded-xl cursor-pointer text-xs font-bold text-stone-500 hover:text-blue-500 transition-all text-center">
                <Upload
                  size={24}
                  className="text-stone-450 group-hover:text-blue-500"
                />
                {selectedFile ? (
                  <span className="text-blue-600 font-semibold truncate max-w-xs">
                    {selectedFile.name}
                  </span>
                ) : (
                  <span>Clique para selecionar o arquivo</span>
                )}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {docError && (
              <div className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-100">
                <AlertCircle size={14} className="shrink-0" />
                <span>{docError}</span>
              </div>
            )}

            <div className="flex gap-3 border-t  border-stone-100 pt-4 justify-center mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingDoc(false);
                  setNewDocName("");
                  setSelectedFile(null);
                  setDocError("");
                }}
                disabled={docSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-400/50 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <SubmitButton
                text={docSubmitting ? "Enviando..." : "Enviar Documento"}
                disabled={docSubmitting}
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
                  Visualização não suportada para este tipo de arquivo.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SectionComponent>
  );
}
