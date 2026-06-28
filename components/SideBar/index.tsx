import conecta from "@/public/conectaRH_horizontal.png";
import conectaRH from "@/public/conectaRH.png";
import {
  BellIcon,
  Building2,
  CheckCircle,
  FileCheckCorner,
  FileSpreadsheet,
  LayoutDashboard,
  LucideSettings,
  MessageCircleMore,
  UserCircle2,
  UserRoundPlus,
  Users2,
  Palmtree,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Tooltip from "@/components/Tooltip";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface PropsButtonSideBar {
  icon: React.ReactNode;
  name: string;
  redirect: string;
  unreadCount?: number;
}

export function ButtonIconSideBar({
  icon,
  name,
  redirect,
  isCollapsed,
  unreadCount = 0,
}: PropsButtonSideBar & { isCollapsed?: boolean }) {
  const hasUnread = name === "Notificações" && unreadCount > 0;
  
  return (
    <Link
      href={redirect}
      className="relative flex items-center justify-center p-3 rounded-lg text-slate-300 hover:text-white transition-all duration-200 group"
    >
      <div className="text-xl text-slate-600 group-hover:text-blue-400 transition-colors relative">
        {icon}
        {hasUnread && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </div>

      {/* Tooltip no mobile (sempre embaixo) ou no desktop expandido */}
      <div className={isCollapsed ? "lg:hidden" : "block"}>
        <Tooltip text={name} position="bottom" />
      </div>

      {/* Tooltip no desktop colapsado (à direita) */}
      {isCollapsed && (
        <div className="hidden lg:block">
          <Tooltip text={name} position="right" />
        </div>
      )}
    </Link>
  );
}

export function ButtonSideBar({
  icon,
  name,
  redirect,
  isCollapsed,
}: PropsButtonSideBar & { isCollapsed?: boolean }) {
  const pathname = usePathname();

  // Verifica se a rota atual começa com o link do botão (evita bugs com sub-rotas)
  const isActive = pathname === redirect;

  return (
    <Link
      href={redirect}
      className={`relative flex items-center gap-3 p-3 rounded-lg font-medium transition-all duration-200 group
        ${isCollapsed ? "justify-start lg:justify-center lg:px-2" : "justify-start"}
        ${
          isActive
            ? "bg-blue-600/10 text-blue-500"
            : "text-slate-800/70 hover:bg-slate-800 hover:text-white"
        }`}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-blue-500 rounded-r-md" />
      )}

      <div
        className={`text-xl transition-colors ${isActive ? "text-blue-500" : "text-slate-400"} shrink-0`}
      >
        {icon}
      </div>

      {/* Nome */}
      <span className={`text-sm truncate ${isCollapsed ? "block lg:hidden" : "block"}`}>{name}</span>

      {/* Tooltip quando minimizado no desktop */}
      {isCollapsed && (
        <div className="hidden lg:block">
          <Tooltip text={name} position="right" />
        </div>
      )}
    </Link>
  );
}

