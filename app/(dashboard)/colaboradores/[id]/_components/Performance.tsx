"use client";

import React from "react";
import { TrendingUp, Calendar, Clock, Award, Star, Info, ChevronRight } from "lucide-react";

interface PerformanceProps {
  expectedDays: number;
  expectedHours: number;
  workedDays: number;
  workedHours: number;
  score: number;
  status: string;
  dailyStats: Array<{ day: number; expected: number; worked: number }>;
}

export default function PerformanceTab({
  expectedDays,
  expectedHours,
  workedDays,
  workedHours,
  score,
  status,
  dailyStats,
}: PerformanceProps) {
  // Configuração visual de acordo com o status
  const config = {
    Ótimo: {
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      accent: "bg-emerald-500",
      glow: "shadow-emerald-100",
      barColor: "bg-emerald-500",
      desc: "Excelente rendimento! O colaborador cumpriu todos os dias esperados e manteve alta produtividade.",
    },
    Bom: {
      color: "text-blue-600 bg-blue-50 border-blue-100",
      accent: "bg-blue-500",
      glow: "shadow-blue-100",
      barColor: "bg-blue-500",
      desc: "Ótimo rendimento. O colaborador cumpriu a maior parte da sua carga horária estabelecida.",
    },
    Regular: {
      color: "text-amber-600 bg-amber-50 border-amber-100",
      accent: "bg-amber-500",
      glow: "shadow-amber-100",
      barColor: "bg-amber-500",
      desc: "Rendimento dentro da média. Pode haver dias não trabalhados ou carga horária incompleta.",
    },
    Ruim: {
      color: "text-rose-600 bg-rose-50 border-rose-100",
      accent: "bg-rose-500",
      glow: "shadow-rose-100",
      barColor: "bg-rose-500",
      desc: "Desempenho abaixo do esperado. Recomenda-se avaliar as ausências ou atrasos do colaborador.",
    },
  }[status as "Ótimo" | "Bom" | "Regular" | "Ruim"] || {
    color: "text-stone-600 bg-stone-50 border-stone-100",
    accent: "bg-stone-500",
    glow: "shadow-stone-100",
    barColor: "bg-stone-500",
    desc: "Aguardando mais registros de ponto para gerar dados precisos.",
  };

  // Calcular horas extras ou saldo devedor
  const diffHours = Number((workedHours - expectedHours).toFixed(2));
  const hasOvertime = diffHours > 0;

  // Render da porcentagem para SVG circular
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="w-full space-y-6">
      {/* Header com Nota Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Score Circular */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100/30 shadow-sm flex flex-col items-center text-center justify-center relative overflow-hidden md:col-span-1">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Award size={100} />
          </div>
          
          <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest mb-4">Nota de Desempenho</span>
          
          {/* Gráfico Circular */}
          <div className="relative flex items-center justify-center w-36 h-36">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-stone-100"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                className={`transition-all duration-1000 ease-out ${config.color.split(" ")[0].replace("text", "stroke")}`}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-stone-800 tracking-tighter">{score}</span>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">de 100</span>
            </div>
          </div>

          <div className={`mt-5 px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest ${config.color}`}>
            {status}
          </div>
        </div>

        {/* Card Detalhado do Status */}
        <div className="bg-white p-6 rounded-3xl border border-stone-100/30 shadow-sm flex flex-col justify-between md:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${config.accent}`}></div>
              <h3 className="text-md font-bold text-stone-700 uppercase tracking-wide">Análise de Rendimento</h3>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed">{config.desc}</p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-stone-50/50 rounded-2xl border border-stone-100/20">
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Presença</span>
                <span className="text-md font-bold text-stone-700 mt-1">
                  {expectedDays > 0 ? Math.round((workedDays / expectedDays) * 100) : 100}%
                </span>
              </div>
              <div className="p-3 bg-stone-50/50 rounded-2xl border border-stone-100/20">
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Carga Horária</span>
                <span className="text-md font-bold text-stone-700 mt-1">
                  {expectedHours > 0 ? Math.round((workedHours / expectedHours) * 100) : 100}%
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-100/50 pt-4 mt-4 flex items-center justify-between text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <Info size={14} className="text-blue-500" />
              Extras contam como bônus de desempenho
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Métricas Secundárias */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Dias de Trabalho */}
        <div className="bg-white p-5 rounded-3xl border border-stone-100/30 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Dias Trabalhados</span>
            <Calendar size={18} className="text-stone-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-stone-850">{workedDays}</span>
            <span className="text-xs text-stone-400 font-bold">/ {expectedDays} esperados</span>
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${config.barColor} transition-all duration-500`}
              style={{ width: `${Math.min(100, expectedDays > 0 ? (workedDays / expectedDays) * 100 : 0)}%` }}
            ></div>
          </div>
        </div>

        {/* Horas de Trabalho */}
        <div className="bg-white p-5 rounded-3xl border border-stone-100/30 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Horas Cumpridas</span>
            <Clock size={18} className="text-stone-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-stone-850">{Math.round(workedHours)}h</span>
            <span className="text-xs text-stone-400 font-bold">/ {Math.round(expectedHours)}h esperadas</span>
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${hasOvertime ? "bg-emerald-500" : config.barColor} transition-all duration-500`}
              style={{ width: `${Math.min(100, expectedHours > 0 ? (workedHours / expectedHours) * 100 : 0)}%` }}
            ></div>
          </div>
        </div>

        {/* Saldo de Horas */}
        <div className="bg-white p-5 rounded-3xl border border-stone-100/30 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Saldo de Horas</span>
            <Star size={18} className="text-stone-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black ${hasOvertime ? "text-emerald-600" : diffHours < 0 ? "text-rose-600" : "text-stone-700"}`}>
              {hasOvertime ? `+${diffHours}` : diffHours}h
            </span>
            <span className="text-xs text-stone-400 font-bold">este mês</span>
          </div>
          <div className="text-[10px] text-stone-500 font-semibold flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${hasOvertime ? "bg-emerald-500" : diffHours < 0 ? "bg-rose-500" : "bg-stone-400"}`}></div>
            {hasOvertime
              ? "Saldo positivo (Bônus ativo)"
              : diffHours < 0
              ? "Saldo negativo"
              : "Saldo zerado (Sem pendências)"}
          </div>
        </div>
      </div>

      {/* Gráfico Comparativo Diário */}
      <div className="bg-white p-6 rounded-3xl border border-stone-100/30 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100/50 pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">Rendimento Diário (Mês Corrente)</h3>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold">
            <div className="flex items-center gap-1 text-stone-400">
              <div className="w-2.5 h-2.5 bg-stone-200 rounded-sm"></div>
              <span>Esperado</span>
            </div>
            <div className="flex items-center gap-1 text-blue-500">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div>
              <span>Trabalhado</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-500">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></div>
              <span>Hora Extra (Bônus)</span>
            </div>
          </div>
        </div>

        {dailyStats.length > 0 ? (
          <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
            <div className="min-w-[600px] h-64 relative flex items-end justify-between px-4 pt-6">
              {/* Linhas de grade horizontais */}
              <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-stone-100 w-full relative">
                  <span className="absolute -top-2.5 right-0 text-[8px] font-bold text-stone-400 bg-white px-1">12h</span>
                </div>
                <div className="border-t border-stone-100 w-full relative">
                  <span className="absolute -top-2.5 right-0 text-[8px] font-bold text-stone-400 bg-white px-1">8h</span>
                </div>
                <div className="border-t border-stone-100 w-full relative">
                  <span className="absolute -top-2.5 right-0 text-[8px] font-bold text-stone-400 bg-white px-1">4h</span>
                </div>
              </div>

              {/* Colunas do Gráfico */}
              {dailyStats.map((stat) => {
                const maxVal = 12; // Valor máximo para escala de altura
                const expectedHeightPct = Math.min(100, (stat.expected / maxVal) * 100);
                const workedHeightPct = Math.min(100, (stat.worked / maxVal) * 100);
                const isOvertime = stat.worked > stat.expected;
                const workedBarColor = isOvertime ? "bg-emerald-500" : "bg-blue-500";

                return (
                  <div key={stat.day} className="flex flex-col items-center flex-1 group relative z-10">
                    {/* Tooltip de detalhes */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-stone-900 text-stone-100 text-[9px] p-2 rounded-xl shadow-lg w-32 border border-stone-850 text-left leading-relaxed">
                      <p className="font-bold border-b border-stone-800 pb-1 mb-1">Dia {stat.day}</p>
                      <p className="text-stone-400">Esperado: <strong className="text-stone-200">{stat.expected}h</strong></p>
                      <p className="text-stone-400">Trabalhado: <strong className="text-stone-200">{stat.worked}h</strong></p>
                      {isOvertime && (
                        <p className="text-emerald-400 font-bold">Extra: +{(stat.worked - stat.expected).toFixed(1)}h</p>
                      )}
                    </div>

                    {/* Barras Lado a Lado */}
                    <div className="w-full flex items-end justify-center gap-1.5 h-44">
                      {/* Barra Esperada */}
                      <div
                        className="w-2.5 bg-stone-100 hover:bg-stone-200 rounded-t-sm transition-all duration-500"
                        style={{ height: `${expectedHeightPct}%` }}
                        title={`Esperado: ${stat.expected}h`}
                      ></div>
                      {/* Barra Trabalhada */}
                      <div
                        className={`w-2.5 ${workedBarColor} hover:opacity-85 rounded-t-sm transition-all duration-500`}
                        style={{ height: `${workedHeightPct}%` }}
                        title={`Trabalhado: ${stat.worked}h`}
                      ></div>
                    </div>

                    {/* Label do Dia */}
                    <span className="text-[9px] font-bold text-stone-500 mt-2 block select-none">Dia {stat.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-2 text-stone-400">
            <Clock size={24} className="text-stone-300" />
            <p className="text-xs font-semibold">Sem registros de ponto ou expediente no mês corrente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
