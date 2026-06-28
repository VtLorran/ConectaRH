"use client";

import React, { useState, useEffect } from "react";
import {
  Palette,
  Globe,
  Bell,
  Accessibility,
  Lock,
  Zap,
  HelpCircle,
  Info,
  Building2,
  User,
  LogOut,
  Laptop,
  Sun,
  Moon,
  Check,
  X,
  ChevronRight,
  Shield,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Sparkles,
  RefreshCw,
  HeartHandshake
} from "lucide-react";
import SectionComponent from "@/components/SectionComponent";
import TittleHeader from "@/components/TittleHeader";
import Breadcrumb from "@/components/Breadcrumb";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";

// Definição dos tipos para o estado de sessão ativa
interface Session {
  id: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  date: string;
  isCurrent: boolean;
}

// Interface para mensagens de feedback (Toasts)
interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export default function SettingsPage() {
  // Controle da categoria selecionada
  const [activeTab, setActiveTab] = useState<string>("aparencia");

  // Toasts flutuantes
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- ESTADOS DE APARÊNCIA ---
  const [theme, setTheme] = useState<string>("auto");
  const [fontSize, setFontSize] = useState<string>("medium");
  const [sidebarPref, setSidebarPref] = useState<string>("default");

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Aparência
      setTheme(localStorage.getItem("theme-preference") || "auto");
      setFontSize(localStorage.getItem("font-size-preference") || "medium");
      setSidebarPref(localStorage.getItem("sidebar-preference") || "default");
      
      // Idioma e Região
      setLanguage(localStorage.getItem("language-preference") || "pt-BR");
      setCountry(localStorage.getItem("country-preference") || "Brasil");
      setTimezone(localStorage.getItem("timezone-preference") || "America/Sao_Paulo");
      setDateFormat(localStorage.getItem("date-format-preference") || "DD/MM/YYYY");
      setTimeFormat(localStorage.getItem("time-format-preference") || "24h");
      setNumberFormat(localStorage.getItem("number-format-preference") || "dot-comma");

      // Notificações
      setNotificationsEnabled(localStorage.getItem("notifications-preference") !== "false");

      // Acessibilidade
      setHighContrast(localStorage.getItem("high-contrast-preference") === "true");
      setKeyboardFocus(localStorage.getItem("keyboard-focus-preference") === "true");

      // Preferências
      setConfirmDelete(localStorage.getItem("confirm-delete-preference") !== "false");
      setConfirmLogout(localStorage.getItem("confirm-logout-preference") !== "false");
      setItemsPerPage(Number(localStorage.getItem("items-per-page-preference") || "10"));
    }
  }, []);

  // Carregar dados da empresa do banco de dados na inicialização
  useEffect(() => {
    async function fetchCompanyData() {
      try {
        const res = await fetch("/api/company");
        const json = await res.json();
        if (json.success && json.data) {
          setCompanyData(json.data);
        }
      } catch (err) {
        console.error("Erro ao carregar dados da empresa:", err);
      }
    }
    fetchCompanyData();
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const handleFontSizeChange = (newSize: string) => {
    setFontSize(newSize);
  };

  const handleSidebarPrefChange = (newPref: string) => {
    setSidebarPref(newPref);
  };

  const handleSaveAppearance = () => {
    localStorage.setItem("theme-preference", theme);
    localStorage.setItem("font-size-preference", fontSize);
    localStorage.setItem("sidebar-preference", sidebarPref);
    window.dispatchEvent(new Event("appearance-pref-changed"));
    window.dispatchEvent(new Event("sidebar-pref-changed"));
    showToast("Configurações de aparência salvas com sucesso!", "success");
  };

  const handleSaveLocale = () => {
    localStorage.setItem("language-preference", language);
    localStorage.setItem("country-preference", country);
    localStorage.setItem("timezone-preference", timezone);
    localStorage.setItem("date-format-preference", dateFormat);
    localStorage.setItem("time-format-preference", timeFormat);
    localStorage.setItem("number-format-preference", numberFormat);
    window.dispatchEvent(new Event("locale-pref-changed"));
    showToast("Configurações de idioma e região salvas com sucesso!", "success");
  };

  const handleSaveNotifications = () => {
    localStorage.setItem("notifications-preference", String(notificationsEnabled));
    showToast("Preferências de notificação salvas com sucesso!", "success");
  };

  const handleSaveAccessibility = () => {
    localStorage.setItem("high-contrast-preference", String(highContrast));
    localStorage.setItem("keyboard-focus-preference", String(keyboardFocus));
    window.dispatchEvent(new Event("accessibility-pref-changed"));
    showToast("Preferências de acessibilidade salvas com sucesso!", "success");
  };

  const handleSavePreferences = () => {
    localStorage.setItem("confirm-delete-preference", String(confirmDelete));
    localStorage.setItem("confirm-logout-preference", String(confirmLogout));
    localStorage.setItem("items-per-page-preference", String(itemsPerPage));
    window.dispatchEvent(new Event("preferences-pref-changed"));
    showToast("Preferências salvas com sucesso!", "success");
  };

  // --- ESTADOS DE IDIOMA E REGIÃO ---
  const [language, setLanguage] = useState<string>("pt-BR");
  const [country, setCountry] = useState<string>("Brasil");
  const [timezone, setTimezone] = useState<string>("America/Sao_Paulo");
  const [dateFormat, setDateFormat] = useState<string>("DD/MM/YYYY");
  const [timeFormat, setTimeFormat] = useState<string>("24h");
  const [numberFormat, setNumberFormat] = useState<string>("dot-comma");

  // --- ESTADO DE NOTIFICAÇÕES ---
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  // --- ESTADOS DE ACESSIBILIDADE ---
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [keyboardFocus, setKeyboardFocus] = useState<boolean>(false);

  // --- ESTADO DE SEGURANÇA (SESSÕES ATIVAS) ---
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: "1",
      device: "Desktop",
      browser: "Google Chrome",
      os: "Linux (Ubuntu)",
      location: "Teresina, PI - Brasil (Aproximado)",
      date: "Ativa agora",
      isCurrent: true
    },
    {
      id: "2",
      device: "Mobile",
      browser: "Safari",
      os: "iOS 17.4",
      location: "São Paulo, SP - Brasil (Aproximado)",
      date: "Último acesso: 27/06/2026 às 19:40",
      isCurrent: false
    },
    {
      id: "3",
      device: "Tablet",
      browser: "Mozilla Firefox",
      os: "Windows 11",
      location: "Teresina, PI - Brasil (Aproximado)",
      date: "Último acesso: 25/06/2026 às 10:15",
      isCurrent: false
    }
  ]);

  const revokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    showToast("Sessão revogada com sucesso!", "success");
  };

  const revokeAllOtherSessions = () => {
    setSessions(prev => prev.filter(s => s.isCurrent));
    setIsConfirmModalOpen(false);
    showToast("Todas as outras sessões foram encerradas com sucesso!", "success");
  };

  // --- ESTADOS DE PREFERÊNCIAS ---
  const [confirmDelete, setConfirmDelete] = useState<boolean>(true);
  const [confirmLogout, setConfirmLogout] = useState<boolean>(true);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // --- ESTADO DO FORMULÁRIO DE SUPORTE ---
  const [ticketSubject, setTicketSubject] = useState<string>("");
  const [ticketType, setTicketType] = useState<string>("duvida");
  const [ticketMessage, setTicketMessage] = useState<string>("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState<boolean>(false);

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      showToast("Preencha todos os campos do chamado.", "error");
      return;
    }
    setIsSubmittingTicket(true);
    setTimeout(() => {
      setIsSubmittingTicket(false);
      setTicketSubject("");
      setTicketMessage("");
      showToast("Chamado aberto com sucesso! Retornaremos em seu e-mail.", "success");
    }, 1500);
  };

  // --- MODAL DE CHANGELOG (SOBRE) ---
  const [isChangelogOpen, setIsChangelogOpen] = useState<boolean>(false);

  // --- ESTADOS DE DADOS DA EMPRESA ---
  const [companyData, setCompanyData] = useState({
    razaoSocial: "Conecta Recursos Humanos LTDA",
    nomeFantasia: "ConectaRH",
    cnpj: "12.345.678/0001-90",
    emailCorporativo: "rh@conectarh.com.br",
    telefone: "(86) 3222-1234",
    cep: "64000-000",
    cidade: "Teresina",
    estado: "PI",
    pais: "Brasil",
    responsavelNome: "Ana Silva Medeiros",
    responsavelEmail: "ana.medeiros@conectarh.com.br",
    inscricaoEstadual: "123.456.789",
    inscricaoMunicipal: "987.654.321",
    site: "https://conectarh.dev",
    whatsapp: "(86) 99999-8888",
    dataFundacao: "2024-03-15",
    porte: "media",
    segmento: "Tecnologia e Recursos Humanos",
    instagram: "https://instagram.com/conectarh",
    linkedin: "https://linkedin.com/company/conectarh",
    primaryColor: "#3b82f6",
    logoPreview: null as string | null
  });

  const handleCompanyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyData(prev => ({ ...prev, logoPreview: reader.result as string }));
        showToast("Logo selecionada temporariamente!", "info");
      };
      reader.readAsDataURL(file);
    }
  };

  const saveCompanyData = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(companyData)
      });
      const json = await res.json();
      if (json.success) {
        setCompanyData(json.data);
        showToast("Dados corporativos atualizados no banco de dados com sucesso!", "success");
      } else {
        showToast(json.message || "Erro ao salvar dados corporativos.", "error");
      }
    } catch (err) {
      console.error("Erro ao salvar dados corporativos:", err);
      showToast("Erro de conexão ao salvar dados corporativos.", "error");
    }
  };

  // --- MODAL DE SEGURANÇA (ENCERRAR SESSÕES) ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

  // Formatar prévia da data com base no formato escolhido
  const getFormattedDatePreview = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    if (dateFormat === "DD/MM/YYYY") return `${day}/${month}/${year}`;
    if (dateFormat === "MM/DD/YYYY") return `${month}/${day}/${year}`;
    return `${year}-${month}-${day}`;
  };

  // Definição das abas das configurações
  const tabs = [
    { id: "aparencia", label: "Aparência", icon: Palette, desc: "Tema, fontes e sidebar" },
    { id: "idioma", label: "Idioma e Região", icon: Globe, desc: "Padrões de exibição" },
    { id: "notificacoes", label: "Notificações", icon: Bell, desc: "Avisos da plataforma" },
    { id: "acessibilidade", label: "Acessibilidade", icon: Accessibility, desc: "Recursos de inclusão" },
    { id: "seguranca", label: "Segurança", icon: Lock, desc: "Sessões e proteção" },
    { id: "preferencias", label: "Preferências", icon: Zap, desc: "Comportamento do sistema" },
    { id: "suporte", label: "Suporte", icon: HelpCircle, desc: "Ajuda e chamados" },
    { id: "sobre", label: "Sobre", icon: Info, desc: "Detalhes do sistema" },
    { id: "dados", label: "Dados da Empresa", icon: Building2, desc: "Configurações corporativas", optional: true },
    { id: "conta", label: "Gerenciar Conta", icon: User, desc: "Ações e sessões" }
  ];

  return (
    <SectionComponent>
      
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-scale-up text-sm font-medium transition-all duration-300
              ${toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : ""}
              ${toast.type === "error" ? "bg-rose-50 border-rose-200 text-rose-800" : ""}
              ${toast.type === "info" ? "bg-blue-50 border-blue-200 text-blue-800" : ""}
            `}
          >
            {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />}
            {toast.type === "error" && <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />}
            {toast.type === "info" && <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />}
            <div className="flex-1">{toast.message}</div>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-stone-400 hover:text-stone-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Titulo com TittleHeader */}
      <TittleHeader 
        tittle="Configurações" 
        description="Personalize sua experiência, gerencie contas, defina padrões regionais e acesse ferramentas de suporte." 
        className="w-full"
      />

      {/* Breadcrumb */}
      <div className="w-full">
        <Breadcrumb items={[{ label: "Painel", href: "/" }, { label: "Configurações", href: "/configuracoes" }]} />
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 w-full">
        
        {/* Barra Lateral de Abas */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          
          {/* Navegação Mobile (Scroll Horizontal) */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-2 lg:hidden no-scrollbar border-b border-stone-200">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0 transition-all active:scale-95 cursor-pointer
                    ${isActive 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" 
                      : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-250/50"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Navegação Desktop (Vertical) */}
          <div className="hidden lg:flex flex-col gap-1.5 bg-white border border-stone-200/80 p-3 rounded-2xl shadow-xs">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-200 group cursor-pointer
                    ${isActive 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" 
                      : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-stone-400 group-hover:text-blue-500"}`} />
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-1.5">
                        {tab.label}
                        {tab.optional && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium border
                            ${isActive ? "bg-blue-500/30 border-blue-400 text-white" : "bg-stone-100 border-stone-200 text-stone-500"}`}>
                            Opcional
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] block mt-0.5 ${isActive ? "text-blue-100" : "text-stone-400"}`}>
                        {tab.desc}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? "text-white" : "text-stone-400"}`} />
                </button>
              );
            })}
          </div>

        </div>

        {/* Conteúdo Principal do Painel */}
        <div className="lg:col-span-3">
          
          <div className="bg-white border border-stone-200/80 rounded-3xl p-6 md:p-8 shadow-xs min-h-[500px] flex flex-col">
            
            {/* ================= CLARO/ESCURO (APARÊNCIA) ================= */}
            {activeTab === "aparencia" && (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveAppearance(); }} className="space-y-6 flex-1">
                <div>
                  <h2 className="text-lg font-bold text-stone-850 flex items-center gap-2 border-b border-stone-100 pb-3">
                    🎨 Aparência
                  </h2>
                  <p className="text-sm text-stone-500 mt-1">
                    Personalize o design visual da plataforma para torná-la mais confortável aos seus olhos.
                  </p>
                </div>

                {/* Grid Temas */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-stone-700 block">Tema do sistema</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* Claro */}
                    <button
                      type="button"
                      onClick={() => handleThemeChange("light")}
                      className={`flex flex-col items-center justify-between p-4 rounded-2xl border text-center cursor-pointer transition-all duration-200
                        ${theme === "light" 
                          ? "border-blue-500 bg-blue-50/20 shadow-sm" 
                          : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                        }`}
                    >
                      <div className="w-full aspect-[4/3] bg-stone-100 border border-stone-200 rounded-xl flex items-center justify-center relative overflow-hidden mb-3">
                        <Sun className="h-8 w-8 text-amber-500 animate-spin-slow" />
                        <div className="absolute bottom-1 right-1 bg-white border border-stone-200 h-4 w-12 rounded-sm" />
                      </div>
                      <span className="text-sm font-semibold text-stone-800">Claro</span>
                    </button>

                    {/* Escuro */}
                    <button
                      type="button"
                      onClick={() => handleThemeChange("dark")}
                      className={`flex flex-col items-center justify-between p-4 rounded-2xl border text-center cursor-pointer transition-all duration-200
                        ${theme === "dark" 
                          ? "border-blue-500 bg-blue-50/20 shadow-sm" 
                          : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                        }`}
                    >
                      <div className="w-full aspect-[4/3] bg-stone-900 border border-stone-800 rounded-xl flex items-center justify-center relative overflow-hidden mb-3">
                        <Moon className="h-8 w-8 text-indigo-400" />
                        <div className="absolute bottom-1 right-1 bg-stone-950 border border-stone-800 h-4 w-12 rounded-sm" />
                      </div>
                      <span className="text-sm font-semibold text-stone-800">Escuro</span>
                    </button>

                    {/* Automático */}
                    <button
                      type="button"
                      onClick={() => handleThemeChange("auto")}
                      className={`flex flex-col items-center justify-between p-4 rounded-2xl border text-center cursor-pointer transition-all duration-200
                        ${theme === "auto" 
                          ? "border-blue-500 bg-blue-50/20 shadow-sm" 
                          : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                        }`}
                    >
                      <div className="w-full aspect-[4/3] bg-gradient-to-r from-stone-100 to-stone-950 border border-stone-200 rounded-xl flex items-center justify-center relative overflow-hidden mb-3">
                        <Laptop className="h-8 w-8 text-stone-500 bg-white/70 p-1 rounded-full border border-stone-200" />
                      </div>
                      <span className="text-sm font-semibold text-stone-800">Automático</span>
                    </button>

                  </div>
                </div>

                {/* Seleção de Tamanho de Fonte */}
                <div className="space-y-3 pt-4 border-t border-stone-100">
                  <label className="text-sm font-semibold text-stone-700 block">Tamanho da fonte</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["small", "medium", "large"].map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleFontSizeChange(size)}
                        className={`py-3 px-4 rounded-xl border text-sm font-semibold cursor-pointer transition-all active:scale-98
                          ${fontSize === size 
                            ? "border-blue-500 bg-blue-50/30 text-blue-600" 
                            : "border-stone-200 text-stone-600 hover:bg-stone-50"
                          }`}
                      >
                        {size === "small" && <span className="text-xs">Aa (Pequena)</span>}
                        {size === "medium" && <span className="text-sm">Aa (Média)</span>}
                        {size === "large" && <span className="text-base">Aa (Grande)</span>}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-stone-400">
                    * Modifica o tamanho dos textos dentro do conteúdo principal da plataforma.
                  </p>
                </div>

                {/* Barra Lateral Config */}
                <div className="space-y-3 pt-4 border-t border-stone-100">
                  <label className="text-sm font-semibold text-stone-700 block">Barra Lateral (Menu)</label>
                  <div className="space-y-2">
                    {[
                      { id: "expanded", label: "Sempre expandida", details: "A barra lateral fica visível o tempo todo nas telas desktop." },
                      { id: "collapsed", label: "Recolhida automaticamente", details: "Minimiza para ícones para liberar espaço na tela." },
                      { id: "default", label: "Padrão do sistema com toggle", details: "Lembra sua preferência e permite recolher usando o botão." }
                    ].map(pref => (
                      <label
                        key={pref.id}
                        onClick={() => handleSidebarPrefChange(pref.id)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors
                          ${sidebarPref === pref.id 
                            ? "border-blue-500 bg-blue-50/10" 
                            : "border-stone-100 hover:bg-stone-50"
                          }`}
                      >
                        <input
                          type="radio"
                          name="sidebarPref"
                          checked={sidebarPref === pref.id}
                          onChange={() => {}}
                          className="mt-1 accent-blue-600"
                        />
                        <div>
                          <span className="text-sm font-semibold text-stone-800">{pref.label}</span>
                          <span className="text-xs block text-stone-400 mt-0.5">{pref.details}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Salvar Botão */}
                <div className="pt-6 border-t border-stone-100 flex justify-end">
                  <SubmitButton
                    text="Salvar Aparência"
                    className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                  />
                </div>

              </form>
            )}

            {activeTab === "idioma" && (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveLocale(); }} className="space-y-6 flex-1">
                <div>
                  <h2 className="text-lg font-bold text-stone-850 flex items-center gap-2 border-b border-stone-100 pb-3">
                    🌎 Idioma e Região
                  </h2>
                  <p className="text-sm text-stone-500 mt-1">
                    Defina seu idioma preferido, seu fuso horário e a exibição de formatos de data, hora e números.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Idioma */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-700 block">Idioma do sistema</label>
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value)}
                      className="w-full p-3 rounded-xl border border-stone-200/80 bg-stone-100 text-sm text-stone-800 font-semibold focus:outline-none focus:border-blue-500 cursor-not-allowed"
                      disabled
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                    </select>
                  </div>

                  {/* Região */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-700 block">País de origem</label>
                    <InputField
                      type="text"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      placeholder="Ex: Brasil"
                      classNameInput="text-sm font-semibold text-stone-800"
                      classNameDiv="py-2.5 px-3 bg-white"
                    />
                  </div>

                  {/* Fuso Horário */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-700 block">Fuso horário</label>
                    <select
                      value={timezone}
                      onChange={e => setTimezone(e.target.value)}
                      className="w-full p-3 rounded-xl border border-stone-200/80 bg-white text-sm text-stone-800 font-semibold focus:outline-none focus:border-blue-500"
                    >
                      <option value="America/Sao_Paulo">Brasília (GMT-3) - America/Sao_Paulo</option>
                      <option value="America/Manaus">Manaus (GMT-4) - America/Manaus</option>
                      <option value="America/Noronha">Fernando de Noronha (GMT-2)</option>
                      <option value="UTC">Tempo Universal Coordenado (UTC)</option>
                    </select>
                  </div>

                  {/* Formato de data */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-700 block">Formato da data</label>
                    <select
                      value={dateFormat}
                      onChange={e => setDateFormat(e.target.value)}
                      className="w-full p-3 rounded-xl border border-stone-200/80 bg-white text-sm text-stone-800 font-semibold focus:outline-none focus:border-blue-500"
                    >
                      <option value="DD/MM/YYYY">Dia/Mês/Ano (DD/MM/AAAA)</option>
                      <option value="MM/DD/YYYY">Mês/Dia/Ano (MM/DD/AAAA)</option>
                      <option value="YYYY-MM-DD">Ano-Mês-Dia (AAAA-MM-DD)</option>
                    </select>
                  </div>

                  {/* Formato de Hora */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-700 block">Formato da hora</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setTimeFormat("24h")}
                        className={`p-3 rounded-xl border text-sm font-semibold cursor-pointer transition-all
                          ${timeFormat === "24h" ? "border-blue-500 bg-blue-50/30 text-blue-600" : "border-stone-200 text-stone-700"}`}
                      >
                        24 Horas (14:30)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeFormat("12h")}
                        className={`p-3 rounded-xl border text-sm font-semibold cursor-pointer transition-all
                          ${timeFormat === "12h" ? "border-blue-500 bg-blue-50/30 text-blue-600" : "border-stone-200 text-stone-700"}`}
                      >
                        12 Horas (02:30 PM)
                      </button>
                    </div>
                  </div>

                  {/* Formato numérico */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-700 block">Formato numérico</label>
                    <select
                      value={numberFormat}
                      onChange={e => setNumberFormat(e.target.value)}
                      className="w-full p-3 rounded-xl border border-stone-200/80 bg-white text-sm text-stone-800 font-semibold focus:outline-none focus:border-blue-500"
                    >
                      <option value="dot-comma">Ponto/Vírgula (Ex: 1.000,50)</option>
                      <option value="comma-dot">Vírgula/Ponto (Ex: 1,000.50)</option>
                    </select>
                  </div>
                </div>

                {/* Caixa de Visualização dos Formatos */}
                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/60 mt-4 space-y-2">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Prévia de Exibição Local</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <span className="text-[11px] block text-stone-400">Data de Hoje</span>
                      <span className="text-sm font-bold text-stone-800">{getFormattedDatePreview()}</span>
                    </div>
                    <div>
                      <span className="text-[11px] block text-stone-400">Hora Atual</span>
                      <span className="text-sm font-bold text-stone-800">
                        {timeFormat === "24h" ? "14:32" : "02:32 PM"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] block text-stone-400">Salário Exemplo</span>
                      <span className="text-sm font-bold text-stone-800">
                        {numberFormat === "dot-comma" ? "R$ 4.500,00" : "R$ 4,500.00"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Salvar Botão */}
                <div className="pt-6 border-t border-stone-100 flex justify-end">
                  <SubmitButton
                    text="Salvar Idioma e Região"
                    className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                  />
                </div>
              </form>
            )}

            {/* ================= NOTIFICAÇÕES ================= */}
            {activeTab === "notificacoes" && (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveNotifications(); }} className="space-y-6 flex-1">
                <div>
                  <h2 className="text-lg font-bold text-stone-850 flex items-center gap-2 border-b border-stone-100 pb-3">
                    🔔 Notificações
                  </h2>
                  <p className="text-sm text-stone-500 mt-1">
                    Controle de forma flexível como o sistema avisa você sobre novos eventos corporativos.
                  </p>
                </div>

                <div className="space-y-4">
                  
                  {/* Switch */}
                  <div className="flex items-center justify-between p-4 bg-stone-50/50 rounded-2xl border border-stone-100">
                    <div>
                      <span className="text-sm font-bold text-stone-800 block">Notificações Internas</span>
                      <span className="text-xs text-stone-400 block mt-0.5">
                        Alerta flutuante no painel e sininho da barra superior.
                      </span>
                    </div>
                    
                    {/* Custom Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                        ${notificationsEnabled ? "bg-blue-600" : "bg-stone-200"}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out
                          ${notificationsEnabled ? "translate-x-5.5" : "translate-x-0"}`}
                      />
                    </button>
                  </div>

                  {/* Informações Auxiliares */}
                  <div className="flex items-start gap-3 p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50 text-blue-800 text-xs leading-relaxed">
                    <AlertCircle className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Recomendado manter ativado</p>
                      <p className="text-blue-700/90 mt-0.5">
                        As notificações internas avisam sobre a aprovação de novos documentos enviados por colaboradores, solicitações de ponto e avisos de novos canais de chat.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Salvar Botão */}
                <div className="pt-6 border-t border-stone-100 flex justify-end">
                  <SubmitButton
                    text="Salvar Notificações"
                    className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                  />
                </div>

              </form>
            )}

            {/* ================= ACESSIBILIDADE ================= */}
            {activeTab === "acessibilidade" && (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveAccessibility(); }} className="space-y-6 flex-1">
                <div>
                  <h2 className="text-lg font-bold text-stone-850 flex items-center gap-2 border-b border-stone-100 pb-3">
                    ♿ Acessibilidade
                  </h2>
                  <p className="text-sm text-stone-500 mt-1">
                    Ajuste os parâmetros visuais e operacionais da plataforma para uma navegação confortável.
                  </p>
                </div>

                <div className="space-y-3">
                  
                  {/* Item 1: Alto contraste */}
                  <div className="flex items-center justify-between p-4 bg-stone-50/50 rounded-2xl border border-stone-100">
                    <div>
                      <span className="text-sm font-bold text-stone-800 block">Alto Contraste</span>
                      <span className="text-xs text-stone-400 block mt-0.5">
                        Aumenta o contraste das cores de fundo e textos para leitura aprimorada.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHighContrast(!highContrast)}
                      className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                        ${highContrast ? "bg-blue-600" : "bg-stone-200"}`}
                    >
                      <span className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${highContrast ? "translate-x-5.5" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {/* Item 3: Melhorar foco */}
                  <div className="flex items-center justify-between p-4 bg-stone-50/50 rounded-2xl border border-stone-100">
                    <div>
                      <span className="text-sm font-bold text-stone-800 block">Melhorar foco para navegação por teclado</span>
                      <span className="text-xs text-stone-400 block mt-0.5">
                        Adiciona bordas largas e bem visíveis ao redor do elemento focado via tabulação.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setKeyboardFocus(!keyboardFocus)}
                      className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                        ${keyboardFocus ? "bg-blue-600" : "bg-stone-200"}`}
                    >
                      <span className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${keyboardFocus ? "translate-x-5.5" : "translate-x-0"}`} />
                    </button>
                  </div>

                </div>

                {/* Salvar Botão */}
                <div className="pt-6 border-t border-stone-100 flex justify-end">
                  <SubmitButton
                    text="Salvar Acessibilidade"
                    className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                  />
                </div>

              </form>
            )}

            {/* ================= SEGURANÇA ================= */}
            {activeTab === "seguranca" && (
              <form onSubmit={(e) => { e.preventDefault(); showToast("Preferências de segurança salvas!", "success"); }} className="space-y-6 flex-1">
                <div>
                  <h2 className="text-lg font-bold text-stone-850 flex items-center gap-2 border-b border-stone-100 pb-3">
                    🔒 Segurança e Dispositivos
                  </h2>
                  <p className="text-sm text-stone-500 mt-1">
                    Monitore todas as sessões e aparelhos conectados à sua conta e deslogue sessões desconhecidas.
                  </p>
                </div>

                {/* Lista de Sessões Ativas */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-stone-750">Dispositivos conectados</h3>
                  
                  <div className="space-y-3">
                    {sessions.map(session => (
                      <div
                        key={session.id}
                        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl border transition-all duration-200
                          ${session.isCurrent 
                            ? "bg-blue-50/20 border-blue-200" 
                            : "bg-white border-stone-200 hover:bg-stone-50"
                          }`}
                      >
                        <div className="flex gap-3">
                          <div className={`p-2.5 rounded-xl shrink-0 self-start
                            ${session.device === "Desktop" ? "bg-stone-100 text-stone-600" : ""}
                            ${session.device === "Mobile" ? "bg-emerald-50 text-emerald-600" : ""}
                            ${session.device === "Tablet" ? "bg-violet-50 text-violet-600" : ""}
                          `}>
                            {session.device === "Desktop" && <Laptop className="h-5 w-5" />}
                            {session.device === "Mobile" && <Smartphone className="h-5 w-5" />}
                            {session.device === "Tablet" && <Smartphone className="h-5 w-5 rotate-90" />}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-stone-800">
                                {session.browser} em {session.os}
                              </span>
                              {session.isCurrent && (
                                <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                                  Esta Sessão
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-stone-400 block">{session.location}</span>
                            <span className="text-[11px] font-medium text-stone-500 block">{session.date}</span>
                          </div>
                        </div>

                        {!session.isCurrent && (
                          <button
                            type="button"
                            onClick={() => revokeSession(session.id)}
                            className="mt-3 sm:mt-0 px-3.5 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors self-start sm:self-center cursor-pointer"
                          >
                            Revogar Sessão
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-stone-100">
                    <p className="text-xs text-stone-400">
                      Caso perceba algum acesso incomum ou não reconhecido, encerre todas as outras conexões imediatamente.
                    </p>
                    <div className="flex gap-2.5 shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsConfirmModalOpen(true)}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold rounded-xl text-xs cursor-pointer active:scale-95 transition-all text-center"
                      >
                        Encerrar outros acessos
                      </button>
                      <SubmitButton
                        text="Salvar Segurança"
                        className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                      />
                    </div>
                  </div>

                </div>
              </form>
            )}

            {/* ================= PREFERÊNCIAS ================= */}
            {activeTab === "preferencias" && (
              <form onSubmit={(e) => { e.preventDefault(); handleSavePreferences(); }} className="space-y-6 flex-1">
                <div>
                  <h2 className="text-lg font-bold text-stone-850 flex items-center gap-2 border-b border-stone-100 pb-3">
                    ⚡ Preferências de Uso
                  </h2>
                  <p className="text-sm text-stone-500 mt-1">
                    Personalize comportamentos e ações repetitivas dentro da sua conta.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Confirmações de Ações */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-stone-700 block">Modais de Confirmação</label>
                    
                    <div className="space-y-3">
                      {/* Confirmar exclusão */}
                      <div className="flex items-center justify-between p-4 bg-stone-50/50 rounded-2xl border border-stone-100">
                        <div>
                          <span className="text-sm font-bold text-stone-800 block">Confirmar antes de excluir registros</span>
                          <span className="text-xs text-stone-400 block mt-0.5">
                            Sempre exibirá um aviso pop-up antes de deletar qualquer dado definitivamente.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(!confirmDelete)}
                          className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                            ${confirmDelete ? "bg-blue-600" : "bg-stone-200"}`}
                        >
                          <span className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${confirmDelete ? "translate-x-5.5" : "translate-x-0"}`} />
                        </button>
                      </div>

                      {/* Confirmar sair */}
                      <div className="flex items-center justify-between p-4 bg-stone-50/50 rounded-2xl border border-stone-100">
                        <div>
                          <span className="text-sm font-bold text-stone-800 block">Confirmar ao sair da conta (Logout)</span>
                          <span className="text-xs text-stone-400 block mt-0.5">
                            Exibe um aviso de segurança para confirmar se deseja realmente deslogar.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfirmLogout(!confirmLogout)}
                          className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                            ${confirmLogout ? "bg-blue-600" : "bg-stone-200"}`}
                        >
                          <span className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${confirmLogout ? "translate-x-5.5" : "translate-x-0"}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Paginação */}
                  <div className="space-y-2 pt-4 border-t border-stone-100">
                    <label className="text-sm font-semibold text-stone-700 block">Itens por listagem (Paginação)</label>
                    <p className="text-xs text-stone-400">Quantidade de cadastros e registros exibidos por página nas tabelas.</p>
                    <div className="flex gap-2">
                      {[10, 25, 50, 100].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setItemsPerPage(val)}
                          className={`flex-1 py-2 px-3 border text-xs font-semibold rounded-lg cursor-pointer transition-all active:scale-95
                            ${itemsPerPage === val 
                              ? "border-blue-500 bg-blue-50/20 text-blue-600" 
                              : "border-stone-200 text-stone-500 hover:bg-stone-50"
                            }`}
                        >
                          {val} itens
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Salvar Botão */}
                <div className="pt-6 border-t border-stone-100 flex justify-end">
                  <SubmitButton
                    text="Salvar Preferências"
                    className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                  />
                </div>

              </form>
            )}

            {/* ================= SUPORTE ================= */}
            {activeTab === "suporte" && (
              <form onSubmit={(e) => { e.preventDefault(); showToast("Configurações de suporte salvas!", "success"); }} className="space-y-6 flex-1">
                <div>
                  <h2 className="text-lg font-bold text-stone-850 flex items-center gap-2 border-b border-stone-100 pb-3">
                    💬 Suporte Técnico ConectaRH
                  </h2>
                  <p className="text-sm text-stone-500 mt-1">
                    Central de ajuda direta para tirar dúvidas, reportar falhas ou sugerir novas funcionalidades para a equipe.
                  </p>
                </div>

                {/* Cartões rápidos de Suporte */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-stone-50 border border-stone-200/50 rounded-2xl flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-stone-800">Central de Ajuda</h4>
                      <p className="text-xs text-stone-400 mt-0.5">Manuais e artigos rápidos sobre todos os módulos do sistema.</p>
                      <button type="button" onClick={() => showToast("Central de Ajuda em breve!", "info")} className="text-xs font-semibold text-blue-600 mt-2 hover:underline flex items-center gap-1 cursor-pointer">
                        Acessar Central <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-stone-50 border border-stone-200/50 rounded-2xl flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-stone-800">Perguntas Frequentes (FAQ)</h4>
                      <p className="text-xs text-stone-400 mt-0.5">Dúvidas rápidas resolvidas sobre admissão, férias e ponto.</p>
                      <button type="button" onClick={() => showToast("FAQ disponível em breve!", "info")} className="text-xs font-semibold text-emerald-600 mt-2 hover:underline flex items-center gap-1 cursor-pointer">
                        Ver Perguntas <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Formulário de Abertura de Chamado */}
                <div className="space-y-4 pt-4 border-t border-stone-100">
                  <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                    <HeartHandshake className="h-4.5 w-4.5 text-blue-500" />
                    Abrir um Chamado
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-stone-600">Assunto do chamado</label>
                      <InputField
                        type="text"
                        value={ticketSubject}
                        onChange={e => setTicketSubject(e.target.value)}
                        placeholder="Ex: Erro ao gerar espelho de ponto"
                        classNameInput="text-sm font-semibold text-stone-800"
                        classNameDiv="py-2.5 px-3 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-600">Tipo de solicitação</label>
                      <select
                        value={ticketType}
                        onChange={e => setTicketType(e.target.value)}
                        className="w-full p-2.5 border border-stone-200/80 rounded-xl text-sm bg-white text-stone-800 font-semibold focus:outline-none"
                      >
                        <option value="duvida">Dúvida Operacional</option>
                        <option value="bug">Reportar Bug / Erro</option>
                        <option value="funcionalidade">Pedir Funcionalidade</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600">Mensagem detalhada</label>
                    <textarea
                      rows={3}
                      value={ticketMessage}
                      onChange={e => setTicketMessage(e.target.value)}
                      placeholder="Descreva detalhadamente o ocorrido ou sua sugestão para que possamos ajudar..."
                      className="w-full p-3 border border-stone-200/80 rounded-xl text-sm text-stone-800 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendTicket}
                    disabled={isSubmittingTicket}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingTicket ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar Chamado"
                    )}
                  </button>
                </div>

                {/* Rodapé de Informações Adicionais */}
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-250/50 flex flex-col sm:flex-row justify-between gap-4 text-xs text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <span>Versão instalada:</span>
                    <span className="font-semibold text-stone-600">BETA 1.0.0</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Status do sistema:</span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                      Disponível
                    </span>
                  </div>
                  <div>
                    <span>Tempo de resposta:</span>
                    <span className="font-semibold text-stone-600"> ~15 minutos</span>
                  </div>
                </div>

                {/* Salvar Botão */}
                <div className="pt-6 border-t border-stone-100 flex justify-end">
                  <SubmitButton
                    text="Salvar Suporte"
                    className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                  />
                </div>

              </form>
            )}

            {/* ================= SOBRE ================= */}
            {activeTab === "sobre" && (
              <form onSubmit={(e) => { e.preventDefault(); showToast("Informações do sistema validadas!", "success"); }} className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-stone-850 flex items-center gap-2 border-b border-stone-100 pb-3">
                      ℹ️ Sobre o Sistema
                    </h2>
                    <p className="text-sm text-stone-500 mt-1">
                      Informações institucionais, histórico e termos legais da plataforma ConectaRH.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-stone-50/50 p-6 rounded-2xl border border-stone-100">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[11px] block text-stone-400 font-bold uppercase">Nome do sistema</span>
                        <span className="text-sm font-bold text-stone-800">ConectaRH SaaS Portal</span>
                      </div>
                      <div>
                        <span className="text-[11px] block text-stone-400 font-bold uppercase">Versão Atual</span>
                        <span className="text-sm font-bold text-stone-800">1.0.0 (BETA)</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[11px] block text-stone-400 font-bold uppercase">Última atualização</span>
                        <span className="text-sm font-bold text-stone-800">28 de Junho de 2026</span>
                      </div>
                      <div>
                        <span className="text-[11px] block text-stone-400 font-bold uppercase">Desenvolvedor</span>
                        <span className="text-sm font-bold text-stone-850">ConectaRH Team & Antigravity</span>
                      </div>
                    </div>
                  </div>

                  {/* Links Legais */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-500">
                    <a href="#" className="hover:text-blue-600 transition-colors">Política de Privacidade</a>
                    <span>•</span>
                    <a href="#" className="hover:text-blue-600 transition-colors">Termos de Uso</a>
                    <span>•</span>
                    <a href="#" className="hover:text-blue-600 transition-colors">Licenças de Terceiros</a>
                  </div>
                </div>

                {/* Changelog Botão */}
                <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <span className="text-xs text-stone-400">Quer saber o que há de novo? Acompanhe o changelog.</span>
                  <div className="flex gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsChangelogOpen(true)}
                      className="flex-1 sm:flex-none px-4 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer text-center"
                    >
                      Ver Novidades (Changelog)
                    </button>
                    <SubmitButton
                      text="Salvar"
                      className="flex-1 sm:flex-none !w-auto !py-2.5 !px-4 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                    />
                  </div>
                </div>
              </form>
            )}

            {/* ================= DADOS DA EMPRESA ================= */}
            {activeTab === "dados" && (
              <form onSubmit={saveCompanyData} className="space-y-6 flex-1">
                <div>
                  <h2 className="text-lg font-bold text-stone-850 flex items-center gap-2 border-b border-stone-100 pb-3">
                    📤 Dados da Empresa (Opcional)
                  </h2>
                  <p className="text-sm text-stone-500 mt-1">
                    Insira as informações jurídicas e de contato da sua organização para emissão de relatórios e identidade visual.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Razão Social */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600">Razão Social</label>
                    <InputField
                      type="text"
                      value={companyData.razaoSocial}
                      onChange={e => setCompanyData({ ...companyData, razaoSocial: e.target.value })}
                      classNameInput="text-sm font-semibold text-stone-800"
                      classNameDiv="py-2.5 px-3 bg-white"
                    />
                  </div>

                  {/* Nome Fantasia */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600">Nome Fantasia</label>
                    <InputField
                      type="text"
                      value={companyData.nomeFantasia}
                      onChange={e => setCompanyData({ ...companyData, nomeFantasia: e.target.value })}
                      classNameInput="text-sm font-semibold text-stone-800"
                      classNameDiv="py-2.5 px-3 bg-white"
                    />
                  </div>

                  {/* CNPJ */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600">CNPJ</label>
                    <InputField
                      type="text"
                      value={companyData.cnpj}
                      onChange={e => setCompanyData({ ...companyData, cnpj: e.target.value })}
                      classNameInput="text-sm font-semibold text-stone-800"
                      classNameDiv="py-2.5 px-3 bg-white"
                    />
                  </div>

                  {/* Email Corporativo */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600">E-mail corporativo</label>
                    <InputField
                      type="email"
                      value={companyData.emailCorporativo}
                      onChange={e => setCompanyData({ ...companyData, emailCorporativo: e.target.value })}
                      classNameInput="text-sm font-semibold text-stone-800"
                      classNameDiv="py-2.5 px-3 bg-white"
                    />
                  </div>

                  {/* Telefone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600">Telefone corporativo</label>
                    <InputField
                      type="text"
                      value={companyData.telefone}
                      onChange={e => setCompanyData({ ...companyData, telefone: e.target.value })}
                      classNameInput="text-sm font-semibold text-stone-800"
                      classNameDiv="py-2.5 px-3 bg-white"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600">WhatsApp Comercial</label>
                    <InputField
                      type="text"
                      value={companyData.whatsapp}
                      onChange={e => setCompanyData({ ...companyData, whatsapp: e.target.value })}
                      classNameInput="text-sm font-semibold text-stone-800"
                      classNameDiv="py-2.5 px-3 bg-white"
                    />
                  </div>

                  {/* Endereço - CEP */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600">CEP</label>
                    <InputField
                      type="text"
                      value={companyData.cep}
                      onChange={e => setCompanyData({ ...companyData, cep: e.target.value })}
                      classNameInput="text-sm font-semibold text-stone-800"
                      classNameDiv="py-2.5 px-3 bg-white"
                    />
                  </div>

                  {/* Cidade */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600">Cidade</label>
                    <InputField
                      type="text"
                      value={companyData.cidade}
                      onChange={e => setCompanyData({ ...companyData, cidade: e.target.value })}
                      classNameInput="text-sm font-semibold text-stone-800"
                      classNameDiv="py-2.5 px-3 bg-white"
                    />
                  </div>

                  {/* Estado */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600">Estado / UF</label>
                    <InputField
                      type="text"
                      value={companyData.estado}
                      onChange={e => setCompanyData({ ...companyData, estado: e.target.value })}
                      classNameInput="text-sm font-semibold text-stone-800"
                      classNameDiv="py-2.5 px-3 bg-white"
                    />
                  </div>

                  {/* Responsável Nome */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600">Responsável (Nome)</label>
                    <InputField
                      type="text"
                      value={companyData.responsavelNome}
                      onChange={e => setCompanyData({ ...companyData, responsavelNome: e.target.value })}
                      classNameInput="text-sm font-semibold text-stone-800"
                      classNameDiv="py-2.5 px-3 bg-white"
                    />
                  </div>

                  {/* Responsável E-mail */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600">Responsável (E-mail)</label>
                    <InputField
                      type="email"
                      value={companyData.responsavelEmail}
                      onChange={e => setCompanyData({ ...companyData, responsavelEmail: e.target.value })}
                      classNameInput="text-sm font-semibold text-stone-800"
                      classNameDiv="py-2.5 px-3 bg-white"
                    />
                  </div>

                  {/* Porte da empresa */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600">Porte da Empresa</label>
                    <select
                      value={companyData.porte}
                      onChange={e => setCompanyData({ ...companyData, porte: e.target.value })}
                      className="w-full p-2.5 border border-stone-200/80 rounded-xl text-sm bg-white text-stone-800 focus:outline-none"
                    >
                      <option value="micro">Microempresa (ME)</option>
                      <option value="pequena">Pequeno Porte (EPP)</option>
                      <option value="media">Médio Porte</option>
                      <option value="grande">Grande Empresa / Corporação</option>
                    </select>
                  </div>
                </div>

                {/* Seção Logo & Cores */}
                <div className="pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Upload Logo */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-600 block">Logomarca da Empresa</label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                        {companyData.logoPreview ? (
                          <img src={companyData.logoPreview} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          <Building2 className="h-6 w-6 text-stone-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          id="company-logo"
                          accept="image/*"
                          onChange={handleCompanyLogoChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="company-logo"
                          className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold rounded-xl text-xs cursor-pointer block text-center"
                        >
                          Selecionar Logo
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Cor da identidade visual */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-600 block">Cor Principal da Identidade</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={companyData.primaryColor}
                        onChange={e => setCompanyData({ ...companyData, primaryColor: e.target.value })}
                        className="h-10 w-16 p-0.5 border border-stone-200 rounded-xl cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-stone-800 block uppercase">{companyData.primaryColor}</span>
                        <span className="text-[10px] text-stone-400 block">Seleciona a cor primária de botões e cabeçalhos.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex justify-end">
                  <SubmitButton
                    text="Salvar Configurações Corporativas"
                    className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                  />
                </div>
              </form>
            )}

            {/* ================= GERENCIAR CONTA ================= */}
            {activeTab === "conta" && (
              <form onSubmit={(e) => { e.preventDefault(); showToast("Configurações da conta salvas com sucesso!", "success"); }} className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-stone-850 flex items-center gap-2 border-b border-stone-100 pb-3">
                      🚪 Gerenciamento da Conta
                    </h2>
                    <p className="text-sm text-stone-500 mt-1">
                      Ações críticas relacionadas à sua conta de acesso no ConectaRH.
                    </p>
                  </div>

                  {/* Segurança e Desconexão Global */}
                  <div className="p-5 rounded-2xl bg-rose-50/20 border border-rose-200/50 space-y-4">
                    <div className="flex gap-3">
                      <Shield className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-rose-800">Encerrar todas as sessões ativas</h4>
                        <p className="text-xs text-rose-700/85 mt-1 leading-relaxed">
                          Desconecte sua conta ConectaRH de todos os computadores, celulares e tablets que estão atualmente logados. Esta sessão atual permanecerá ativa.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setIsConfirmModalOpen(true)}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-rose-500/10 cursor-pointer"
                      >
                        Deslogar de todos os outros aparelhos
                      </button>
                    </div>
                  </div>

                  {/* Proteção Extra */}
                  <div className="flex items-start gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200/60 text-xs text-stone-500 leading-relaxed">
                    <Info className="h-4.5 w-4.5 text-stone-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-stone-700">Por que fazer isso?</p>
                      <p className="mt-0.5">
                        Caso você tenha acessado seu painel a partir de um computador compartilhado ou cybercafé e esquecido de clicar em sair, esta ação força a expiração dos tokens nesses aparelhos para proteger seus dados cadastrais.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-stone-400">
                  <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                    <span>ConectaRH e-ID: usr_82a7fbc200</span>
                    <span className="font-medium">Nível de segurança: Alto</span>
                  </div>
                  <SubmitButton
                    text="Salvar Conta"
                    className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
                  />
                </div>
              </form>
            )}

          </div>

        </div>

      </div>

      {/* ================= MODAL DE CONFIRMAÇÃO DE LOGOUT SESSÕES ================= */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsConfirmModalOpen(false)} />
          
          {/* Caixa Modal */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 max-w-md w-full relative z-10 animate-scale-up space-y-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl w-fit">
              <Shield className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-stone-850">Encerrar outras conexões?</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Você será desconectado imediatamente de todos os outros dispositivos. Para reativar o acesso neles, será necessário inserir o CPF e a senha novamente.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold rounded-xl text-xs cursor-pointer text-center transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={revokeAllOtherSessions}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs cursor-pointer text-center transition-all shadow-md shadow-rose-500/10"
              >
                Sim, desconectar outros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DO CHANGELOG (SOBRE) ================= */}
      {isChangelogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs" onClick={() => setIsChangelogOpen(false)} />

          {/* Conteúdo */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 max-w-lg w-full relative z-10 animate-scale-up max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-150">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-850">Novidades da Versão (Changelog)</h3>
                  <span className="text-[10px] text-stone-400">Histórico de atualizações do ConectaRH</span>
                </div>
              </div>
              <button 
                onClick={() => setIsChangelogOpen(false)} 
                className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Updates */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-2 no-scrollbar">
              
              {/* Versão 1.0.0 */}
              <div className="relative pl-5 border-l-2 border-blue-500">
                <div className="absolute -left-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-white" />
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">v1.0.0 (BETA) - Junho 2026</span>
                <h4 className="text-sm font-bold text-stone-800 mt-1">Lançamento Geral do Ponto e Chat</h4>
                <ul className="text-xs text-stone-500 mt-2 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>Implementação do módulo **Ponto Eletrônico** com Kiosk Totem QR Code e área do colaborador para registro seguro via câmera.</li>
                  <li>Início do canal de **Chat corporativo** integrado com mensagens temporárias de 3 dias no banco.</li>
                  <li>Criação de visualizadores e formulários de cadastro para novas contratações (**Admissões**).</li>
                  <li>Melhoria na velocidade do carregamento da dashboard de administração.</li>
                </ul>
              </div>

              {/* Versão 0.8.0 */}
              <div className="relative pl-5 border-l-2 border-stone-200">
                <div className="absolute -left-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-stone-300 border-2 border-white" />
                <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">v0.8.0 - Maio 2026</span>
                <h4 className="text-sm font-bold text-stone-800 mt-1">Módulo de Documentos e Onboarding</h4>
                <ul className="text-xs text-stone-500 mt-2 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>Criação do gerenciador de pastas e arquivos no módulo **Documentos**.</li>
                  <li>Início da esteira de **Onboarding** para controle de documentos e termos admissoriais.</li>
                  <li>Refatoração do layout de navegação com Sidebar recolhível responsiva.</li>
                </ul>
              </div>

              {/* Versão 0.5.0 */}
              <div className="relative pl-5 border-l-2 border-stone-200">
                <div className="absolute -left-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-stone-300 border-2 border-white" />
                <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">v0.5.0 - Abril 2026</span>
                <h4 className="text-sm font-bold text-stone-800 mt-1">Estrutura Inicial de Autenticação e CPF</h4>
                <ul className="text-xs text-stone-500 mt-2 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>Lançamento do banco de dados Postgres e Prisma.</li>
                  <li>Segurança inicial de login por cookies e controle de papéis (`ADMIN` vs `USER`).</li>
                  <li>Cadastro inicial de colaboradores com validação e formatação automática de CPF.</li>
                </ul>
              </div>

            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-stone-150 flex justify-end">
              <button
                onClick={() => setIsChangelogOpen(false)}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-850 text-white font-semibold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </SectionComponent>
  );
}