interface SideBarProps {
  isAdmin?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function SideBar({
  isAdmin = true,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}: SideBarProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      const json = await res.json();
      if (json.success) {
        setUnreadCount(json.unreadCount);
      }
    } catch (err) {
      console.error("Erro ao carregar quantidade de notificações:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Escutar por atualizações locais de notificações
    window.addEventListener("notifications-updated", fetchUnreadCount);
    
    // Checar periodicamente a cada 15 segundos
    const interval = setInterval(fetchUnreadCount, 15000);
    
    return () => {
      window.removeEventListener("notifications-updated", fetchUnreadCount);
      clearInterval(interval);
    };
  }, []);

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex flex-col bg-white shadow-r-2xl shrink-0 transition-all duration-300 ease-in-out h-screen
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${isCollapsed ? "lg:w-20" : "lg:w-64"}
        w-64
      `}
    >
      {/* Botão de Fechar no Mobile */}
      <button
        onClick={onCloseMobile}
        className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 lg:hidden cursor-pointer transition-colors z-50"
        aria-label="Fechar menu"
      >
        <X size={20} />
      </button>

      {/* Botão de Minimizar no Desktop */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute top-9 right-[-12px] w-6 h-6 bg-white border border-stone-200/80 shadow-sm rounded-full hidden lg:flex items-center justify-center cursor-pointer hover:bg-stone-50 text-stone-500 hover:text-stone-850 transition-all z-50 hover:scale-105 active:scale-95"
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      )}

      {/* Container Rolável */}
      <div className={`flex-1 flex flex-col select-none pb-6 no-scrollbar
        ${isCollapsed ? "overflow-y-auto lg:overflow-y-visible lg:overflow-x-visible" : "overflow-y-auto overflow-x-hidden"}
      `}>
        {/* Div da imagem */}
        <div className={`pt-12 pb-6 flex items-center justify-center transition-all duration-300 px-12 ${isCollapsed ? "lg:px-2" : ""}`}>
          <div className={isCollapsed ? "block lg:hidden" : "block"}>
            <Image
              src={conecta}
              alt="ConectaRH"
              height={150}
              width={150}
              priority
              className="h-auto w-auto object-contain"
            />
          </div>
          {isCollapsed && (
            <div className="hidden lg:block">
              <Image
                src={conectaRH}
                alt="ConectaRH"
                height={36}
                width={36}
                priority
                className="h-9 w-9 object-contain"
              />
            </div>
          )}
        </div>

        <hr className={`text-stone-500/50 mx-auto transition-all duration-300 w-[80%] ${isCollapsed ? "lg:w-[50%]" : ""}`} />
        
        <div className={`flex justify-center transition-all duration-300 py-3 px-5 ${isCollapsed ? "lg:flex-col lg:items-center lg:gap-1.5 lg:px-2" : "flex-row"}`}>
          <ButtonIconSideBar
            name="Notificações"
            redirect="/notificacoes"
            icon={<BellIcon />}
            isCollapsed={isCollapsed}
            unreadCount={unreadCount}
          />
          <ButtonIconSideBar
            name="Perfil"
            redirect="/perfil"
            icon={<UserCircle2 />}
            isCollapsed={isCollapsed}
          />
          <ButtonIconSideBar
            name="Configurações"
            redirect="/configuracoes"
            icon={<LucideSettings />}
            isCollapsed={isCollapsed}
          />
        </div>

        <div className={`w-full flex flex-col gap-5 p-5 ${isCollapsed ? "lg:px-2 lg:pb-5" : ""}`}>
          {!isAdmin && (
            <>
              <div className="flex flex-col gap-2">
                <h1 className={`text-stone-800/50 font-bold text-sm transition-all duration-300 px-3 ${isCollapsed ? "block lg:hidden" : "block"}`}>
                  Visão Geral
                </h1>
                <ButtonSideBar
                  name="Dashboard"
                  redirect="/dashboard"
                  icon={<LayoutDashboard />}
                  isCollapsed={isCollapsed}
                />
              </div>

              <div className="flex flex-col gap-2">
                <h1 className={`text-stone-800/50 font-bold text-sm transition-all duration-300 px-3 ${isCollapsed ? "block lg:hidden" : "block"}`}>
                  Serviços
                </h1>
                <ButtonSideBar
                  name="Central de Férias"
                  redirect="/ferias"
                  icon={<Palmtree />}
                  isCollapsed={isCollapsed}
                />
                <ButtonSideBar
                  name="Ponto"
                  redirect="/ponto"
                  icon={<CheckCircle />}
                  isCollapsed={isCollapsed}
                />
              </div>

              <div className="flex flex-col gap-2">
                <h1 className={`text-stone-800/50 font-bold text-sm transition-all duration-300 px-3 ${isCollapsed ? "block lg:hidden" : "block"}`}>
                  Comunicação
                </h1>
                <ButtonSideBar
                  name="Chat"
                  redirect="/chat"
                  icon={<MessageCircleMore />}
                  isCollapsed={isCollapsed}
                />
              </div>
            </>
          )}

          {isAdmin && (
            <>
              <div className="flex flex-col gap-2">
                <h1 className={`text-stone-800/50 font-bold text-sm transition-all duration-300 px-3 ${isCollapsed ? "block lg:hidden" : "block"}`}>
                  Visão Geral
                </h1>
                <ButtonSideBar
                  name="DashBoard"
                  redirect="/"
                  icon={<LayoutDashboard />}
                  isCollapsed={isCollapsed}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <h1 className={`text-stone-800/50 font-bold text-sm transition-all duration-300 px-3 ${isCollapsed ? "block lg:hidden" : "block"}`}>
                  Gestão de Pessoas
                </h1>
                <ButtonSideBar
                  name="Colaboradores"
                  redirect="/colaboradores"
                  icon={<Users2 />}
                  isCollapsed={isCollapsed}
                />
                <ButtonSideBar
                  name="Setores"
                  redirect="/setores"
                  icon={<Building2 />}
                  isCollapsed={isCollapsed}
                />
                <ButtonSideBar
                  name="Admissão"
                  redirect="/admissao"
                  icon={<UserRoundPlus />}
                  isCollapsed={isCollapsed}
                />
                <ButtonSideBar
                  name="Onboarding"
                  redirect="/onboarding"
                  icon={<FileCheckCorner />}
                  isCollapsed={isCollapsed}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <h1 className={`text-stone-800/50 font-bold text-sm transition-all duration-300 px-3 ${isCollapsed ? "block lg:hidden" : "block"}`}>
                  Processos
                </h1>
                <ButtonSideBar
                  name="Documentos"
                  redirect="/documentos"
                  icon={<FileSpreadsheet />}
                  isCollapsed={isCollapsed}
                />
              </div>

              <div className="flex flex-col gap-2">
                <h1 className={`text-stone-800/50 font-bold text-sm transition-all duration-300 px-3 ${isCollapsed ? "block lg:hidden" : "block"}`}>
                  Operação
                </h1>
                <ButtonSideBar
                  name="Ponto"
                  redirect="/ponto"
                  icon={<CheckCircle />}
                  isCollapsed={isCollapsed}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <h1 className={`text-stone-800/50 font-bold text-sm transition-all duration-300 px-3 ${isCollapsed ? "block lg:hidden" : "block"}`}>
                  Comunicação
                </h1>
                <ButtonSideBar
                  name="Chat"
                  redirect="/chat"
                  icon={<MessageCircleMore />}
                  isCollapsed={isCollapsed}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
