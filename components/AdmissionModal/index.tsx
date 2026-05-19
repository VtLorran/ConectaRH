"use client";

import { useEffect, useState } from "react";
import {
  X,
  UserRound,
  Mail,
  IdCard,
  Briefcase,
  ShieldAlert,
  CheckCircle2,
  Plus,
  FileSpreadsheet,
  Tags,
  Trash2,
} from "lucide-react";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";
import { formatCPF } from "@/lib/masks";

interface AdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hrUserId: string;
}

interface Template {
  id: string;
  name: string;
  description?: string | null;
  requiredFields: string[];
}

export default function AdmissionModal({
  isOpen,
  onClose,
  onSuccess,
  hrUserId,
}: AdmissionModalProps) {
  // Dados do Candidato (Lado Esquerdo)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");

  // Configuração dos Campos Adicionais (Lado Direito)
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateEditName, setTemplateEditName] = useState("");
  const [formFields, setFormFields] = useState<string[]>([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<"TEXT" | "FILE">("TEXT");

  // Criação de Template em tempo real
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");

  // Feedbacks
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Presets comuns para seleção rápida (Codificado com :TEXT ou :FILE)
  const fieldPresets = [
    { label: "Telefone", value: "telefone:TEXT" },
    { label: "Endereço", value: "endereco:TEXT" },
    { label: "Data de Nascimento", value: "data_nascimento:TEXT" },
    { label: "Foto de Perfil", value: "foto:FILE" },
    { label: "RG", value: "rg:FILE" },
    { label: "CNH", value: "cnh:FILE" },
    { label: "Título de Eleitor", value: "titulo_eleitor:FILE" },
    {
      label: "Comprovante de Residência",
      value: "comprovante_residencia:FILE",
    },
    { label: "Diploma / Certificado", value: "diploma:FILE" },
    { label: "PIS/PASEP", value: "pis_pasep:FILE" },
  ];

  // Busca os templates existentes ao abrir o modal
  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      const result = await response.json();
      if (result.success && result.data) {
        setTemplates(result.data);
      }
    } catch (err) {
      console.error("Erro ao carregar templates:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setName("");
      setEmail("");
      setCpf("");
      setRole("USER");
      setFormFields(["foto:FILE"]);
      setSelectedTemplateId("");
      setTemplateEditName("");
      setSaveAsTemplate(false);
      setNewTemplateName("");
      setNewTemplateDesc("");
      setNewFieldName("");
      setNewFieldType("TEXT");
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  // Gerenciamento de Campos Customizados
  const addField = (fieldName: string, type: "TEXT" | "FILE") => {
    const cleanField = fieldName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!cleanField) return;

    // Verifica se já existe um campo com o mesmo nome (mesmo que com tipo diferente)
    const exists = formFields.some((f) => f.split(":")[0] === cleanField);
    if (exists) {
      setError(`O campo "${formatFieldName(cleanField)}" já foi adicionado.`);
      return;
    }

    setError(null);
    setFormFields([...formFields, `${cleanField}:${type}`]);
  };

  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    addField(newFieldName, newFieldType);
    setNewFieldName("");
    setNewFieldType("TEXT");
  };

  const addPresetField = (presetValue: string) => {
    const [cleanName, type] = presetValue.split(":");
    addField(cleanName, type as "TEXT" | "FILE");
  };

  const removeField = (fieldKey: string) => {
    setFormFields(formFields.filter((f) => f !== fieldKey));
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template && Array.isArray(template.requiredFields)) {
        setFormFields(template.requiredFields);
        setTemplateEditName(template.name);
      }
    } else {
      setFormFields(["foto:FILE"]);
      setTemplateEditName("");
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplateId) return;

    const templateName =
      templates.find((t) => t.id === selectedTemplateId)?.name || "este modelo";

    if (
      !confirm(
        `Tem certeza que deseja excluir o modelo "${templateName}" permanentemente?`,
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/templates/${selectedTemplateId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMsg("Modelo excluído com sucesso!");
        setSelectedTemplateId("");
        setTemplateEditName("");
        setFormFields(["foto:FILE"]);
        await fetchTemplates();

        setTimeout(() => {
          setSuccessMsg(null);
        }, 2000);
      } else {
        setError(result.message || "Erro ao excluir o modelo.");
      }
    } catch (err) {
      console.error("Erro ao excluir modelo:", err);
      setError("Erro de conexão ao excluir o modelo.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplateId) return;

    const activeTemplate = templates.find((t) => t.id === selectedTemplateId);
    if (!activeTemplate) return;

    if (!templateEditName.trim()) {
      setError("O nome do modelo é obrigatório.");
      return;
    }

    if (formFields.length === 0) {
      setError("Não é possível salvar um modelo sem campos solicitados.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/templates/${selectedTemplateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateEditName.trim(),
          description: activeTemplate.description,
          requiredFields: formFields,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMsg("Modelo atualizado com sucesso!");
        await fetchTemplates();

        setTimeout(() => {
          setSuccessMsg(null);
        }, 2000);
      } else {
        setError(result.message || "Erro ao atualizar o modelo.");
      }
    } catch (err) {
      console.error("Erro ao atualizar modelo:", err);
      setError("Erro de conexão ao atualizar o modelo.");
    } finally {
      setLoading(false);
    }
  };

  const formatFieldName = (name: string) => {
    return name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validações Básicas
    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      setError("Por favor, insira um CPF válido com 11 dígitos.");
      return;
    }

    if (!name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Por favor, insira um e-mail válido.");
      return;
    }

    if (formFields.length === 0) {
      setError(
        "Por favor, selecione ou adicione pelo menos 1 campo/documento para o candidato preencher.",
      );
      return;
    }

    if (!hrUserId) {
      setError(
        "Erro interno: ID do usuário RH não encontrado. Tente recarregar.",
      );
      return;
    }

    setLoading(true);

    try {
      // 1. Salva como novo template se ativado
      if (saveAsTemplate) {
        if (!newTemplateName.trim()) {
          setError(
            "Para salvar o template, você precisa definir o Nome do Template.",
          );
          setLoading(false);
          return;
        }

        const templateResponse = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newTemplateName.trim(),
            description: newTemplateDesc.trim() || null,
            requiredFields: formFields,
            hrUserId: hrUserId,
          }),
        });

        const templateResult = await templateResponse.json();
        if (!templateResponse.ok || !templateResult.success) {
          throw new Error(
            templateResult.message || "Erro ao criar o template.",
          );
        }
      }

      // 2. Cria o convite de admissão
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          cpf: cleanCpf,
          candidateRole: role,
          hrUserId: hrUserId,
          formConfiguration: formFields, // passa os campos customizados/templates definidos (com tipos embutidos, Ex: "rg:FILE")
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMsg(
          "Convite e ficha admissional enviados com sucesso para o colaborador!",
        );

        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccessMsg(null);
        }, 2000);
      } else {
        setError(result.message || "Ocorreu um erro ao enviar o convite.");
      }
    } catch (err: any) {
      console.error("Erro no fluxo do modal de admissão:", err);
      setError(
        err.message || "Erro de rede. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-white w-full max-w-[900px] h-full max-h-[700px] rounded-3xl shadow-2xl overflow-hidden border border-stone-100 flex flex-col transform transition-all scale-100 relative">
        {/* Cabeçalho do Modal */}
        <div className="bg-[linear-gradient(to_right,#3B82F6,#1D4ED8)] p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all duration-200"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
          <h2 className="text-xl font-bold">Nova Admissão</h2>
          <p className="text-blue-100 text-xs mt-1">
            Configure os dados do candidato e selecione os campos/documentos
            adicionais exigidos na contratação.
          </p>
        </div>

        {/* Corpo do Modal - Duas Colunas */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="flex flex-col md:flex-row overflow-hidden max-h-[75vh] min-h-[500px]">
            {/* COLUNA ESQUERDA: Dados do Candidato */}
            <div className="w-full md:w-[45%] p-6 flex flex-col gap-5 overflow-y-auto border-b md:border-b-0 md:border-r border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2 border-b border-stone-50 pb-2">
                <UserRound size={16} className="text-blue-500" />
                1. Ficha de Contato
              </h3>

              {/* Input: Nome */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-600/80 uppercase tracking-wider ml-1">
                  Nome Completo
                </label>
                <InputField
                  icon={<UserRound size={18} className="text-stone-400" />}
                  placeholder="Digite o nome completo"
                  type="text"
                  required
                  disabled={loading || !!successMsg}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  classNameInput="text-sm text-stone-700"
                />
              </div>

              {/* Input: E-mail */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-600/80 uppercase tracking-wider ml-1">
                  E-mail do Colaborador
                </label>
                <InputField
                  icon={<Mail size={18} className="text-stone-400" />}
                  placeholder="exemplo@email.com"
                  type="email"
                  required
                  disabled={loading || !!successMsg}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  classNameInput="text-sm text-stone-700"
                />
              </div>

              {/* Input: CPF */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-600/80 uppercase tracking-wider ml-1">
                  CPF
                </label>
                <InputField
                  icon={<IdCard size={18} className="text-stone-400" />}
                  placeholder="000.000.000-00"
                  type="text"
                  required
                  disabled={loading || !!successMsg}
                  value={cpf}
                  onChange={handleCpfChange}
                  classNameInput="text-sm text-stone-700"
                />
              </div>

              {/* Input: Cargo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-600/80 uppercase tracking-wider ml-1">
                  Perfil de Acesso
                </label>
                <div className="flex w-full border border-stone-400/50 rounded-xl py-3 px-3 gap-2 items-center bg-transparent">
                  <Briefcase size={18} className="text-stone-400 shrink-0" />
                  <select
                    required
                    disabled={loading || !!successMsg}
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as "USER" | "ADMIN")
                    }
                    className="outline-none w-full bg-transparent text-sm text-stone-700 appearance-none cursor-pointer"
                  >
                    <option value="USER">Colaborador Comum (USER)</option>
                    <option value="ADMIN">Administrador / RH (ADMIN)</option>
                  </select>
                  <div className="pointer-events-none pr-1 flex items-center justify-center text-stone-400">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: Gerenciador de Campos (Com Scroll) */}
            <div className="w-full md:w-[55%] p-6 flex flex-col gap-5 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
              <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2 border-b border-stone-50 pb-2 shrink-0">
                <FileSpreadsheet size={16} className="text-blue-500" />
                2. Ficha Admissional Exigida
              </h3>

              {/* 1. Selecionar Template */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <label className="text-xs font-bold text-stone-600/80 uppercase tracking-wider ml-1">
                  Selecionar Padrão / Template Salvo
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex border border-stone-400/50 rounded-xl py-3 px-3 gap-2 items-center bg-transparent">
                    <Tags size={18} className="text-stone-400 shrink-0" />
                    <select
                      disabled={loading || !!successMsg}
                      value={selectedTemplateId}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="outline-none w-full bg-transparent text-sm text-stone-700 appearance-none cursor-pointer"
                    >
                      <option value="">-- Personalizar Manualmente --</option>
                      {templates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name} ({tpl.requiredFields.length} campos)
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none pr-1 flex items-center justify-center text-stone-400">
                      <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>

                  {selectedTemplateId && (
                    <button
                      type="button"
                      onClick={handleDeleteTemplate}
                      disabled={loading || !!successMsg}
                      className="bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-xl border border-red-100 shrink-0 cursor-pointer active:scale-95 transition-all flex items-center justify-center"
                      title="Excluir este modelo permanentemente"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                {/* Seletor de Ações para Template Selecionado */}
                {selectedTemplateId && (
                  <div className="flex flex-col bg-blue-50/50 border border-blue-100 p-4 rounded-2xl gap-3 mt-1 animate-fade-in">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider ml-1">
                        Editar Nome do Modelo
                      </span>
                      <input
                        type="text"
                        disabled={loading || !!successMsg}
                        value={templateEditName}
                        onChange={(e) => setTemplateEditName(e.target.value)}
                        className="px-3 py-2 border border-blue-200 rounded-lg text-xs font-semibold text-stone-700 outline-none focus:border-blue-500 bg-white"
                        placeholder="Nome do Modelo"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-[10px] font-semibold text-blue-700 leading-normal max-w-[65%]">
                        Modifique os campos abaixo e salve as alterações do
                        modelo.
                      </span>
                      <button
                        type="button"
                        onClick={handleUpdateTemplate}
                        disabled={
                          loading || !!successMsg || !templateEditName.trim()
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-3 py-2 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95 shrink-0 uppercase tracking-wider disabled:opacity-50"
                      >
                        Salvar Modelo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Inserção Manual de Campos com Tipo */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <label className="text-xs font-bold text-stone-600/80 uppercase tracking-wider ml-1">
                  Adicionar Campo Personalizado
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Titulo de Eleitor, CNH, Diploma"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    disabled={loading || !!successMsg}
                    className="flex-1 px-4 py-2.5 border border-stone-400/50 rounded-xl text-sm text-stone-700 outline-none focus:border-blue-500 transition-colors"
                  />

                  {/* Seletor do Tipo (Texto vs PDF) */}
                  <div className="flex border border-stone-400/50 rounded-xl px-3 items-center bg-transparent shrink-0">
                    <select
                      value={newFieldType}
                      onChange={(e) =>
                        setNewFieldType(e.target.value as "TEXT" | "FILE")
                      }
                      disabled={loading || !!successMsg}
                      className="outline-none bg-transparent text-xs font-semibold text-stone-600 cursor-pointer appearance-none pr-4 relative"
                    >
                      <option value="TEXT">Texto</option>
                      <option value="FILE">PDF</option>
                    </select>
                    <div className="pointer-events-none -ml-3 flex items-center justify-center text-stone-400">
                      <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    disabled={loading || !!successMsg || !newFieldName.trim()}
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 border border-blue-100"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* 3. Presets rápidos */}
              <div className="flex flex-col gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider ml-1">
                  presets rápidos
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {fieldPresets.map((preset) => {
                    const [cleanName] = preset.value.split(":");
                    const active = formFields.some(
                      (f) => f.split(":")[0] === cleanName,
                    );
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        disabled={loading || !!successMsg || active}
                        onClick={() => addPresetField(preset.value)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                          active
                            ? "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed"
                            : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50 hover:text-stone-800"
                        }`}
                      >
                        + {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Lista dos campos adicionados com Badges */}
              <div className="flex flex-col gap-1.5 flex-1 min-h-[150px]">
                <label className="text-xs font-bold text-stone-600/80 uppercase tracking-wider ml-1">
                  Campos Solicitados ({formFields.length})
                </label>

                <div className="flex-1 bg-stone-50/50 border border-stone-200/50 rounded-2xl p-4 overflow-y-auto max-h-[220px] min-h-[120px] flex flex-col gap-2">
                  {formFields.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center italic my-auto">
                      Nenhum campo selecionado. Use presets acima ou digite
                      campos personalizados para incluí-los no formulário
                      admissional.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {formFields.map((field) => {
                        const [namePart, typePart] = field.split(":");
                        const isFile = typePart === "FILE";
                        return (
                          <div
                            key={field}
                            className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-stone-100 shadow-sm text-xs font-medium text-stone-700 animate-scale-in"
                          >
                            <span className="truncate pr-2 flex items-center gap-1.5 min-w-0">
                              <span className="truncate">
                                {formatFieldName(namePart)}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                                  isFile
                                    ? "bg-red-50 text-red-500 border border-red-100/50"
                                    : "bg-blue-50 text-blue-500 border border-blue-100/50"
                                }`}
                              >
                                {isFile ? "PDF" : "TXT"}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeField(field)}
                              disabled={loading || !!successMsg}
                              className="text-stone-400 hover:text-red-500 p-1 rounded-md transition-colors cursor-pointer shrink-0"
                              aria-label={`Remover ${formatFieldName(namePart)}`}
                            >
                              <X size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Salvar como novo template */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex flex-col gap-3 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    disabled={
                      loading || !!successMsg || formFields.length === 0
                    }
                    className="h-4 w-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Salvar Ficha Admissional como Modelo (Template)
                  </span>
                </label>

                {saveAsTemplate && (
                  <div className="flex flex-col gap-3 pt-2 border-t border-stone-200/50 animate-fade-in">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">
                        Nome do Template
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Desenvolvedor CLT, Estágio ADM"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        className="px-3 py-2 border border-stone-300 rounded-lg text-xs text-stone-700 outline-none focus:border-blue-500 bg-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">
                        Descrição (Opcional)
                      </span>
                      <input
                        type="text"
                        placeholder="Ex: Ficha padrão com documentos admissionais para cargos CLT."
                        value={newTemplateDesc}
                        onChange={(e) => setNewTemplateDesc(e.target.value)}
                        className="px-3 py-2 border border-stone-300 rounded-lg text-xs text-stone-700 outline-none focus:border-blue-500 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rodapé do Modal com Feedbacks e Submissão */}
          <div className="p-6 bg-stone-50 border-t border-stone-100 flex flex-col items-center  gap-4 shrink-0">
            {/* Feedbacks compactos */}

            {successMsg ||
              (error && (
                <div className="flex-1 max-w-[60%] text-left">
                  {error && (
                    <div className="flex items-center gap-2 text-red-700 text-xs font-medium bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                      <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
                      <span className="truncate">{error}</span>
                    </div>
                  )}
                  {successMsg && (
                    <div className="flex items-center gap-2 text-green-700 text-xs font-medium bg-green-50 border border-green-100 px-3 py-2 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="truncate">{successMsg}</span>
                    </div>
                  )}
                </div>
              ))}
            {/* Botões de Ação */}
            <div className="flex gap-3 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || !!successMsg}
                className="px-5 py-3 text-stone-500 hover:text-stone-700 bg-white hover:bg-stone-100 rounded-2xl text-xs font-bold border border-stone-200 transition-all cursor-pointer flex-1 sm:flex-none"
              >
                Cancelar
              </button>
              <div className="flex-1 sm:w-[220px]">
                <SubmitButton
                  text={loading ? "Enviando..." : "Enviar Admissão"}
                  disabled={loading || !!successMsg}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
