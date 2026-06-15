"use client";

import React from "react";
import {
  Clock,
  Calendar,
  FileText,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  MapPin,
  Mail,
  User,
  Coffee,
  Bookmark
} from "lucide-react";

interface OverviewProps {
  collaborator: any;
  vacations: any[];
  schedules: any[];
  timeRecords: any[];
  performanceData: any;
  onTabChange: (tab: string) => void;
}

export default function Overview({
  collaborator,
  vacations,
  schedules,
  timeRecords,
  performanceData,
  onTabChange,
}: OverviewProps) {
  
  // 1. Status e Escala de Hoje
  const getTodaySchedule = () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Verificar Férias
    const onVacation = vacations.some((v: any) => {
      if (v.status !== "APPROVED") return false;
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      const utcStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
      const utcEnd = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59);
      return today >= utcStart && today <= utcEnd;
    });

    if (onVacation) return { trabalha: false, label: "Férias Concedidas", horas: 0 };

    // Verificar Escala específica
    const specificSchedules = schedules.filter((s: any) => s.type === "SPECIFIC");
    for (const spec of specificSchedules) {
      if (spec.startDate && spec.endDate) {
        const start = new Date(spec.startDate);
        const end = new Date(spec.endDate);
        const utcStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
        const utcEnd = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59);
        if (today >= utcStart && today <= utcEnd) {
          const specDayConfig = spec.scheduleData?.dias?.[dateStr];
          if (specDayConfig) {
            return {
              trabalha: specDayConfig.trabalha,
              label: specDayConfig.trabalha ? `Escala Específica (${specDayConfig.horas}h)` : "Folga (Escala Específica)",
              horas: specDayConfig.horas,
            };
          }
        }
      }
    }

    // Verificar Escala fixa
    const fixedSchedule = schedules.find((s: any) => s.type === "FIXED");
    const fixedDays = fixedSchedule?.scheduleData?.dias || {};
    const dayOfWeek = today.getDay().toString();
    const fixedConfig = fixedDays[dayOfWeek] || { trabalha: false, ...fixedSchedule?.scheduleData?.dias?.[dayOfWeek] };
    return {
      trabalha: fixedConfig.trabalha,
      label: fixedConfig.trabalha ? `Escala Fixa (${fixedConfig.horas}h)` : "Folga (Escala Fixa)",
      horas: fixedConfig.horas || 0,
    };
  };

  const getTodayClockIn = () => {
    const today = new Date();
    const todayRecord = timeRecords.find((r: any) => {
      const rDate = new Date(r.date);
      return (
        rDate.getUTCFullYear() === today.getFullYear() &&
        rDate.getUTCMonth() === today.getMonth() &&
        rDate.getUTCDate() === today.getDate()
      );
    });

    if (!todayRecord) {
      return { status: "missing", text: "Aguardando primeiro registro de entrada" };
    }

    if (todayRecord.entryTime && !todayRecord.exitTime) {
      const entryDate = new Date(todayRecord.entryTime);
      const entryStr = entryDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return { status: "working", text: `Trabalhando atualmente`, entry: entryStr };
    }

    if (todayRecord.entryTime && todayRecord.exitTime) {
      const entryStr = new Date(todayRecord.entryTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const exitStr = new Date(todayRecord.exitTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return { status: "completed", text: `Expediente concluído`, range: `${entryStr} - ${exitStr}` };
    }

    return { status: "missing", text: "Aguardando primeiro registro de entrada" };
  };

  const todaySchedule = getTodaySchedule();
  const todayClock = getTodayClockIn();

  // 2. Progresso de Documentos
  const requiredFields = collaborator?.formData ? Object.keys(collaborator.formData) : [];
  const filledFields = collaborator?.formData ? Object.values(collaborator.formData).filter(v => v !== null && v !== "").length : 0;
  const docsCompleteness = requiredFields.length > 0 ? Math.round((filledFields / requiredFields.length) * 100) : 0;

  // 3. Próximas Férias
  const getNextVacation = () => {
    const today = new Date();
    const futureVacations = vacations
      .filter((v: any) => v.status === "APPROVED" && new Date(v.startDate) >= today)
      .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return futureVacations[0] || null;
  };

  const nextVacation = getNextVacation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* CARD DO DIA (PONTO & ESCALA) */}
      <div className="bg-white p-6 rounded-3xl border border-stone-100/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
        <div>
          <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
              <Clock size={16} className="text-blue-500" />
              Status de Hoje
            </h3>
            <span className="text-stone-400 text-xs font-bold">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" })}
            </span>
          </div>

          <div className="space-y-4">
            {/* Status da Escala */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-stone-50 rounded-xl border border-stone-100">
                <Bookmark size={18} className="text-stone-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Carga Programada</p>
                <p className="text-sm font-bold text-stone-700 mt-0.5">{todaySchedule.label}</p>
              </div>
            </div>

            {/* Status do Registro */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-stone-50 rounded-xl border border-stone-100">
                {todayClock.status === "working" ? (
                  <Coffee size={18} className="text-emerald-500 animate-bounce" />
                ) : (
                  <Clock size={18} className="text-stone-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Registro de Ponto</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {todayClock.status === "working" && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                  <p className="text-sm font-bold text-stone-700">{todayClock.text}</p>
                </div>
                {todayClock.entry && (
                  <p className="text-xs text-stone-400 font-bold mt-0.5">Entrada às {todayClock.entry}</p>
                )}
                {todayClock.range && (
                  <p className="text-xs text-stone-400 font-bold mt-0.5">Período: {todayClock.range}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onTabChange("ponto")}
          className="mt-6 w-full py-2.5 px-4 bg-stone-50 hover:bg-stone-100 border border-stone-100/50 text-stone-600 hover:text-stone-800 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-1.5 transition-all"
        >
          Acessar Folha de Ponto
          <ArrowRight size={14} />
        </button>
      </div>

      {/* CARD DE RENDIMENTO (DESEMPENHO) */}
      <div className="bg-white p-6 rounded-3xl border border-stone-100/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
        <div>
          <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp size={16} className="text-emerald-500" />
              Desempenho Geral
            </h3>
            <span className="text-stone-400 text-xs font-bold">Mês Vigente</span>
          </div>

          {performanceData ? (
            <div className="flex items-center gap-6 py-2">
              <div className="relative flex items-center justify-center w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    className="stroke-stone-100"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    className={`transition-all duration-1000 ease-out ${
                      performanceData.status === "Ótimo" ? "stroke-emerald-500" :
                      performanceData.status === "Bom" ? "stroke-blue-500" :
                      performanceData.status === "Regular" ? "stroke-amber-500" :
                      "stroke-rose-500"
                    }`}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 36}
                    strokeDashoffset={2 * Math.PI * 36 - (performanceData.score / 100) * (2 * Math.PI * 36)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-black text-stone-800 tracking-tighter">{performanceData.score}%</span>
                </div>
              </div>

              <div className="space-y-1 flex-1">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wide">Status de Rendimento</p>
                <p className={`text-md font-black uppercase tracking-wider ${
                  performanceData.status === "Ótimo" ? "text-emerald-600" :
                  performanceData.status === "Bom" ? "text-blue-600" :
                  performanceData.status === "Regular" ? "text-amber-600" :
                  "text-rose-600"
                }`}>
                  {performanceData.status}
                </p>
                <p className="text-xs text-stone-500 leading-relaxed font-medium">
                  {performanceData.workedDays} de {performanceData.expectedDays} dias trabalhados com {Math.round(performanceData.workedHours)}h cumpridas.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-1.5 text-stone-400">
              <TrendingUp size={24} className="text-stone-300 animate-pulse" />
              <p className="text-xs font-semibold">Calculando dados de rendimento...</p>
            </div>
          )}
        </div>

        <button
          onClick={() => onTabChange("desempenho")}
          className="mt-6 w-full py-2.5 px-4 bg-stone-50 hover:bg-stone-100 border border-stone-100/50 text-stone-600 hover:text-stone-800 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-1.5 transition-all"
        >
          Ver Análise de Produtividade
          <ArrowRight size={14} />
        </button>
      </div>

      {/* CARD DE DOCUMENTOS (ADMISSÃO) */}
      <div className="bg-white p-6 rounded-3xl border border-stone-100/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
        <div>
          <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
              <FileText size={16} className="text-amber-500" />
              Pasta de Admissão
            </h3>
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
              docsCompleteness === 100
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-amber-50 text-amber-600 border-amber-100"
            }`}>
              {docsCompleteness === 100 ? "Completa" : "Incompleta"}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-stone-800">{docsCompleteness}%</span>
              <span className="text-xs text-stone-400 font-bold">{filledFields} de {requiredFields.length} campos respondidos</span>
            </div>

            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${docsCompleteness}%` }}
              ></div>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              {docsCompleteness === 100
                ? "Todos os documentos obrigatórios e dados de cadastro da admissão foram preenchidos e enviados."
                : "Ainda existem dados cadastrais ou arquivos de documentos pendentes de envio na pasta de admissão."}
            </p>
          </div>
        </div>

        <button
          onClick={() => onTabChange("admissao")}
          className="mt-6 w-full py-2.5 px-4 bg-stone-50 hover:bg-stone-100 border border-stone-100/50 text-stone-600 hover:text-stone-800 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-1.5 transition-all"
        >
          Gerenciar Documentos
          <ArrowRight size={14} />
        </button>
      </div>

      {/* CARD DE FÉRIAS (VACATION) */}
      <div className="bg-white p-6 rounded-3xl border border-stone-100/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
        <div>
          <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={16} className="text-rose-500" />
              Programação de Férias
            </h3>
            <span className="text-stone-400 text-xs font-bold">Próximo Período</span>
          </div>

          {nextVacation ? (
            <div className="space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-stone-800">
                  {Math.ceil((new Date(nextVacation.endDate).getTime() - new Date(nextVacation.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}
                </span>
                <span className="text-xs text-stone-400 font-bold">dias agendados</span>
              </div>
              <p className="text-xs font-bold text-stone-700">
                De {new Date(nextVacation.startDate).toLocaleDateString("pt-BR")} até {new Date(nextVacation.endDate).toLocaleDateString("pt-BR")}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">Aprovado pelo RH</span>
              </div>
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center gap-2 text-stone-400">
              <Calendar size={24} className="text-stone-300" />
              <p className="text-xs font-semibold">Nenhuma programação de férias agendada para o futuro.</p>
            </div>
          )}
        </div>

        <button
          onClick={() => onTabChange("ferias")}
          className="mt-6 w-full py-2.5 px-4 bg-stone-50 hover:bg-stone-100 border border-stone-100/50 text-stone-600 hover:text-stone-800 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-1.5 transition-all"
        >
          Visualizar Escala de Férias
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}