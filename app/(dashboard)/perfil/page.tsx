"use client";

import { useEffect, useState, useRef } from "react";
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
  Cake,
  Calendar,
  Clock3,
  Palmtree,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  AlertCircle,
  MessageSquare,
  Check,
  Upload,
} from "lucide-react";
import { formatCPF, formatPhone, formatDate } from "@/lib/masks";
import SectionComponent from "@/components/SectionComponent";
import TittleHeader from "@/components/TittleHeader";
import Breadcrumb from "@/components/Breadcrumb";
import CardComponentCollaborator from "@/components/CardComponentColaborattor";
import Modal from "@/components/Modal";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: string;
  status: string;
  createdAt: string;
  avatar?: string | null;
  jobPosition?: {
    id: string;
    name: string;
    department: {
      id: string;
      name: string;
    };
  } | null;
  admissionData?: Record<string, any> | null;
  documentRequests?: any[];
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

  // Estados para Onboarding / Documentos Requeridos
  const [submittingOnboardingKey, setSubmittingOnboardingKey] = useState<string | null>(null);
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [loadingFileKey, setLoadingFileKey] = useState<string | null>(null);

  // Estados do Scroll dos Cards
  const [vacation, setVacation] = useState("");
  const [dailyWorkHours, setDailyWorkHours] = useState("");
  const [performance, setPerformance] = useState("");



  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);

  const isBase64Pdf = (value: any): boolean => {
    return typeof value === "string" && value.startsWith("data:application/pdf;base64,");
  };

  const isBase64Image = (value: any): boolean => {
    return typeof value === "string" && value.startsWith("data:image/");
  };

  const formatFieldName = (name: string) => {
    const cleanName = name.split(":")[0].toLowerCase();
    if (cleanName.includes("nascimento") || cleanName.includes("nasc")) {
      return "DATA DE NASCIMENTO";
    }
    if (cleanName.includes("endereco") || cleanName.includes("endereço") || cleanName.includes("rua") || cleanName.includes("address")) {
      return "ENDEREÇO";
    }
    if (cleanName.includes("telefone") || cleanName.includes("celular") || cleanName.includes("phone") || cleanName.includes("contato")) {
      return "TELEFONE";
    }
    return name.split(":")[0]
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getCollaboratorPt2Fields = (formData: Record<string, any> | null) => {
    if (!formData) return [];

    const fields: { label: string; value: string }[] = [];

    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value !== "string") return;
      if (value.startsWith("data:")) return;

      const namePart = key.split(":")[0];
      const normalizedName = namePart.toLowerCase();

      const isAddress =
        normalizedName.includes("endereco") ||
        normalizedName.includes("endereço") ||
        normalizedName.includes("rua") ||
        normalizedName.includes("address");
      const isBirthdate =
        normalizedName.includes("nascimento") ||
        normalizedName.includes("nasc") ||
        normalizedName.includes("data de nascimento") ||
        normalizedName.includes("data nascimento");
      const isPhone =
        normalizedName.includes("telefone") ||
        normalizedName.includes("celular") ||
        normalizedName.includes("phone") ||
        normalizedName.includes("contato");

      if (isAddress) {
        fields.push({ label: "ENDEREÇO", value });
      } else if (isBirthdate) {
        fields.push({ label: "DATA DE NASCIMENTO", value: formatDate(value) });
      } else if (isPhone) {
        fields.push({ label: "TELEFONE", value: formatPhone(value) });
      }
    });

    return fields;
  };

  const getStatusConfig = (statusKey: string | undefined) => {
    switch (statusKey) {
      case "ACTIVE":
        return {
          text: "Ativo",
          className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        };
      case "INACTIVE":
        return {
          text: "Inativo",
          className: "bg-stone-100 text-stone-600 border-stone-200",
        };
      case "VACATION":
        return {
          text: "Férias",
          className: "bg-blue-100 text-blue-700 border-blue-200",
        };
      case "SUSPENDED":
        return {
          text: "Suspenso",
          className: "bg-amber-100 text-amber-700 border-amber-200",
        };
      default:
        return {
          text: "Ativo",
          className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        };
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftGradient(scrollLeft > 5);
    setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleScroll();
    }, 100);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.clientX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.clientX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
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



  const fetchFullOnboardingFile = async (requestId: string, name: string): Promise<string> => {
    const res = await fetch(`/api/onboarding/${requestId}/documento?name=${encodeURIComponent(name)}`);
    if (!res.ok) {
      throw new Error("Erro ao buscar o arquivo completo no servidor.");
    }
    const data = await res.json();
    return data.fileData;
  };

  const handlePreviewOnboardingFile = async (requestId: string, name: string, fileData: string) => {
    if (!fileData) return;
    let dataToPreview = fileData;
    const fileKey = `${requestId}-${name}`;
    if (fileData.endsWith("PLACEHOLDER")) {
      setLoadingFileKey(fileKey);
      try {
        dataToPreview = await fetchFullOnboardingFile(requestId, name);
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
      setActivePdfName(name);
    } else if (isBase64Image(dataToPreview)) {
      setActiveImageBase64(dataToPreview);
      setActiveImageName(name);
    }
  };

  const handleDownloadOnboardingFile = async (requestId: string, name: string, fileData: string) => {
    let dataToDownload = fileData;
    const fileKey = `${requestId}-${name}`;
    if (fileData.endsWith("PLACEHOLDER")) {
      setLoadingFileKey(fileKey);
      try {
        dataToDownload = await fetchFullOnboardingFile(requestId, name);
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
    link.download = `${name}.${extension}`;
    link.click();
  };

  const handleOnboardingSubmitText = async (requestId: string, requirementName: string) => {
    const textVal = textAnswers[`${requestId}-${requirementName}`]?.trim();
    if (!textVal) return;

    const request = user?.documentRequests?.find((r) => r.id === requestId);
    if (!request) return;

    setSubmittingOnboardingKey(`${requestId}-${requirementName}`);

    try {
      const updatedAnswers = (request.answers as any[]).map((ans) => {
        if (ans.name === requirementName) {
          return { ...ans, value: textVal };
        }
        return ans;
      });

      const res = await fetch(`/api/onboarding/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: updatedAnswers }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message);

      // Update local state
      setUser((prev) => {
        if (!prev) return null;
        const updatedRequests = (prev.documentRequests || []).map((r) => {
          if (r.id === requestId) {
            return { ...r, answers: result.data.answers };
          }
          return r;
        });
        return { ...prev, documentRequests: updatedRequests };
      });
    } catch (err) {
      alert("Erro ao salvar resposta de texto.");
    } finally {
      setSubmittingOnboardingKey(null);
    }
  };

  const handleOnboardingUploadFile = async (
    requestId: string,
    requirementName: string,
    file: File
  ) => {
    if (!file) return;

    const request = user?.documentRequests?.find((r) => r.id === requestId);
    if (!request) return;

    const fileKey = `${requestId}-${requirementName}`;
    setSubmittingOnboardingKey(fileKey);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });

      const updatedAnswers = (request.answers as any[]).map((ans) => {
        if (ans.name === requirementName) {
          return { ...ans, value: base64 };
        }
        return ans;
      });

      const res = await fetch(`/api/onboarding/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: updatedAnswers }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message);

      // Update local state
      setUser((prev) => {
        if (!prev) return null;
        const updatedRequests = (prev.documentRequests || []).map((r) => {
          if (r.id === requestId) {
            return { ...r, answers: result.data.answers };
          }
          return r;
        });
        return { ...prev, documentRequests: updatedRequests };
      });
    } catch (err) {
      alert("Erro ao enviar arquivo.");
    } finally {
      setSubmittingOnboardingKey(null);
    }
  };

  const handleOnboardingClearAnswer = async (requestId: string, requirementName: string) => {
    if (!window.confirm("Deseja realmente remover o arquivo ou resposta enviada?")) return;

    const request = user?.documentRequests?.find((r) => r.id === requestId);
    if (!request) return;

    const fileKey = `${requestId}-${requirementName}`;
    setSubmittingOnboardingKey(fileKey);

    try {
      const updatedAnswers = (request.answers as any[]).map((ans) => {
        if (ans.name === requirementName) {
          return { ...ans, value: null };
        }
        return ans;
      });

      const res = await fetch(`/api/onboarding/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: updatedAnswers }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message);

      // Update local state
      setUser((prev) => {
        if (!prev) return null;
        const updatedRequests = (prev.documentRequests || []).map((r) => {
          if (r.id === requestId) {
            return { ...r, answers: result.data.answers };
          }
          return r;
        });
        return { ...prev, documentRequests: updatedRequests };
      });

      // Clear local input text if any
      setTextAnswers((prev) => {
        const next = { ...prev };
        delete next[fileKey];
        return next;
      });
    } catch (err) {
      alert("Erro ao limpar resposta.");
    } finally {
      setSubmittingOnboardingKey(null);
    }
  };

  const formatDateString = (dateStr: string) => {
    const date = new Date(dateStr);
    const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return utcDate.toLocaleDateString("pt-BR");
  };

  const calculateDays = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  async function handleRedirectToLogin() {
    setRedirecting(true);
    try {
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
      <section className="p-5 flex flex-col items-center gap-5 w-full max-w-[1400px] mx-auto min-h-[80vh] justify-center">
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
      <section className="p-5 flex flex-col items-center gap-5 w-full max-w-[1400px] mx-auto min-h-[80vh] justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 text-center max-w-md border border-stone-100 animate-fade-in">
          <AlertTriangle className="h-16 w-16 text-amber-500" />
          <h2 className="text-xl font-bold text-stone-800">
            Não foi possível carregar o perfil
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed">
            Houve um problemao ao recuperar os dados da sua sessão. Por favor,
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

  const initials = user.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join("")
    : "U";

  // Cálculos de aniversário e admissão
  const getBirthdateValue = (formData: Record<string, any> | null): string | null => {
    if (!formData) return null;

    const birthdateEntry = Object.entries(formData).find(([key, value]) => {
      if (typeof value !== "string") return false;
      const namePart = key.split(":")[0].toLowerCase();
      return (
        namePart.includes("nascimento") ||
        namePart.includes("nasc") ||
        namePart.includes("data de nascimento") ||
        namePart.includes("data nascimento")
      );
    });

    return birthdateEntry ? formatDate(birthdateEntry[1]) : null;
  };

  const dataNascimento = (() => {
    const value = getBirthdateValue(user.admissionData || null);

    if (!value) return null;

    const [dia, mes] = value.split("/");
    let mesPorExtenso: string = "";
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    const mesesPorNumero = [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
      "11",
      "12",
    ];

    for (let i = 0; i < meses.length; i++) {
      if (mes === mesesPorNumero[i]) {
        mesPorExtenso = meses[i];
        break;
      }
    }

    return {
      format: `${dia}/${mes}`,
      value: value,
      formExtenso: `${dia} de ${mesPorExtenso}`,
    };
  })();

  function parseBRDate(date: string): Date {
    const [day, month, year] = date.split("/");
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  function daysUntilNextBirthday(birthDateString: string): number {
    const today = new Date();
    const birthDate = parseBRDate(birthDateString);

    let nextBirthday = new Date(
      today.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate(),
    );

    if (nextBirthday < today) {
      nextBirthday = new Date(
        today.getFullYear() + 1,
        birthDate.getMonth(),
        birthDate.getDate(),
      );
    }

    const diffMs = nextBirthday.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  const getAdmissionInfo = () => {
    let admissionStr = "";

    if (user.admissionData) {
      const admissionEntry = Object.entries(user.admissionData).find(
        ([key, value]) => {
          if (typeof value !== "string") return false;
          const namePart = key.split(":")[0].toLowerCase();
          return (
            namePart.includes("admissao") ||
            namePart.includes("admissão") ||
            namePart.includes("admission") ||
            namePart.includes("data de admissão") ||
            namePart.includes("data admissao")
          );
        },
      );
      if (admissionEntry) {
        admissionStr = admissionEntry[1];
      }
    }

    let tempDate: Date;

    if (admissionStr) {
      if (admissionStr.includes("/")) {
        const parts = admissionStr.split("/");
        if (parts.length === 3) {
          tempDate = new Date(
            Number(parts[2]),
            Number(parts[1]) - 1,
            Number(parts[0]),
          );
        } else {
          tempDate = new Date(user.createdAt);
        }
      } else {
        tempDate = new Date(admissionStr);
        if (isNaN(tempDate.getTime())) {
          tempDate = new Date(user.createdAt);
        }
      }
    } else {
      tempDate = new Date(user.createdAt);
    }

    const d = String(tempDate.getDate()).padStart(2, "0");
    const m = String(tempDate.getMonth() + 1).padStart(2, "0");
    const y = tempDate.getFullYear();
    const formattedDate = `${d}/${m}/${y}`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    tempDate.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - tempDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const companyDays = diffDays >= 0 ? diffDays : 0;

    return {
      formattedDate,
      companyDays,
    };
  };

  const admissionInfo = getAdmissionInfo();

  const handlePreviewFile = (key: string, fileData: string) => {
    if (!fileData) return;
    if (isBase64Pdf(fileData)) {
      setActivePdfBase64(fileData);
      setActivePdfName(key);
    } else if (isBase64Image(fileData)) {
      setActiveImageBase64(fileData);
      setActiveImageName(key);
    } else {
      try {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.title = "Pré-visualização do Arquivo";
          newWindow.document.write(
            `<body style="margin:0; background: #262626; display: flex; align-items: center; justify-content: center;">
              <embed src="${fileData}" width="100%" height="100%" />
            </body>`,
          );
          newWindow.document.close();
        }
      } catch (e) {
        console.error(e);
        const link = document.createElement("a");
        link.href = fileData;
        link.target = "_blank";
        link.click();
      }
    }
  };

  const trilhaNavegação = [
    { label: "Meu Perfil", href: "/perfil" },
  ];

  return (
    <SectionComponent>
      <TittleHeader tittle="Meu Perfil" className="w-full" />
      <div className="w-full">
        <Breadcrumb items={trilhaNavegação} />
      </div>

      {/* Card Principal */}
      <div className="w-full p-8 bg-white rounded-3xl shadow-xl border border-stone-100/50 flex flex-col md:flex-row gap-8 items-center md:items-start animate-fade-in">
        {/* SEÇÃO DA IMAGEM */}
        <div className="flex items-center justify-center shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-stone-100 shadow-md overflow-hidden bg-stone-50">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 font-bold text-4xl">
              {initials}
            </div>
          )}
        </div>

        {/* INFORMAÇÕES DO USUÁRIO */}
        <div className="flex flex-col gap-4 pl-0 md:pl-4 pr-0 md:pr-8 py-2 border-r-0 md:border-r border-stone-500/10 min-w-0 w-full md:w-auto">
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
            <h1 className="font-bold text-stone-800 tracking-wider text-xl sm:text-2xl break-words max-w-full">
              {user.name}
            </h1>
            {(() => {
              const currentStatus = getStatusConfig(user.status);
              return (
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border shrink-0 ${currentStatus.className}`}
                >
                  {currentStatus.text}
                </span>
              );
            })()}
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm">
              <span className="font-bold text-stone-400 text-xs uppercase tracking-wider block mb-0.5">
                Nível de Acesso:
              </span>
              {user.role === "ADMIN" ? (
                <span className="inline-flex items-center text-xs font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200 mt-0.5">
                  Administrador (RH)
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-100 mt-0.5">
                  Colaborador
                </span>
              )}
            </p>

            <p className="text-sm">
              <span className="font-bold text-stone-400 text-xs uppercase tracking-wider block mb-0.5">
                Setor:
              </span>
              <span className="text-sm font-semibold text-stone-700 block mt-0.5">
                {user.jobPosition?.department?.name || "Não atribuído"}
              </span>
            </p>

            <p className="text-sm">
              <span className="font-bold text-stone-400 text-xs uppercase tracking-wider block mb-0.5">
                Cargo:
              </span>
              <span className="text-sm font-semibold text-stone-700 block mt-0.5">
                {user.jobPosition?.name || "Não atribuído"}
              </span>
            </p>

            <p className="text-sm">
              <span className="font-bold text-stone-400 text-xs uppercase tracking-wider block mb-0.5">
                Email:
              </span>{" "}
              <span className="font-medium text-stone-700">
                {user.email}
              </span>
            </p>

            <p className="text-sm">
              <span className="font-bold text-stone-400 text-xs uppercase tracking-wider block mb-0.5">
                CPF:
              </span>{" "}
              <span className="font-medium text-stone-700">
                {formatCPF(user.cpf)}
              </span>
            </p>
          </div>
        </div>

        {/* INFORMAÇÕES DO USUÁRIO PT2 */}
        <div className="flex flex-col pl-0 md:pl-8 py-2 flex-1 w-full border-r-0 md:border-r border-stone-500/10 pr-0 md:pr-8">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">
            Dados Adicionais
          </h3>
          {user.admissionData &&
          getCollaboratorPt2Fields(user.admissionData).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {getCollaboratorPt2Fields(user.admissionData).map(
                (field, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-1 bg-stone-50/50 p-4 rounded-2xl border border-stone-100 hover:bg-stone-50 transition-all shadow-sm"
                  >
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      {field.label}
                    </span>
                    <span className="text-sm font-semibold text-stone-700 leading-relaxed">
                      {field.value}
                    </span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="text-stone-400 italic text-sm">
              Nenhum dado de endereço, data de nascimento ou telefone
              respondido.
            </p>
          )}
        </div>

        {/* Sair da Conta */}
        <div className="flex shrink-0 w-full md:w-auto">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="bg-stone-50/50 p-4 rounded-2xl border border-stone-100 hover:bg-stone-50 transition-all shadow-sm text-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer hover:scale-[1.02] disabled:opacity-50 w-full md:w-auto"
          >
            {loggingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saindo...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 text-stone-850" />
                Sair da Conta
              </>
            )}
          </button>
        </div>
      </div>

      {/* Seção: Meus Documentos Admissionais */}
      {user.admissionData &&
        Object.entries(user.admissionData).filter(
          ([key, value]) => isBase64Pdf(value) || isBase64Image(value)
        ).length > 0 && (
          <div className="w-full bg-white rounded-3xl shadow-xl border border-stone-100/50 p-8 mt-4 animate-fade-in">
            <h3 className="text-md font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2 mb-6 border-b border-stone-100 pb-3">
              <FileText className="text-blue-500" size={20} />
              Meus Documentos Admissionais
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Object.entries(user.admissionData)
                .filter(([key, value]) => isBase64Pdf(value) || isBase64Image(value))
                .map(([key, value]) => {
                  const isPdf = isBase64Pdf(value);
                  const isImage = isBase64Image(value);
                  const fieldName = key.split(":")[0];

                  if (isPdf) {
                    return (
                      <div
                        key={key}
                        className="flex flex-col justify-between gap-4 bg-stone-50/50 p-4 rounded-2xl border border-stone-100 hover:bg-stone-50 transition-all shadow-sm min-h-[120px]"
                      >
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
                          <button
                            type="button"
                            onClick={() => handlePreviewFile(key, value)}
                            className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 p-2.5 rounded-xl font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03]"
                            title="Visualizar PDF"
                          >
                            <Eye size={16} />
                          </button>

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
                      <div
                        key={key}
                        className="flex flex-col justify-between gap-4 bg-stone-50/50 p-4 rounded-2xl border border-stone-100 hover:bg-stone-50 transition-all shadow-sm min-h-[150px]"
                      >
                        <div className="flex flex-col gap-3 min-w-0">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            {formatFieldName(key)}
                          </span>
                          <div className="relative group w-fit max-w-full">
                            <img
                              src={value}
                              alt={formatFieldName(key)}
                              className="max-h-40 rounded-xl object-contain border border-stone-200 shadow-sm transition-all duration-200 hover:scale-[1.02] bg-stone-100 cursor-pointer"
                              onClick={() => handlePreviewFile(key, value)}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 items-center mt-auto">
                          <button
                            type="button"
                            onClick={() => handlePreviewFile(key, value)}
                            className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 p-2.5 rounded-xl font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03]"
                            title="Visualizar Foto"
                          >
                            <Eye size={16} />
                          </button>

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

                  return null;
                })}
            </div>
          </div>
        )}

      {/* Seção: Documentos Requeridos (Onboarding) */}
      {user.documentRequests && user.documentRequests.length > 0 && (
        <div className="w-full bg-white rounded-3xl shadow-xl border border-stone-100/50 p-8 mt-4 animate-fade-in space-y-6">
          <h3 className="text-md font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2 mb-6 border-b border-stone-100 pb-3">
            <CheckCircle2 className="text-emerald-500" size={20} />
            Checklist de Integração / Onboarding
          </h3>

          <div className="space-y-6">
            {user.documentRequests.map((req: any) => {
              // Calculate completion progress for this request
              const total = req.requirements.length;
              const completed = req.answers.filter((ans: any) => ans.value !== null && ans.value !== "").length;
              const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div key={req.id} className="border border-stone-150 rounded-2xl p-6 bg-stone-50/20 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <span className="text-xs font-bold text-stone-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Calendar size={14} />
                      Solicitado em {formatDateString(req.createdAt)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-stone-700">{percentage}% Completo</span>
                      <div className="w-24 bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {req.answers.map((ans: any) => {
                      const hasValue = ans.value !== null && ans.value !== "";
                      const keyStr = `${req.id}-${ans.name}`;
                      const isSubmitting = submittingOnboardingKey === keyStr;

                      return (
                        <div
                          key={ans.name}
                          className="bg-white border border-stone-100 p-4 rounded-xl flex flex-col justify-between min-h-[140px] shadow-sm relative group"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black text-stone-750 truncate max-w-[150px] block">
                                {ans.name}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 uppercase">
                                {ans.type === "file" ? "Arquivo" : "Texto"}
                              </span>
                            </div>

                            <div className="mt-3.5 space-y-1.5">
                              {hasValue ? (
                                <>
                                  {ans.type === "file" ? (
                                    <div className="text-xs text-stone-600 font-semibold flex items-center gap-1.5">
                                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                      Arquivo enviado
                                    </div>
                                  ) : (
                                    <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-150 font-medium break-all line-clamp-3">
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
                                    ) : ans.status === "rejected" ? (
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
                                        <Loader2 size={11} className="animate-spin" />
                                        Aguardando análise
                                      </span>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="space-y-2">
                                  {ans.type === "file" ? (
                                    <label className="flex items-center justify-center gap-2 border border-dashed border-stone-300 hover:border-blue-500 bg-stone-50/50 hover:bg-stone-50 py-2.5 px-3 rounded-lg cursor-pointer text-xs font-bold text-stone-500 hover:text-blue-500 transition-all">
                                      {isSubmitting ? (
                                        <Loader2 size={14} className="animate-spin text-blue-500" />
                                      ) : (
                                        <Upload size={14} />
                                      )}
                                      <span>Enviar arquivo</span>
                                      <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        disabled={isSubmitting}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleOnboardingUploadFile(req.id, ans.name, file);
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  ) : (
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        placeholder="Digite aqui..."
                                        disabled={isSubmitting}
                                        value={textAnswers[keyStr] || ""}
                                        onChange={(e) =>
                                          setTextAnswers((prev) => ({
                                            ...prev,
                                            [keyStr]: e.target.value,
                                          }))
                                        }
                                        className="flex-1 bg-stone-50 border border-stone-300 rounded-lg p-2 text-xs focus:outline-none text-stone-700 font-medium"
                                      />
                                      <button
                                        type="button"
                                        disabled={isSubmitting || !textAnswers[keyStr]?.trim()}
                                        onClick={() => handleOnboardingSubmitText(req.id, ans.name)}
                                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-stone-300 text-white p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer shrink-0"
                                      >
                                        {isSubmitting ? (
                                          <Loader2 size={13} className="animate-spin" />
                                        ) : (
                                          <Check size={13} />
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {hasValue && (
                            <div className="flex gap-2 items-center mt-4 border-t border-stone-50 pt-3">
                              {ans.type === "file" && ans.value && (
                                <>
                                  <button
                                    type="button"
                                    disabled={loadingFileKey !== null}
                                    onClick={() => handlePreviewOnboardingFile(req.id, ans.name, ans.value)}
                                    className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 p-2 rounded-lg font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03] disabled:opacity-50"
                                    title="Visualizar Arquivo"
                                  >
                                    {loadingFileKey === `${req.id}-${ans.name}` ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Eye size={14} />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={loadingFileKey !== null}
                                    onClick={() => handleDownloadOnboardingFile(req.id, ans.name, ans.value)}
                                    className="bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200/50 p-2 rounded-lg font-bold flex items-center justify-center cursor-pointer transition-all shadow-sm hover:scale-[1.03] disabled:opacity-50"
                                    title="Baixar Arquivo"
                                  >
                                    {loadingFileKey === `${req.id}-${ans.name}` ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Download size={14} />
                                    )}
                                  </button>
                                </>
                              )}

                              {ans.status !== "approved" && (
                                <button
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => handleOnboardingClearAnswer(req.id, ans.name)}
                                  className="bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer ml-auto"
                                  title="Remover Resposta / Re-enviar"
                                >
                                  {isSubmitting ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={13} />
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
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
                className="text-stone-400 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all duration-200 cursor-pointer"
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
                className="text-stone-400 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all duration-200 cursor-pointer"
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
    </SectionComponent>
  );
}
