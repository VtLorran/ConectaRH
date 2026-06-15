"use client";

import SectionComponent from "@/components/SectionComponent";
import TittleHeader from "@/components/TittleHeader";
import {
  Loader2,
  Pencil,
  Eye,
  FileText,
  Upload,
  X,
  Tags,
  Briefcase,
  Cake,
  Calendar,
  Clock3,
  TrendingUp,
  Palmtree,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { formatCPF, formatPhone, formatDate } from "@/lib/masks";
import Modal from "@/components/Modal";
import Breadcrumb from "@/components/Breadcrumb";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";
import CardComponentCollaborator from "@/components/CardComponentColaborattor";
import Overview from "./_components/Overview";
import Documentos from "./_components/Documentos";
import Ferias from "./_components/Ferias";
import CalendarTab from "./_components/Calendar";
import ClockIn from "./_components/ClockIn";
import PerformanceTab from "./_components/Performance";

interface CollaboratorData {
  name: string;
  cpf: string;
  email: string;
  avatar: string | null;
  role: string;
  status: string;
  jobPositionId?: string | null;
  jobPosition?: {
    id: string;
    name: string;
    department: {
      id: string;
      name: string;
    };
  } | null;
  formData: Record<string, any> | null;
  createdAt?: string | null;
}

type TabKey =
  | "visao-geral"
  | "admissao"
  | "ferias"
  | "ponto"
  | "calendario"
  | "desempenho";

const getCollaboratorPt2Fields = (formData: Record<string, any> | null) => {
  if (!formData) return [];

  const fields: { label: string; value: string }[] = [];

  Object.entries(formData).forEach(([key, value]) => {
    if (typeof value !== "string") return;

    const namePart = key.split(":")[0].toLowerCase();

    if (
      namePart.includes("nascimento") ||
      namePart.includes("nasc") ||
      namePart.includes("data de nascimento")
    ) {
      fields.push({
        label: "DATA DE NASCIMENTO",
        value: formatDate(value),
      });
    } else if (
      namePart.includes("endereco") ||
      namePart.includes("endereço") ||
      namePart.includes("rua") ||
      namePart.includes("address")
    ) {
      fields.push({
        label: "ENDEREÇO",
        value: value,
      });
    } else if (
      namePart.includes("telefone") ||
      namePart.includes("celular") ||
      namePart.includes("phone") ||
      namePart.includes("contato")
    ) {
      fields.push({
        label: "TELEFONE",
        value: formatPhone(value),
      });
    }
  });

  return fields;
};

const getBirthdateValue = (
  FormData: Record<string, any> | null,
): string | null => {
  if (!FormData) return null;

  const birthdateEntry = Object.entries(FormData).find(([key, value]) => {
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

export default function ColaboradorDataPage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(false);

  const [collaborator, setCollaborators] = useState<CollaboratorData | null>(
    null,
  );

  const [isModal, setIsModal] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [avatar, setAvatar] = useState<string | File | null>("");
  const [role, setRole] = useState("");
  const [jobPositions, setJobPositions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedJobPositionId, setSelectedJobPositionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>(
    {},
  );

  const [vacations, setVacations] = useState<any[]>([]);
  const [monthlyWorkHours, setMonthlyWorkHours] = useState("");
  const [performanceData, setPerformanceData] = useState<{
    expectedDays: number;
    expectedHours: number;
    workedDays: number;
    workedHours: number;
    score: number;
    status: string;
    dailyStats: Array<{ day: number; expected: number; worked: number }>;
  } | null>(null);

  const [schedules, setSchedules] = useState<any[]>([]);
  const [timeRecords, setTimeRecords] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<TabKey>("visao-geral");

  const dateAdmission = (() => {
    if (!collaborator) return "";

    // Procura no formData por algum campo que lembre data de admissão
    if (collaborator.formData) {
      const admissionEntry = Object.entries(collaborator.formData).find(
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
        return admissionEntry[1];
      }
    }

    // Se não encontrou no formData, usa o createdAt do usuário
    if (collaborator.createdAt) {
      return collaborator.createdAt;
    }

    return "";
  })();

  const admissionInfo = (() => {
    if (!dateAdmission) return null;

    let parsedDate: Date;
    let formattedDate = "";

    if (dateAdmission.includes("/")) {
      const [day, month, year] = dateAdmission.split("/");
      parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
      formattedDate = dateAdmission;
    } else {
      parsedDate = new Date(dateAdmission);
      if (isNaN(parsedDate.getTime())) {
        return null;
      }
      const isUTC = dateAdmission.endsWith("Z") || dateAdmission.includes("T");
      const day = String(
        isUTC ? parsedDate.getUTCDate() : parsedDate.getDate(),
      ).padStart(2, "0");
      const month = String(
        (isUTC ? parsedDate.getUTCMonth() : parsedDate.getMonth()) + 1,
      ).padStart(2, "0");
      const year = isUTC
        ? parsedDate.getUTCFullYear()
        : parsedDate.getFullYear();
      formattedDate = `${day}/${month}/${year}`;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tempDate = new Date(parsedDate);
    tempDate.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - tempDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const companyDays = diffDays >= 0 ? diffDays : 0;

    return {
      formattedDate,
      companyDays,
    };
  })();

  const scrollRef = useRef<HTMLDivElement>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);

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
  }, [collaborator]);

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

  // Estados para Pré-visualização de Arquivos
  const [activePdfBase64, setActivePdfBase64] = useState<string | null>(null);
  const [activePdfName, setActivePdfName] = useState<string>("");
  const [activeImageBase64, setActiveImageBase64] = useState<string | null>(
    null,
  );
  const [activeImageName, setActiveImageName] = useState<string>("");

  const isBase64Pdf = (value: any): boolean => {
    return (
      typeof value === "string" &&
      value.startsWith("data:application/pdf;base64,")
    );
  };

  const isBase64Image = (value: any): boolean => {
    return typeof value === "string" && value.startsWith("data:image/");
  };

  const formatFieldName = (name: string) => {
    return name
      .split(":")[0]
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const dataNascimento = (() => {
    const value = getBirthdateValue(collaborator?.formData || null);

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

  const fetchCollaboratorData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/colaboradores/${id}`);
      if (!res.ok) throw new Error("Erro ao buscar colaborador");
      const data = await res.json();
      setCollaborators(data);

      setNome(data.name || "");
      setEmail(data.email || "");
      setCpf(data.cpf || "");
      setAvatar(data.avatar || "");
      setRole(data.role || "");
      setSelectedJobPositionId(data.jobPositionId || "");
      setSelectedDepartmentId(data.jobPosition?.department?.id || "");
      setStatus(data.status || "ACTIVE");

      setDynamicFormData(data.formData || {});
    } catch (error) {
      console.error("Erro ao buscar dados do colaborador", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchJobPositions = async () => {
    try {
      const res = await fetch("/api/job-positions");
      if (!res.ok) throw new Error("Erro ao buscar cargos");
      const result = await res.json();
      if (result.success && result.data) {
        setJobPositions(result.data);
        const uniqueDepts: any[] = [];
        const deptIds = new Set();
        result.data.forEach((pos: any) => {
          if (pos.department && !deptIds.has(pos.department.id)) {
            deptIds.add(pos.department.id);
            uniqueDepts.push(pos.department);
          }
        });
        setDepartments(uniqueDepts);
      }
    } catch (error) {
      console.error("Erro ao buscar cargos", error);
    }
  };

  const fetchVacationData = async () => {
    try {
      const res = await fetch(`/api/ferias?userId=${id}`);
      if (!res.ok) throw new Error("Erro ao buscar férias");
      const result = await res.json();
      if (result.success) {
        setVacations(result.data);
      }
    } catch (error) {
      console.error("Erro ao carregar férias do colaborador:", error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const [resSchedules, resVacations, resPonto] = await Promise.all([
        fetch(`/api/escala?userId=${id}`),
        fetch(`/api/ferias?userId=${id}`),
        fetch(`/api/ponto?userId=${id}`),
      ]);

      if (!resSchedules.ok || !resVacations.ok || !resPonto.ok) {
        throw new Error("Erro ao buscar dados para cálculo de desempenho");
      }

      const [schedulesResult, vacationsResult, pontoResult] = await Promise.all([
        resSchedules.json(),
        resVacations.json(),
        resPonto.json(),
      ]);

      if (schedulesResult.success && vacationsResult.success && pontoResult.success) {
        const schedules = schedulesResult.data;
        const vacations = vacationsResult.data.filter((v: any) => v.status === "APPROVED");
        const timeRecords = pontoResult.data;

        setSchedules(schedules);
        setTimeRecords(timeRecords);

        // 1. Obter dias e configurações da semana fixa
        const fixedSchedule = schedules.find((s: any) => s.type === "FIXED");
        const fixedDays = fixedSchedule?.scheduleData?.dias || {};

        // 2. Dias e horas esperados no mês corrente
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-indexed
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let expectedDays = 0;
        let expectedHours = 0;
        const dailyStats: Array<{ day: number; expected: number; worked: number }> = [];

        for (let d = 1; d <= daysInMonth; d++) {
          const dayDate = new Date(year, month, d);
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

          // A. Verificar se está de férias aprovadas
          const onVacation = vacations.some((v: any) => {
            const start = new Date(v.startDate);
            const end = new Date(v.endDate);
            const utcStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
            const utcEnd = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59);
            return dayDate >= utcStart && dayDate <= utcEnd;
          });

          let expectedHrs = 0;
          let isWorkingDay = false;

          if (!onVacation) {
            // B. Verificar escala específica
            const specificSchedules = schedules.filter((s: any) => s.type === "SPECIFIC");
            let specificConfig = null;
            for (const spec of specificSchedules) {
              if (spec.startDate && spec.endDate) {
                const start = new Date(spec.startDate);
                const end = new Date(spec.endDate);
                const utcStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
                const utcEnd = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59);
                if (dayDate >= utcStart && dayDate <= utcEnd) {
                  const specDayConfig = spec.scheduleData?.dias?.[dateStr];
                  if (specDayConfig) {
                    specificConfig = specDayConfig;
                  }
                }
              }
            }

            if (specificConfig) {
              expectedHrs = specificConfig.horas || 0;
              isWorkingDay = specificConfig.trabalha || false;
            } else {
              // C. Verificar semana fixa
              const dayOfWeek = dayDate.getDay().toString();
              const fixedConfig = fixedDays[dayOfWeek] || { trabalha: false, horas: 0 };
              expectedHrs = fixedConfig.horas || 0;
              isWorkingDay = fixedConfig.trabalha || false;
            }
          }

          if (isWorkingDay) {
            expectedDays += 1;
            expectedHours += expectedHrs;
          }

          // D. Verificar se trabalhou
          const record = timeRecords.find((r: any) => {
            const rDate = new Date(r.date);
            const ry = rDate.getUTCFullYear();
            const rm = rDate.getUTCMonth();
            const rd = rDate.getUTCDate();
            return ry === year && rm === month && rd === d;
          });

          let workedHrs = 0;
          if (record && record.entryTime && record.exitTime) {
            const entry = new Date(record.entryTime);
            const exit = new Date(record.exitTime);
            let workedMinutes = Math.floor((exit.getTime() - entry.getTime()) / 1000 / 60);

            if (record.pauses && Array.isArray(record.pauses)) {
              for (const pause of record.pauses) {
                if (pause.startTime && pause.endTime) {
                  const pStart = new Date(pause.startTime);
                  const pEnd = new Date(pause.endTime);
                  const diffMs = pEnd.getTime() - pStart.getTime();
                  workedMinutes -= Math.max(0, Math.floor(diffMs / 1000 / 60));
                }
              }
            }
            workedHrs = Math.max(0, workedMinutes / 60);
          }

          if (isWorkingDay || workedHrs > 0) {
            dailyStats.push({
              day: d,
              expected: expectedHrs,
              worked: Number(workedHrs.toFixed(2)),
            });
          }
        }

        // 3. Dias e horas trabalhados no mês
        const currentMonthRecords = timeRecords.filter((record: any) => {
          const recordDate = new Date(record.date);
          return (
            recordDate.getUTCFullYear() === year &&
            recordDate.getUTCMonth() === month &&
            record.entryTime &&
            record.exitTime
          );
        });

        const workedDays = currentMonthRecords.length;
        const totalWorkedMinutes = currentMonthRecords.reduce((acc: number, record: any) => {
          if (!record.entryTime || !record.exitTime) return acc;
          const entry = new Date(record.entryTime);
          const exit = new Date(record.exitTime);
          let recordMinutes = Math.floor((exit.getTime() - entry.getTime()) / 1000 / 60);

          if (record.pauses && Array.isArray(record.pauses)) {
            for (const pause of record.pauses) {
              if (pause.startTime && pause.endTime) {
                const pStart = new Date(pause.startTime);
                const pEnd = new Date(pause.endTime);
                recordMinutes -= Math.max(0, Math.floor((pEnd.getTime() - pStart.getTime()) / 1000 / 60));
              }
            }
          }
          return acc + Math.max(0, recordMinutes);
        }, 0);

        const workedHours = Number((totalWorkedMinutes / 60).toFixed(2));

        if (totalWorkedMinutes > 0) {
          const hrs = Math.floor(totalWorkedMinutes / 60);
          const mins = totalWorkedMinutes % 60;
          if (mins === 0) {
            setMonthlyWorkHours(`${hrs}h`);
          } else {
            setMonthlyWorkHours(`${hrs}h ${mins}m`);
          }
        } else {
          setMonthlyWorkHours("");
        }

        // 4. Calcular Nota de Desempenho
        // Fórmulas:
        // Nota de presença = (dias_trabalhados / dias_esperados) * 100
        // Nota de horas = (horas_trabalhadas / horas_esperadas) * 100 (horas extras contam como bônus)
        const attendanceScore = expectedDays > 0 ? (workedDays / expectedDays) * 100 : 100;
        const hoursScore = expectedHours > 0 ? (workedHours / expectedHours) * 100 : 100;

        let finalScore = Math.round((attendanceScore + hoursScore) / 2);
        finalScore = Math.min(100, Math.max(0, finalScore));

        let status = "Ruim";
        if (finalScore >= 76) status = "Ótimo";
        else if (finalScore >= 51) status = "Bom";
        else if (finalScore >= 26) status = "Regular";

        setPerformanceData({
          expectedDays,
          expectedHours,
          workedDays,
          workedHours,
          score: finalScore,
          status,
          dailyStats,
        });
      }
    } catch (error) {
      console.error("Erro ao calcular desempenho:", error);
    }
  };

  const handleVacationUpdate = async () => {
    await Promise.all([fetchVacationData(), fetchCollaboratorData(true)]);
  };

  const trilhaNavegação = [
    { label: "Colaboradores", href: "/colaboradores" },
    { label: collaborator?.name || "", href: `/colaboradores/${id}` },
  ];

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      let avatarBase64 = null;

      if (avatar instanceof File) {
        avatarBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(avatar);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });
      } else {
        avatarBase64 = avatar || null;
      }

      const res = await fetch(`/api/colaboradores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nome,
          email,
          cpf,
          avatar: avatarBase64,
          jobPositionId: selectedJobPositionId || null,
          formData: dynamicFormData,
          status,
        }),
      });

      if (!res.ok) {
        throw new Error("Falha ao atualizar dados");
      }

      const data = await res.json();
      setCollaborators(data);
      setSelectedJobPositionId(data.jobPositionId || "");
      setSelectedDepartmentId(data.jobPosition?.department?.id || "");
      setIsModal(false);
    } catch (error: any) {
      console.error("Erro ao atualizar dados do usuário", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
    }
  };

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
          text: "Em férias",
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

  const menuItems: { label: string; key: TabKey }[] = [
    { label: "Visão Geral", key: "visao-geral" },
    { label: "Documentos", key: "admissao" },
    { label: "Férias", key: "ferias" },
    { label: "Ponto", key: "ponto" },
    { label: "Calendário", key: "calendario" },
    { label: "Desempenho", key: "desempenho" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "visao-geral":
        return (
          <Overview
            collaborator={collaborator}
            vacations={vacations}
            schedules={schedules}
            timeRecords={timeRecords}
            performanceData={performanceData}
            onTabChange={(tab) => setActiveTab(tab as any)}
          />
        );

      case "admissao":
        return (
          <Documentos
            collaboratorId={id as string}
            formData={dynamicFormData}
            onUpdate={(updatedData) => {
              setDynamicFormData(updatedData);
              if (collaborator) {
                setCollaborators({
                  ...collaborator,
                  formData: updatedData,
                });
              }
            }}
          />
        );
      case "ferias":
        return <Ferias collaboratorId={id as string} onUpdate={handleVacationUpdate} />;
      case "ponto":
        return <ClockIn collaboratorId={id as string} onUpdate={fetchPerformanceData} />;
      case "calendario":
        return <CalendarTab collaboratorId={id as string} />;
      case "desempenho":
        return performanceData ? (
          <PerformanceTab
            expectedDays={performanceData.expectedDays}
            expectedHours={performanceData.expectedHours}
            workedDays={performanceData.workedDays}
            workedHours={performanceData.workedHours}
            score={performanceData.score}
            status={performanceData.status}
            dailyStats={performanceData.dailyStats}
          />
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-stone-500 font-semibold text-sm animate-pulse">
              Carregando dados de desempenho...
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (id) {
      fetchCollaboratorData();
      fetchJobPositions();
      fetchVacationData();
      fetchPerformanceData();
    }
  }, [id]);

  if (loading) {
    return (
      <section className="p-5 flex flex-col items-center gap-5 w-full max-w-[1400px] mx-auto min-h-[80vh] justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-stone-500 font-semibold text-sm animate-pulse">
            Carregando dados do colaborador...
          </p>
        </div>
      </section>
    );
  }

  return (
    <SectionComponent>
      <TittleHeader tittle={`Informações do colaborador:`} className="w-full" />
      <div className="w-full">
        <Breadcrumb items={trilhaNavegação} />
      </div>
      <div className="w-full p-4 sm:p-8 bg-white rounded-3xl shadow-xl border border-stone-100/50 flex flex-col md:flex-row gap-8 items-stretch md:items-start">
        {/* SEÇÃO DA IMAGEM */}
        <div className="flex items-center justify-center shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-stone-100 shadow-md overflow-hidden bg-stone-50 self-center md:self-auto">
          {collaborator?.avatar ? (
            <img
              src={collaborator.avatar}
              alt={collaborator.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 font-bold text-4xl">
              {collaborator?.name
                ? collaborator.name.charAt(0).toUpperCase()
                : "U"}
            </div>
          )}
        </div>

        {/* INFORMAÇÕES DO USUÁRIO */}
        <div className="flex flex-col gap-4 pl-0 md:pl-4 pr-0 md:pr-8 py-2 border-b md:border-b-0 md:border-r border-stone-100/80 md:border-stone-500/10 min-w-0 md:min-w-[280px] w-full md:w-auto pb-6 md:pb-2">
          <div className="flex gap-3 items-center justify-between md:justify-start">
            <h1 className="font-bold text-stone-800 tracking-wider text-2xl truncate">
              {collaborator?.name}
            </h1>
            {(() => {
              const currentStatus = getStatusConfig(collaborator?.status);

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
              {collaborator?.role === "ADMIN" ? (
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
                {collaborator?.jobPosition?.department?.name || "Não atribuído"}
              </span>
            </p>

            <p className="text-sm">
              <span className="font-bold text-stone-400 text-xs uppercase tracking-wider block mb-0.5">
                Cargo:
              </span>
              <span className="text-sm font-semibold text-stone-700 block mt-0.5">
                {collaborator?.jobPosition?.name || "Não atribuído"}
              </span>
            </p>

            <p className="text-sm">
              <span className="font-bold text-stone-400 text-xs uppercase tracking-wider block mb-0.5">
                Email:
              </span>{" "}
              <span className="font-medium text-stone-700 break-all">
                {collaborator?.email}
              </span>
            </p>

            <p className="text-sm">
              <span className="font-bold text-stone-400 text-xs uppercase tracking-wider block mb-0.5">
                CPF:
              </span>{" "}
              <span className="font-medium text-stone-700">
                {formatCPF(collaborator?.cpf || "")}
              </span>
            </p>
          </div>
        </div>

        {/* INFORMAÇÕES DO USUÁRIO PT2 */}
        <div className="flex flex-col pl-0 md:pl-8 py-2 flex-1 w-full border-b md:border-b-0 md:border-r border-stone-100/80 md:border-stone-500/10 pr-0 md:pr-8 pb-6 md:pb-2">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">
            Dados Adicionais
          </h3>
          {collaborator?.formData &&
          getCollaboratorPt2Fields(collaborator.formData).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {getCollaboratorPt2Fields(collaborator.formData).map(
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
        {/* Editar informação */}
        <div className="flex w-full md:w-auto justify-center md:justify-start self-center md:self-start mt-4 md:mt-0">
          <button
            onClick={() => setIsModal(true)}
            className="bg-stone-50/50 p-4 rounded-2xl border border-stone-100 hover:bg-stone-50 transition-all shadow-sm text-sm flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer"
          >
            <Pencil className="h-4 w-4 text-stone-800" />
            Editar dados
          </button>
        </div>
      </div>

      {isModal && (
        <Modal
          isOpen={isModal}
          onClose={() => setIsModal(false)}
          title="Edição de dados do Usuário"
          maxWidth="max-w-4xl"
        >
          <form
            onSubmit={handleUpdate}
            className="flex flex-col gap-6 max-h-[85vh]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto ">
              {/* Coluna 1: Dados do Usuário */}
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider border-b border-stone-100 pb-2">
                  Dados do Usuário
                </h3>

                <div className="flex flex-col items-center gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider self-start">
                    Foto de Perfil (Avatar)
                  </label>

                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-stone-200 bg-white shadow-sm shrink-0 flex items-center justify-center">
                    {avatar ? (
                      <img
                        src={
                          avatar instanceof File
                            ? URL.createObjectURL(avatar)
                            : avatar
                        }
                        alt="Pré-visualização do avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400 font-bold text-2xl">
                        {nome ? nome.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}
                  </div>

                  <span className="text-[11px] text-stone-500 font-medium">
                    {avatar instanceof File ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        ● Nova foto selecionada
                      </span>
                    ) : (
                      "Exibindo foto atual"
                    )}
                  </span>

                  <label className="cursor-pointer bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold py-2 px-4 rounded-xl border border-stone-300 shadow-sm transition-all text-center">
                    Alterar Imagem
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Nome Completo
                  </label>
                  <InputField
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    E-mail Institucional
                  </label>
                  <InputField
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Documento CPF
                  </label>
                  <InputField
                    type="text"
                    value={formatCPF(cpf)}
                    onChange={(e) => setCpf(e.target.value)}
                    required
                  />
                </div>

                {/* Input: Setor */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Setor
                  </label>
                  <select
                    value={selectedDepartmentId}
                    onChange={(e) => {
                      setSelectedDepartmentId(e.target.value);
                      setSelectedJobPositionId("");
                    }}
                    className="flex w-full border border-stone-400/50 rounded-xl py-3 px-3 text-sm bg-transparent outline-none focus:border-stone-600 transition-colors text-stone-800"
                    required
                  >
                    <option value="">-- Selecione o Setor --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input: Cargo */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Cargo
                  </label>
                  <select
                    value={selectedJobPositionId}
                    onChange={(e) => setSelectedJobPositionId(e.target.value)}
                    className="flex w-full border border-stone-400/50 rounded-xl py-3 px-3 text-sm bg-transparent outline-none focus:border-stone-600 transition-colors text-stone-800 disabled:opacity-50"
                    required
                    disabled={!selectedDepartmentId}
                  >
                    <option value="">-- Selecione o Cargo --</option>
                    {jobPositions
                      .filter(
                        (pos) => pos.departmentId === selectedDepartmentId,
                      )
                      .map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Perfil de Acesso Derivado (Visual) */}
                {selectedDepartmentId && (
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Nível de Acesso Derivado
                    </span>
                    <div>
                      {(() => {
                        const deptName =
                          departments.find((d) => d.id === selectedDepartmentId)
                            ?.name || "";
                        const normalized = deptName.trim().toUpperCase();
                        const isAdmin =
                          normalized === "RH" ||
                          normalized === "RECURSOS HUMANOS" ||
                          normalized === "DP" ||
                          normalized === "DEPARTAMENTO PESSOAL";

                        return isAdmin ? (
                          <span className="inline-flex items-center text-xs font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200">
                            Administrador (Acesso Completo)
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg border border-blue-100">
                            Colaborador Comum (Acesso Limitado)
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Coluna 2: Dados da Admissão */}
              <div className=" border-t md:border-t-0 md:border-l border-stone-100 pt-6 md:pt-0 md:pl-8 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider border-b border-stone-100 pb-2">
                  Dados da Admissão
                </h3>

                {Object.keys(dynamicFormData).length > 0 ? (
                  <div className="flex flex-col gap-4 overflow-y-auto max-h-[700px] pr-2">
                    {Object.entries(dynamicFormData).map(([key, value]) => {
                      const labelAmigavel = key.split(":")[0].toUpperCase();
                      const isFileField =
                        key.toLowerCase().includes(":file") ||
                        (typeof value === "string" &&
                          (value.startsWith("data:") || value.length > 500));

                      if (isFileField) {
                        return (
                          <div
                            key={key}
                            className="flex flex-col gap-1.5 bg-stone-50/50 p-3.5 rounded-2xl border border-stone-100"
                          >
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                              {labelAmigavel}
                            </label>
                            <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-stone-200 shadow-sm">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText
                                  className={`h-5 w-5 shrink-0 ${value ? "text-emerald-500" : "text-stone-300"}`}
                                />
                                <span
                                  className={`text-xs font-semibold truncate ${value ? "text-emerald-600 font-bold" : "text-stone-400 italic font-normal"}`}
                                >
                                  {value
                                    ? "✓ Arquivo Anexado"
                                    : "Nenhum arquivo"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {value ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handlePreviewFile(key, value)
                                      }
                                      title="Visualizar arquivo"
                                      className="p-1.5 rounded-lg text-stone-500 hover:text-blue-600 hover:bg-stone-100 transition-all cursor-pointer flex items-center justify-center"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <label
                                      className="cursor-pointer p-1.5 rounded-lg text-stone-500 hover:text-blue-600 hover:bg-stone-100 transition-all flex items-center justify-center"
                                      title="Substituir/Editar arquivo"
                                    >
                                      <Pencil className="h-4 w-4" />
                                      <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const base64 =
                                              await new Promise<string>(
                                                (resolve, reject) => {
                                                  const reader =
                                                    new FileReader();
                                                  reader.readAsDataURL(file);
                                                  reader.onload = () =>
                                                    resolve(
                                                      reader.result as string,
                                                    );
                                                  reader.onerror = (err) =>
                                                    reject(err);
                                                },
                                              );
                                            setDynamicFormData((prev) => ({
                                              ...prev,
                                              [key]: base64,
                                            }));
                                          }
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  </>
                                ) : (
                                  <label
                                    className="cursor-pointer p-1.5 rounded-lg text-stone-500 hover:text-blue-600 hover:bg-stone-100 transition-all flex items-center justify-center"
                                    title="Anexar arquivo"
                                  >
                                    <Upload className="h-4 w-4" />
                                    <input
                                      type="file"
                                      accept="image/*,.pdf"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const base64 =
                                            await new Promise<string>(
                                              (resolve, reject) => {
                                                const reader = new FileReader();
                                                reader.readAsDataURL(file);
                                                reader.onload = () =>
                                                  resolve(
                                                    reader.result as string,
                                                  );
                                                reader.onerror = (err) =>
                                                  reject(err);
                                              },
                                            );
                                          setDynamicFormData((prev) => ({
                                            ...prev,
                                            [key]: base64,
                                          }));
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={key} className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                            {labelAmigavel}
                          </label>
                          <InputField
                            type="text"
                            value={value || ""}
                            onChange={(e) => {
                              setDynamicFormData({
                                ...dynamicFormData,
                                [key]: e.target.value,
                              });
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-stone-400 italic text-sm mt-4">
                    Este colaborador não possui dados adicionais de admissão
                    para editar.
                  </p>
                )}
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="mt-auto mx-auto flex justify-end gap-3 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={() => setIsModal(false)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors text-sm font-semibold"
              >
                Cancelar
              </button>
              <div className="w-48">
                <SubmitButton
                  text={submitting ? "Salvando Alterações..." : "Salvar Dados"}
                  disabled={submitting}
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

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
      {/* Cards de dashboard do colaborador */}
      <div className="relative w-full overflow-hidden mt-5">
        {/* Gradient da esquerda */}
        <div
          className={`absolute left-0 top-0 bottom-5 w-12 bg-gradient-to-r from-[#EDEDED] to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
            showLeftGradient ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onScroll={handleScroll}
          className={`w-full gap-5 flex flex-nowrap overflow-x-auto pb-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {/* 1. Aniversário */}
          <div className="shrink-0 w-[280px] sm:w-[295px]">
            {dataNascimento ? (
              <CardComponentCollaborator
                tittle={`Aniversário: ${dataNascimento.formExtenso}`}
                icon={<Cake size={20} />}
                description={`Faltam ${daysUntilNextBirthday(dataNascimento.value)} dias`}
              />
            ) : (
              <CardComponentCollaborator
                tittle={`Data de Aniversário não Registrada`}
                icon={<Cake size={20} />}
              />
            )}
          </div>

          {/* 2. Férias */}
          <div className="shrink-0 w-[280px] sm:w-[295px]">
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const active = vacations.find((v) => {
                if (v.status !== "APPROVED") return false;
                const start = new Date(v.startDate);
                const end = new Date(v.endDate);
                const utcStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
                const utcEnd = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59);
                return today >= utcStart && today <= utcEnd;
              });

              if (active) {
                const startStr = new Date(active.startDate);
                const endStr = new Date(active.endDate);
                const formattedStart = new Date(startStr.getUTCFullYear(), startStr.getUTCMonth(), startStr.getUTCDate()).toLocaleDateString("pt-BR");
                const formattedEnd = new Date(endStr.getUTCFullYear(), endStr.getUTCMonth(), endStr.getUTCDate()).toLocaleDateString("pt-BR");
                return (
                  <CardComponentCollaborator
                    tittle="Férias Ativas"
                    description={`De ${formattedStart} a ${formattedEnd}`}
                    icon={<Palmtree size={20} />}
                  />
                );
              }

              const scheduled = vacations
                .filter((v) => {
                  if (v.status !== "APPROVED") return false;
                  const start = new Date(v.startDate);
                  const utcStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
                  return utcStart > today;
                })
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

              if (scheduled.length > 0) {
                const nextVacation = scheduled[0];
                const startStr = new Date(nextVacation.startDate);
                const endStr = new Date(nextVacation.endDate);
                const formattedStart = new Date(startStr.getUTCFullYear(), startStr.getUTCMonth(), startStr.getUTCDate()).toLocaleDateString("pt-BR");
                const formattedEnd = new Date(endStr.getUTCFullYear(), endStr.getUTCMonth(), endStr.getUTCDate()).toLocaleDateString("pt-BR");
                return (
                  <CardComponentCollaborator
                    tittle="Próximas Férias"
                    description={`De ${formattedStart} a ${formattedEnd}`}
                    icon={<Palmtree size={20} />}
                  />
                );
              }

              return (
                <CardComponentCollaborator
                  tittle="Sem Férias agendadas"
                  description="Nenhum período programado"
                  icon={<Palmtree size={20} />}
                />
              );
            })()}
          </div>

          {/* 3. Horas */}
          <div className="shrink-0 w-[280px] sm:w-[295px]">
            {monthlyWorkHours ? (
              <CardComponentCollaborator
                tittle="Horas no mês"
                description={`${monthlyWorkHours} registradas`}
                icon={<Clock3 size={20} />}
              />
            ) : (
              <CardComponentCollaborator
                tittle="Sem horas no mês"
                description="Aguardando primeiro registro"
                icon={<Clock3 size={20} />}
              />
            )}
          </div>

          {/* 4. Desempenho */}
          <div className="shrink-0 w-[280px] sm:w-[295px]">
            {performanceData ? (
              <CardComponentCollaborator
                tittle={`Desempenho: ${performanceData.score}%`}
                description={`Status: ${performanceData.status}`}
                icon={<TrendingUp className={
                  performanceData.status === "Ótimo" ? "text-emerald-500" :
                  performanceData.status === "Bom" ? "text-blue-500" :
                  performanceData.status === "Regular" ? "text-amber-500" :
                  "text-rose-500"
                } size={20} />}
              />
            ) : (
              <CardComponentCollaborator
                tittle="Sem dados de Desempenho"
                description={"Carregando métricas..."}
                icon={<TrendingUp size={20} />}
              />
            )}
          </div>
          <div className="shrink-0 w-[280px] sm:w-[295px]">
            {admissionInfo ? (
              <CardComponentCollaborator
                tittle={`Admissão: ${admissionInfo.formattedDate}`}
                description={`${admissionInfo.companyDays} ${admissionInfo.companyDays === 1 ? "dia" : "dias"} de empresa`}
                icon={<Calendar size={20} />}
              />
            ) : (
              <CardComponentCollaborator
                tittle="Sem data de admissão"
                description="Nenhum dado disponível"
                icon={<Calendar size={20} />}
              />
            )}
          </div>
        </div>

        {/* Gradient da direita */}
        <div
          className={`absolute right-0 top-0 bottom-5 w-12 bg-gradient-to-l from-[#EDEDED] to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
            showRightGradient ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      <div
        ref={tabContainerRef}
        className="w-full p-4 sm:p-8 bg-white rounded-3xl shadow-xl border border-stone-100/50 flex flex-col gap-6 sm:gap-8 items-stretch"
      >
        <div className="w-full border-b border-stone-100 overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-8 sm:px-8">
          <nav className="flex gap-8 sm:gap-12 min-w-max pb-0.5">
            {menuItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key);
                    setTimeout(() => {
                      tabContainerRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }, 50);
                  }}
                  className={`py-4 text-sm font-semibold tracking-wide transition-all duration-200 border-b-2 relative whitespace-nowrap outline-none cursor-pointer -mb-[2px] ${
                    isActive
                      ? "text-blue-600 border-blue-600 font-bold"
                      : "text-stone-500 border-transparent hover:text-stone-800"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="w-full transition-all duration-300">
          {renderTabContent()}
        </div>
      </div>
    </SectionComponent>
  );
}
