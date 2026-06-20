"use client";

import { useEffect, useState } from "react";
import { ReviewList } from "@/components/List";
import { CheckCircle, File, RefreshCcw, Plus, Loader2, Send } from "lucide-react";
import AdmissionModal from "@/components/AdmissionModal";

interface Stats {
  underReview: number;
  active: number;
  invited: number;
}

interface Candidate {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string | null;
  updatedAt: string;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdmissaoPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    underReview: 0,
    active: 0,
    invited: 0,
  });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [recentApprovals, setRecentApprovals] = useState<Candidate[]>([]);
  const [invitedCandidates, setInvitedCandidates] = useState<Candidate[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      const result = await response.json();
      if (result.success && result.data) {
        setStats(result.data.cards);
        setCandidates(result.data.reviewList || []);
        setRecentApprovals(result.data.recentApprovals || []);
        setInvitedCandidates(result.data.invitedList || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard de admissão:", error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const result = await response.json();
      if (result.success && result.data) {
        setCurrentUser(result.data);
      }
    } catch (error) {
      console.error("Erro ao obter dados do usuário do RH:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDashboardData(), fetchCurrentUser()]);
      setLoading(false);
    };
    init();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();

      if (date.toDateString() === today.toDateString()) {
        return "Hoje";
      }

      
      const day = date.getDate();
      const monthNames = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];
      const month = monthNames[date.getMonth()];

      return `${day} ${month}`;
    } catch (e) {
      return "Recente";
    }
  };

  if (loading) {
    return (
      <section className="p-5 flex flex-col items-center gap-5 w-full max-w-[1400px] mx-auto min-h-[80vh] justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-stone-500 font-semibold text-sm animate-pulse">
            Carregando painel de admissões...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="p-5 flex flex-col items-center gap-5 w-full max-w-[1400px] mx-auto animate-fade-in">
      {/* Cabeçalho */}
      <div className="w-full flex flex-col md:flex-row justify-between md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-stone-700/70">Admissão</h1>
          <p className="text-stone-600/70 mt-1">
            Visão geral e controle de todos os processos de admissão em
            andamento.
          </p>
        </div>

        {/* Botão de Nova Admissão */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md transition-all active:scale-95 cursor-pointer w-full md:w-auto"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          Nova Admissão
        </button>
      </div>

      {/* Cards Superiores */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-14">
        {/* Card 1: Enviados (Azul) */}
        <div className="flex bg-white h-[140px] w-full rounded-2xl shadow-xl border-r-[10px] border-[#3B82F6] transition-transform hover:-translate-y-1 duration-300">
          <div className="w-[30%] flex justify-center items-center">
            <File
              className="p-4 rounded-xl text-stone-700/60 bg-stone-100/50 h-16 w-16 border border-stone-500/50"
              strokeWidth={1.5}
            />
          </div>
          <div className="w-[70%] flex flex-row items-center justify-start pr-6 py-4 gap-4">
            <span className="text-6xl font-bold text-stone-800 leading-none">
              {stats.invited}
            </span>
            <div className="flex flex-col justify-center">
              <h1 className="text-sm font-bold text-stone-700 leading-tight">
                Formulários Enviados
              </h1>
              <p className="text-xs text-stone-500 mt-1 leading-snug">
                Aguardando preenchimento
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Em Análise (Laranja/Amarelo) */}
        <div className="flex bg-white h-[140px] w-full rounded-2xl shadow-xl border-r-[10px] border-[#F59E0B] transition-transform hover:-translate-y-1 duration-300">
          <div className="w-[30%] flex justify-center items-center">
            <RefreshCcw
              className="p-4 rounded-xl text-stone-700/60 bg-stone-100/50 h-16 w-16 border border-stone-500/50"
              strokeWidth={1.5}
            />
          </div>
          <div className="w-[70%] flex flex-row items-center justify-start pr-6 py-4 gap-4">
            <span className="text-6xl font-bold text-stone-800 leading-none">
              {stats.underReview}
            </span>
            <div className="flex flex-col justify-center">
              <h1 className="text-sm font-bold text-stone-700 leading-tight">
                Em Análise
              </h1>
              <p className="text-xs text-stone-500 mt-1 leading-snug">
                Aguardando aprovação do RH
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Concluídos (Verde) */}
        <div className="flex bg-white h-[140px] w-full rounded-2xl shadow-xl border-r-[10px] border-[#10B981] transition-transform hover:-translate-y-1 duration-300">
          <div className="w-[30%] flex justify-center items-center">
            <CheckCircle
              className="p-4 rounded-xl text-stone-700/60 bg-stone-100/50 h-16 w-16 border border-stone-500/50"
              strokeWidth={1.5}
            />
          </div>
          <div className="w-[70%] flex flex-row items-center justify-start pr-6 py-4 gap-4">
            <span className="text-6xl font-bold text-stone-800 leading-none">
              {stats.active}
            </span>
            <div className="flex flex-col justify-center">
              <h1 className="text-sm font-bold text-stone-700 leading-tight">
                Concluídos
              </h1>
              <p className="text-xs text-stone-500 mt-1 leading-snug">
                Admissões finalizadas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Inferior: Lista e Mini Cards */}
      <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-14 mt-4">
        {/* Lista de candidatos em análise da API */}
        <ReviewList candidates={candidates} />

        {/* LADO DIREITO: Mini Cards */}
        <div className="w-full lg:w-[420px] flex flex-col gap-6">
          {/* Card 1: Formulários Enviados */}
          <div className="w-full bg-white rounded-2xl shadow-xl p-6 border border-stone-100 flex flex-col">
            <div className="border-b border-stone-100 pb-4 mb-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-stone-700">
                Formulários Enviados
              </h2>
              <span className="text-xs bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-lg border border-blue-100">
                Aguardando
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-200">
              {invitedCandidates.length === 0 ? (
                <p className="text-xs text-stone-400 py-6 text-center italic">
                  Nenhum formulário pendente de envio.
                </p>
              ) : (
                invitedCandidates.map((invited) => (
                  <InvitedRow
                    key={invited.id}
                    invited={invited}
                    formatDate={formatDate}
                    onResendSuccess={fetchDashboardData}
                  />
                ))
              )}
            </div>
          </div>

          {/* Card 2: Últimas Admissões conectada à API */}
          <div className="w-full bg-white rounded-2xl shadow-xl p-6 border border-stone-100 flex flex-col">
            <div className="border-b border-stone-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-stone-700">
                Últimas Aprovações
              </h2>
            </div>

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-200">
              {recentApprovals.length === 0 ? (
                <p className="text-xs text-stone-400 py-6 text-center italic">
                  Nenhuma admissão finalizada recentemente.
                </p>
              ) : (
                recentApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className="flex items-center gap-4 py-3 border-b border-stone-50 last:border-0 hover:bg-stone-50/50 rounded-xl px-2 transition-colors"
                  >
                    <img
                      src={
                        approval.candidateAvatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(approval.candidateName)}&background=F5F5F4&color=44403C`
                      }
                      alt={`Avatar de ${approval.candidateName}`}
                      className="h-10 w-10 rounded-full object-cover border border-stone-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-stone-700 truncate">
                        {approval.candidateName}
                      </h3>
                      <p className="text-xs text-stone-500 truncate">
                        {approval.candidateEmail}
                      </p>
                    </div>
                    <div className="text-xs font-bold text-[#10B981] bg-green-50 px-2.5 py-1 rounded-lg shrink-0">
                      {formatDate(approval.updatedAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Nova Admissão */}
      <AdmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDashboardData}
        hrUserId={currentUser?.id || ""}
      />
    </section>
  );
}

function InvitedRow({
  invited,
  formatDate,
  onResendSuccess,
}: {
  invited: any;
  formatDate: (d: string) => string;
  onResendSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const handleResend = async () => {
    setLoading(true);
    setStatusText(null);
    try {
      const res = await fetch(`/api/admission/${invited.id}/resend`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusText("Enviado!");
        setTimeout(() => {
          setStatusText(null);
          onResendSuccess();
        }, 3000);
      } else {
        setStatusText(data.message || "Erro ao enviar");
        setTimeout(() => setStatusText(null), 3000);
      }
    } catch (err) {
      console.error(err);
      setStatusText("Erro de rede");
      setTimeout(() => setStatusText(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-stone-50 last:border-0 hover:bg-stone-50/50 rounded-xl px-2 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={
            invited.candidateAvatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(invited.candidateName)}&background=F5F5F4&color=44403C`
          }
          alt={`Avatar de ${invited.candidateName}`}
          className="h-10 w-10 rounded-full object-cover border border-stone-200 shrink-0"
        />
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-stone-700 truncate">
            {invited.candidateName}
          </h3>
          <p className="text-xs text-stone-500 truncate">{invited.candidateEmail}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-[10px] text-stone-400 font-medium">
          Enviado: {formatDate(invited.updatedAt)}
        </span>
        <button
          onClick={handleResend}
          disabled={loading || statusText !== null}
          className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-80 ${
            statusText === "Enviado!"
              ? "bg-green-50 text-green-700 border-green-200"
              : statusText?.startsWith("Erro")
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-stone-50 hover:bg-blue-50 hover:text-[#3B82F6] hover:border-blue-200 text-stone-600 border-stone-200 active:scale-95"
          }`}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin text-[#3B82F6]" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          {statusText || "Reenviar"}
        </button>
      </div>
    </div>
  );
}
