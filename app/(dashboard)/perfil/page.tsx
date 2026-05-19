"use client";

import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Fingerprint,
  Shield,
  LogOut,
  Loader2,
  AlertTriangle,
  FileText,
  Eye,
  Download,
  X,
} from "lucide-react";
import { formatCPF, formatPhone } from "@/lib/masks";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: string;
  avatar?: string | null;
  admissionData?: Record<string, string> | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  // Estados para Pré-visualização de Arquivos
  const [activePdfBase64, setActivePdfBase64] = useState<string | null>(null);
  const [activePdfName, setActivePdfName] = useState<string>("");
  const [activeImageBase64, setActiveImageBase64] = useState<string | null>(null);
  const [activeImageName, setActiveImageName] = useState<string>("");

  const isBase64Pdf = (value: any): boolean => {
    return typeof value === "string" && value.startsWith("data:application/pdf;base64,");
  };

  const isBase64Image = (value: any): boolean => {
    return typeof value === "string" && value.startsWith("data:image/");
  };

  const formatFieldName = (name: string) => {
    const cleanName = name.split(":")[0];
    return cleanName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/auth/me");
        const result = await response.json();
        if (result.success && result.data) {
          setUser(result.data);
        } else {
          setErrorMessage(result.message || "Resposta inválida do servidor");
          console.error("Erro ao carregar perfil:", result.message);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro desconhecido na requisição",
        );
        console.error("Erro na requisição de perfil:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  async function handleRedirectToLogin() {
    setRedirecting(true);
    try {
      // Limpa o cookie inválido que está causando o erro antes de redirecionar.
      // Isso impede que o middleware intercepte o /login e jogue o usuário de volta para a Home.
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Erro ao limpar cookie no redirecionamento:", e);
    }
    window.location.href = "/login";
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redireciona para o login de forma limpa, reiniciando o estado do app
        window.location.href = "/login";
      } else {
        alert(data.message || "Erro ao fazer logout.");
        setLoggingOut(false);
      }
    } catch (error) {
      console.error("Erro ao tentar deslogar:", error);
      alert("Ocorreu um erro ao deslogar. Tente novamente.");
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <section className="p-5 flex flex-col items-center gap-5 w-full max-w-[1000px] mx-auto min-h-[80vh] justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-stone-500 font-semibold text-sm animate-pulse">
            Carregando seu perfil...
          </p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="p-5 flex flex-col items-center gap-5 w-full max-w-[1000px] mx-auto min-h-[80vh] justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 text-center max-w-md border border-stone-100 animate-fade-in">
          <AlertTriangle className="h-16 w-16 text-amber-500" />
          <h2 className="text-xl font-bold text-stone-800">
            Não foi possível carregar o perfil
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed">
            Houve um problema ao recuperar os dados da sua sessão. Por favor,
            tente fazer login novamente.
          </p>
          {errorMessage && (
            <p className="text-xs text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg font-mono">
              Detalhes: {errorMessage}
            </p>
          )}
          <button
            onClick={handleRedirectToLogin}
            disabled={redirecting}
            className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {redirecting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Redirecionando...
              </>
            ) : (
              "Ir para o Login"
            )}
          </button>
        </div>
      </section>
    );
  }

  // Gera as iniciais do nome para o avatar
  const initials = user.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join("")
    : "U";

  return (
    <section className="p-5 flex flex-col items-center gap-6 w-full mx-auto animate-fade-in">
      {/* Cabeçalho */}
      <div className="w-full flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-stone-700/70">
            Meu Perfil
          </h1>
          <p className="text-stone-600/70 mt-1">
            Gerencie suas informações pessoais e configurações de conta.
          </p>
        </div>
      </div>

      {/* Card Principal */}
      <div className="w-full bg-white rounded-3xl shadow-xl border border-stone-100/50 overflow-hidden">
        {/* Banner Decorativo */}
        <div className="h-32 bg-gradient-to-r from-blue-500/50 to-indigo-600 relative shadow-lg">
          {/* Badge do Papel do Usuário no Canto Superior Direito */}
          <div className="absolute top-4 right-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-md border ${
                user.role === "ADMIN"
                  ? "bg-blue-500/20 text-white border-blue-400/30"
                  : "bg-stone-500/20 text-white border-stone-400/30"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              {user.role === "ADMIN" ? "Administrador (RH)" : "Colaborador"}
            </span>
          </div>
        </div>

        {/* Informações do Usuário */}
        <div className="px-8 pb-8 relative">
          {/* Avatar sobreposto ao banner */}
          <div className="absolute -top-16 left-8">
            <div className="h-32 w-32 rounded-3xl bg-white p-2.5 shadow-lg border border-stone-100 flex items-center justify-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`Avatar de ${user.name}`}
                  className="h-full w-full rounded-2xl object-cover border border-stone-100"
                />
              ) : (
                <div className="h-full w-full rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-blue-600 border border-blue-100/50">
                  <span className="text-4xl font-bold tracking-wider">
                    {initials}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Nome e Email de destaque */}
          <div className="pt-20 pl-2 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-stone-800">{user.name}</h2>
              <p className="text-sm text-stone-500">{user.email}</p>
            </div>
            <div className="flex pt-2 pr-2">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex gap-2 p-3 border border-black/10 hover:bg-stone-400/20 cursor-pointer rounded-2xl justify-center items-center"
              >
                {loggingOut ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saindo...
                  </>
                ) : (
                  <>
                    <LogOut className="h-5 w-5  transition-transform group-hover:translate-x-0.5 duration-200" />
                    <span className="text-sm">Sair da Conta</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <hr className="my-8 border-stone-100" />

          {/* Grid de Detalhes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-2">
            {/* Campo: Nome Completo */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50/50 border border-stone-100/60 hover:bg-stone-55 transition-colors">
              <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                <User className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Nome Completo
                </span>
                <span className="text-sm font-semibold text-stone-700 truncate">
                  {user.name}
                </span>
              </div>
            </div>

            {/* Campo: E-mail */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50/50 border border-stone-100/60 hover:bg-stone-55 transition-colors">
              <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  E-mail
                </span>
                <span className="text-sm font-semibold text-stone-700 truncate">
                  {user.email}
                </span>
              </div>
            </div>

            {/* Campo: CPF */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50/50 border border-stone-100/60 hover:bg-stone-55 transition-colors">
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  CPF
                </span>
                <span className="text-sm font-semibold text-stone-700 truncate">
                  {formatCPF(user.cpf)}
                </span>
              </div>
            </div>

            {/* Campo: Nível de Acesso */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50/50 border border-stone-100/60 hover:bg-stone-55 transition-colors">
              <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Nível de Acesso
                </span>
                <span className="text-sm font-semibold text-stone-700 truncate">
                  {user.role === "ADMIN" ? "Administrador (RH)" : "Colaborador"}
                </span>
              </div>
            </div>
          </div>

          {user.admissionData && Object.keys(user.admissionData).length > 0 && (
            <>
              <hr className="my-8 border-stone-100" />
              
              {/* Seção: Meus Dados Admissionais */}
              <div className="pl-2 pr-2">
                <h3 className="text-md font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2 mb-6">
                  <FileText className="text-blue-500" size={20} />
                  Meus Dados Admissionais
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(user.admissionData).map(([key, value]) => {
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
                              Documento PDF enviado
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
              </div>
            </>
          )}

          <hr className="my-8 border-stone-100" />
        </div>
      </div>

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
    </section>
  );
}
