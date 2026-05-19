import conecta from "@/public/conectaRH_horizontal.png";
import {
  BellIcon,
  CheckCircle,
  FileCheckCorner,
  FileSpreadsheet,
  LayoutDashboard,
  LucideSettings,
  MessageCircleMore,
  UserCircle2,
  UserRoundPlus,
  Users2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Tooltip from "@/components/Tooltip";
import { usePathname } from "next/navigation";

interface PropsButtonSideBar {
  icon: React.ReactNode;
  name: string;
  redirect: string;
}

export function ButtonIconSideBar({
  icon,
  name,
  redirect,
}: PropsButtonSideBar) {
  return (
    <Link
      href={redirect}
      className="relative flex items-center justify-center p-3 rounded-lg text-slate-300  hover:text-white transition-all duration-200 group"
    >
      <div className="text-xl text-slate-600 group-hover:text-blue-400 transition-colors">
        {icon}
      </div>

      <Tooltip text={name} />
    </Link>
  );
}

export function ButtonSideBar({ icon, name, redirect }: PropsButtonSideBar) {
  const pathname = usePathname();

  // Verifica se a rota atual começa com o link do botão (evita bugs com sub-rotas)
  const isActive = pathname === redirect;

  return (
    <Link
      href={redirect}
      className={`relative flex items-center gap-3 p-3 rounded-lg font-medium transition-all duration-200
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
        className={`text-xl transition-colors ${isActive ? "text-blue-500" : "text-slate-400"}`}
      >
        {icon}
      </div>

      {/* Nome */}
      <span className="text-sm">{name}</span>
    </Link>
  );
}

interface SideBarProps {
  isAdmin?: boolean;
}

export default function SideBar({ isAdmin = true }: SideBarProps) {
  return (
    <section
      className="
    flex flex-col items-center
    h-screen bg-white shadow-r-2xl w-64 shrink-0"
    >
      {/* Div da imagem  */}
      <div className="px-12 pt-12 pb-6">
        <Image
          src={conecta}
          alt="ConectaRH"
          height={150}
          width={150}
          priority
          className="h-auto w-auto"
        />
      </div>

      <hr className="w-[80%] text-stone-500/50" />
      <div className="flex">
        <ButtonIconSideBar
          name="Notificações"
          redirect="/notificacoes"
          icon={<BellIcon />}
        />
        <ButtonIconSideBar
          name="Perfil"
          redirect="/perfil"
          icon={<UserCircle2 />}
        />
        <ButtonIconSideBar
          name="Configurações"
          redirect="/configuracoes"
          icon={<LucideSettings />}
        />
      </div>

      {isAdmin && (
        <div className="w-full p-5 flex flex-col gap-5 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <h1 className="text-stone-800/50 font-bold text-sm">
              Visão Geral
            </h1>
            <ButtonSideBar
              name="DashBoard"
              redirect="/"
              icon={<LayoutDashboard />}
            />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-stone-800/50 font-bold text-sm">
              Gestão de Pessoas
            </h1>
            <ButtonSideBar
              name="Colaboradores"
              redirect="/colaboradores"
              icon={<Users2 />}
            />
            <ButtonSideBar
              name="Admissão"
              redirect="/admissao"
              icon={<UserRoundPlus />}
            />
            <ButtonSideBar
              name="Onboarding"
              redirect="/onboarding"
              icon={<FileCheckCorner />}
            />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-stone-800/50 font-bold text-sm">Processos</h1>
            <ButtonSideBar
              name="Documentos"
              redirect="/documentos"
              icon={<FileSpreadsheet />}
            />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-stone-800/50 font-bold text-sm">Operação</h1>
            <ButtonSideBar
              name="Ponto"
              redirect="/ponto"
              icon={<CheckCircle />}
            />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-stone-800/50 font-bold text-sm">Comunicação</h1>
            <ButtonSideBar
              name="Chat"
              redirect="/chat"
              icon={<MessageCircleMore />}
            />
          </div>
        </div>
      )}
    </section>
  );
}
