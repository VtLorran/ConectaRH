"use client";

import { useEffect, useState } from "react";
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  Calendar,
  AlertCircle,
  Inbox
} from "lucide-react";
import Link from "next/link";
import SectionComponent from "@/components/SectionComponent";
import TittleHeader from "@/components/TittleHeader";
import Breadcrumb from "@/components/Breadcrumb";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  
  // Toast notifications feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
      }
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
      showToast("Não foi possível carregar as notificações.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-all-read" })
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        showToast("Todas as notificações foram marcadas como lidas!", "success");
        // Dispatch global update event
        window.dispatchEvent(new Event("notifications-updated"));
      } else {
        showToast(json.message || "Erro ao atualizar notificações.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Erro ao conectar ao servidor.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-read", id })
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        showToast("Notificação marcada como lida.", "success");
        // Dispatch global update event
        window.dispatchEvent(new Event("notifications-updated"));
      }
    } catch (err) {
      console.error(err);
      showToast("Erro ao marcar notificação como lida.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id })
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        showToast("Notificação removida.", "info");
        // Dispatch global update event
        window.dispatchEvent(new Event("notifications-updated"));
      }
    } catch (err) {
      console.error(err);
      showToast("Erro ao excluir notificação.", "error");
    }
  };

  // Agrupar notificações por datas (Hoje, Ontem, Mais Antigas)
  const groupNotifications = () => {
    const today: NotificationItem[] = [];
    const yesterday: NotificationItem[] = [];
    const older: NotificationItem[] = [];

    const now = new Date();
    const todayStr = now.toDateString();
    
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterdayStr = yesterdayDate.toDateString();

    notifications.forEach(item => {
      const itemDate = new Date(item.createdAt);
      const itemDateStr = itemDate.toDateString();

      if (itemDateStr === todayStr) {
        today.push(item);
      } else if (itemDateStr === yesterdayStr) {
        yesterday.push(item);
      } else {
        older.push(item);
      }
    });

    return { today, yesterday, older };
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const { today, yesterday, older } = groupNotifications();
  const hasNotifications = notifications.length > 0;
  const unreadCount = notifications.filter(n => !n.read).length;

  const breadcrumbItems = [
    { label: "Painel", href: "/" },
    { label: "Notificações", href: "/notificacoes" }
  ];

  return (
    <SectionComponent>
      {/* Toast Feedback */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all animate-fade-in
          ${toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : ""}
          ${toast.type === "error" ? "bg-rose-50 border-rose-200 text-rose-800" : ""}
          ${toast.type === "info" ? "bg-blue-50 border-blue-200 text-blue-800" : ""}
        `}>
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Titulo com TittleHeader */}
      <TittleHeader 
        tittle="Notificações" 
        description="Histórico de alertas e comunicados da plataforma" 
        className="w-full"
      />

      {/* Breadcrumbs */}
      <div className="w-full">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Toolbar / Resumo */}
      <div className="w-full bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-800">
              {unreadCount > 0 
                ? `Você possui ${unreadCount} notificações não lidas` 
                : "Você está em dia com todas as suas notificações"}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasNotifications && unreadCount > 0 && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-stone-200/80 shadow-xs">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-sm text-stone-400 font-semibold mt-3 animate-pulse">
              Buscando suas notificações...
            </p>
          </div>
        ) : !hasNotifications ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center text-center p-16 bg-white rounded-3xl border border-stone-200/80 shadow-xs gap-4">
            <div className="p-5 bg-stone-50 text-stone-300 rounded-full">
              <Inbox className="h-16 w-16" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-750">Nenhuma notificação encontrada</h3>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Quando houver atualizações sobre seu ponto, contracheques ou mensagens do RH, elas aparecerão listadas aqui.
              </p>
            </div>
          </div>
        ) : (
          /* Listagem de Notificações */
          <div className="space-y-6">
            {/* Seção: Hoje */}
            {today.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider pl-2">Hoje</h2>
                <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden divide-y divide-stone-100">
                  {today.map(n => (
                    <NotificationRow 
                      key={n.id} 
                      notification={n} 
                      onMarkRead={handleMarkSingleRead} 
                      onDelete={handleDelete}
                      time={formatTime(n.createdAt)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Seção: Ontem */}
            {yesterday.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider pl-2">Ontem</h2>
                <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden divide-y divide-stone-100">
                  {yesterday.map(n => (
                    <NotificationRow 
                      key={n.id} 
                      notification={n} 
                      onMarkRead={handleMarkSingleRead} 
                      onDelete={handleDelete}
                      time={formatTime(n.createdAt)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Seção: Anteriores */}
            {older.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider pl-2">Anteriores</h2>
                <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden divide-y divide-stone-100">
                  {older.map(n => (
                    <NotificationRow 
                      key={n.id} 
                      notification={n} 
                      onMarkRead={handleMarkSingleRead} 
                      onDelete={handleDelete}
                      time={`${formatDate(n.createdAt)} às ${formatTime(n.createdAt)}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionComponent>
  );
}

interface NotificationRowProps {
  notification: NotificationItem;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  time: string;
}

function NotificationRow({ notification, onMarkRead, onDelete, time }: NotificationRowProps) {
  return (
    <div className={`flex items-start gap-4 p-5 hover:bg-stone-50/50 transition-colors group relative
      ${!notification.read ? "bg-blue-50/10" : ""}
    `}>
      {/* Indicador de Status Não Lido */}
      <div className="pt-1.5 shrink-0">
        <div className={`h-2.5 w-2.5 rounded-full transition-colors
          ${!notification.read ? "bg-blue-500 shadow-sm shadow-blue-500/20" : "bg-transparent"}
        `} />
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <h3 className={`text-sm font-semibold text-stone-850 truncate leading-snug
            ${!notification.read ? "font-bold text-stone-900" : ""}
          `}>
            {notification.title}
          </h3>
          <span className="text-[11px] font-semibold text-stone-400 shrink-0 select-none whitespace-nowrap mt-0.5">
            {time}
          </span>
        </div>
        <p className="text-xs text-stone-500 leading-relaxed mt-1 pr-6">
          {notification.description}
        </p>

        {/* Botão de Redirecionamento (Condicional) */}
        {notification.link && (
          <div className="mt-3 flex">
            <Link
              href={notification.link}
              onClick={() => {
                if (!notification.read) {
                  onMarkRead(notification.id);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-blue-600 hover:text-white transition-colors duration-200 text-stone-700 text-[11px] font-bold rounded-lg"
            >
              Acessar funcionalidade
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Ações Individuais (Visíveis no Hover) */}
      <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity pl-2 shrink-0">
        {!notification.read && (
          <button
            type="button"
            onClick={() => onMarkRead(notification.id)}
            title="Marcar como lida"
            className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <CheckCheck className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(notification.id)}
          title="Excluir notificação"
          className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
