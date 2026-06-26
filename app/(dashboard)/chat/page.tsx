"use client";

import { useEffect, useState, useRef } from "react";
import {
  MessageSquare,
  Send,
  Search,
  Filter,
  Clock,
  User,
  AlertTriangle,
  Building2,
  Users,
  Shield,
  Loader2,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
}

interface JobPosition {
  name: string;
  department: {
    id: string;
    name: string;
  };
}

interface ChatContact {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  jobPosition?: JobPosition | null;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Dados da barra lateral
  const [recentChats, setRecentChats] = useState<ChatContact[]>([]);
  const [allUsers, setAllUsers] = useState<ChatContact[]>([]);
  const [admins, setAdmins] = useState<ChatContact[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");

  // Conversa ativa
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Controle de Abas no Mobile (Contatos vs Mensagens)
  const [activeTab, setActiveTab] = useState<"contacts" | "chat">("contacts");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Carrega informações iniciais
  const fetchChatData = async () => {
    try {
      // 1. Pega usuário atual
      const profileRes = await fetch("/api/auth/me");
      const profileData = await profileRes.json();
      if (profileData.success && profileData.data) {
        setCurrentUser({
          id: profileData.data.id,
          role: profileData.data.role,
          name: profileData.data.name,
        });
      } else {
        window.location.href = "/login";
        return;
      }

      // 2. Pega contatos
      const chatRes = await fetch("/api/chat");
      const chatData = await chatRes.json();
      if (chatData.success) {
        setRecentChats(chatData.recentChats || []);
        if (chatData.role === "ADMIN") {
          setAllUsers(chatData.allUsers || []);
          setDepartments(chatData.departments || []);
        } else {
          setAdmins(chatData.admins || []);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do chat:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatData();

    // Atualiza a barra lateral a cada 10 segundos
    const sidebarInterval = setInterval(() => {
      fetchChatData();
    }, 10000);

    return () => {
      clearInterval(sidebarInterval);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Rola até o final das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carrega mensagens do contato selecionado
  const fetchMessages = async (contactId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/messages?userId=${contactId}`);
      const result = await res.json();
      if (result.success) {
        setMessages(result.data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Efeito ao selecionar contato (ativa Polling de 4 segundos na conversa ativa)
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (selectedContact) {
      fetchMessages(selectedContact.id, false);

      pollingRef.current = setInterval(() => {
        fetchMessages(selectedContact.id, true);
      }, 4000);
    } else {
      setMessages([]);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [selectedContact]);

  // Enviar mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage(""); // Limpa o input rapidamente
    setSending(true);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedContact.id,
          content: messageText,
        }),
      });

      const result = await res.json();
      if (result.success) {
        // Adiciona à lista de mensagens locais imediatamente
        setMessages((prev) => [...prev, result.data]);
        // Atualiza a barra lateral para mover a conversa para o topo
        fetchChatData();
      } else {
        alert(result.message || "Erro ao enviar mensagem");
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      alert("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  // Formata a data/hora das mensagens
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // Filtra contatos de acordo com a busca e setor
  const getFilteredContacts = () => {
    const isUserAdmin = currentUser?.role === "ADMIN";
    const baseContacts = isUserAdmin ? allUsers : admins;

    return baseContacts.filter((contact) => {
      const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!isUserAdmin) return matchesSearch; // Usuários comuns não têm filtro de setor

      const contactDeptId = contact.jobPosition?.department?.id || "";
      const matchesDept = selectedSector === "all" || contactDeptId === selectedSector;

      return matchesSearch && matchesDept;
    });
  };

  const filteredContacts = getFilteredContacts();

  // Inicia ou seleciona uma conversa
  const handleSelectContact = (contact: ChatContact) => {
    setSelectedContact(contact);
    setActiveTab("chat");
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-stone-500 font-semibold text-sm animate-pulse">Carregando o chat...</p>
        </div>
      </div>
    );
  }

  const isUserAdmin = currentUser?.role === "ADMIN";

  return (
    <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] w-full max-w-[1400px] mx-auto overflow-hidden bg-white md:rounded-3xl md:border md:border-stone-200/60 md:shadow-xl max-md:-mx-5 max-md:-my-5 max-md:h-[calc(100vh-64px)] max-md:h-[calc(100dvh-64px)] max-md:w-[calc(100%+2.5rem)] max-md:rounded-none max-md:border-none">
      {/* PAINEL ESQUERDO: Lista de Contatos/Conversas */}
      <div
        className={`w-full md:w-[350px] lg:w-[400px] shrink-0 border-r border-stone-200/80 flex flex-col bg-stone-50/50 ${
          activeTab === "chat" ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Cabeçalho de Contatos */}
        <div className="p-4 border-b border-stone-200/85 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-stone-800 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Mensagens
            </h1>
            <span className="text-xs font-semibold px-2 py-1 bg-stone-100 text-stone-600 rounded-full border border-stone-200">
              {isUserAdmin ? "Painel Gestão" : "Falar com Admin"}
            </span>
          </div>

          {/* Campo de Pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-stone-400" />
            <input
              type="text"
              placeholder="Pesquisar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 bg-stone-50/80 transition-all"
            />
          </div>

          {/* Filtro de Setor (Exclusivo Admin) */}
          {isUserAdmin && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-stone-500 shrink-0" />
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full py-1.5 px-3 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/25 bg-white text-stone-600 cursor-pointer transition-all"
              >
                <option value="all">Todos os setores</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Listagem de Contatos e Chats */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 no-scrollbar">
          {/* Conversas Recentes */}
          {recentChats.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-stone-400 px-3 mb-2 tracking-wider uppercase">
                Conversas Recentes
              </h2>
              <div className="space-y-1">
                {recentChats
                  .filter((contact) => {
                    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
                    if (!isUserAdmin) return matchesSearch;
                    const contactDeptId = contact.jobPosition?.department?.id || "";
                    const matchesDept = selectedSector === "all" || contactDeptId === selectedSector;
                    return matchesSearch && matchesDept;
                  })
                  .map((contact) => {
                    const isSelected = selectedContact?.id === contact.id;
                    const initials = contact.name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase();

                    return (
                      <button
                        key={`recent-${contact.id}`}
                        onClick={() => handleSelectContact(contact)}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all duration-200 cursor-pointer border ${
                          isSelected
                            ? "bg-blue-50 border-blue-100 text-blue-900 shadow-xs"
                            : "bg-transparent border-transparent hover:bg-stone-100/80 text-stone-700"
                        }`}
                      >
                        {/* Avatar */}
                        <div className="h-11 w-11 rounded-full overflow-hidden border border-stone-200 bg-stone-100 shrink-0 flex items-center justify-center text-sm font-semibold text-stone-600">
                          {contact.avatar ? (
                            <img
                              src={contact.avatar}
                              alt={contact.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </div>

                        {/* Informações */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-sm truncate">
                              {contact.name}
                            </span>
                            {contact.lastMessage && (
                              <span className="text-[10px] text-stone-400 shrink-0">
                                {formatTime(contact.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          
                          {/* Cargo/Setor */}
                          <div className="flex items-center gap-1 text-[11px] text-stone-400 truncate">
                            {contact.role === "ADMIN" ? (
                              <span className="text-blue-500 font-medium flex items-center gap-0.5">
                                <Shield className="h-3 w-3 shrink-0" />
                                Admin (RH/DP)
                              </span>
                            ) : (
                              <span>
                                {contact.jobPosition?.name || "Colaborador"} • {contact.jobPosition?.department?.name || "Geral"}
                              </span>
                            )}
                          </div>

                          {/* Última Mensagem */}
                          {contact.lastMessage && (
                            <p className={`text-xs truncate mt-0.5 ${
                              isSelected ? "text-blue-700/85" : "text-stone-500"
                            }`}>
                              {contact.lastMessage.senderId === currentUser?.id ? "Você: " : ""}
                              {contact.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Novos Contatos / Todos os Colaboradores */}
          <div>
            <h2 className="text-xs font-bold text-stone-400 px-3 mb-2 mt-2 tracking-wider uppercase">
              {isUserAdmin ? "Todos os Colaboradores" : "Administradores Disponíveis"}
            </h2>
            <div className="space-y-1">
              {filteredContacts.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-stone-400">Nenhum contato encontrado.</p>
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  // Evita listar nos contatos novos quem já está listado nos recentes
                  const isAlreadyRecent = recentChats.some((rc) => rc.id === contact.id);
                  if (isAlreadyRecent) return null;

                  const isSelected = selectedContact?.id === contact.id;
                  const initials = contact.name
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <button
                      key={`all-${contact.id}`}
                      onClick={() => handleSelectContact(contact)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all duration-200 cursor-pointer border ${
                        isSelected
                          ? "bg-blue-50 border-blue-100 text-blue-900 shadow-xs"
                          : "bg-transparent border-transparent hover:bg-stone-100/80 text-stone-700"
                      }`}
                    >
                      <div className="h-11 w-11 rounded-full overflow-hidden border border-stone-200 bg-stone-100 shrink-0 flex items-center justify-center text-sm font-semibold text-stone-600">
                        {contact.avatar ? (
                          <img
                            src={contact.avatar}
                            alt={contact.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm truncate block">
                          {contact.name}
                        </span>
                        
                        <div className="flex items-center gap-1 text-[11px] text-stone-400 truncate">
                          {contact.role === "ADMIN" ? (
                            <span className="text-blue-500 font-medium flex items-center gap-0.5">
                              <Shield className="h-3 w-3 shrink-0" />
                              Admin (RH/DP)
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <Building2 className="h-3 w-3 text-stone-400 shrink-0" />
                              {contact.jobPosition?.name || "Colaborador"} • {contact.jobPosition?.department?.name || "Geral"}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PAINEL DIREITO: Janela de Chat */}
      <div
        className={`flex-1 flex flex-col bg-white ${
          activeTab === "contacts" ? "hidden md:flex" : "flex"
        }`}
      >
        {selectedContact ? (
          <>
            {/* Cabeçalho do Chat */}
            <div className="p-4 border-b border-stone-200/85 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Botão Voltar (Apenas Mobile) */}
                <button
                  onClick={() => setActiveTab("contacts")}
                  className="md:hidden p-2 hover:bg-stone-100 rounded-xl text-stone-600 cursor-pointer mr-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                    />
                  </svg>
                </button>

                {/* Avatar */}
                <div className="h-11 w-11 rounded-full overflow-hidden border border-stone-200 bg-stone-100 shrink-0 flex items-center justify-center text-sm font-semibold text-stone-600">
                  {selectedContact.avatar ? (
                    <img
                      src={selectedContact.avatar}
                      alt={selectedContact.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    selectedContact.name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-stone-800 text-sm md:text-base truncate">
                    {selectedContact.name}
                  </h3>
                  <p className="text-xs text-stone-400 truncate flex items-center gap-1">
                    {selectedContact.role === "ADMIN" ? (
                      <span className="text-blue-500 font-semibold flex items-center gap-0.5">
                        <Shield className="h-3.5 w-3.5 shrink-0" />
                        Administrador ConectaRH (RH/DP)
                      </span>
                    ) : (
                      <span>
                        {selectedContact.jobPosition?.name || "Colaborador"} • {selectedContact.jobPosition?.department?.name || "Geral"}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-stone-400 font-medium bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg">
                  <Clock className="h-3 w-3 text-stone-400" />
                  Limpeza automática
                </span>
              </div>
            </div>

            {/* Aviso de Mensagens Temporárias (3 dias) */}
            <div className="bg-amber-50/70 border-b border-amber-100 px-4 py-2.5 flex items-start gap-2 text-amber-800 text-[11px] md:text-xs leading-relaxed font-medium">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Aviso de Limpeza:</strong> Para manter o sistema rápido e seguro, as mensagens do chat são temporárias e serão excluídas permanentemente do banco após <strong>3 dias</strong> de envio.
              </span>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 bg-stone-50/50 space-y-4 no-scrollbar">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-stone-400 space-y-2">
                  <MessageSquare className="h-10 w-10 text-stone-300 animate-pulse" />
                  <p className="text-sm font-medium">Nenhuma mensagem ainda.</p>
                  <p className="text-xs max-w-xs leading-relaxed">
                    Envie uma mensagem abaixo para iniciar a conversa! Ela ficará disponível por 3 dias.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {messages.map((msg) => {
                    const isMine = msg.senderId === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2.5 text-sm shadow-xs transition-all relative ${
                            isMine
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : "bg-white text-stone-800 border border-stone-200/80 rounded-tl-none"
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                          <div
                            className={`text-[9px] mt-1 text-right select-none ${
                              isMine ? "text-blue-100" : "text-stone-400"
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input de Envio de Mensagem */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 md:p-4 border-t border-stone-200 bg-white flex items-center gap-3 shrink-0"
            >
              <input
                type="text"
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
                className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 bg-stone-50/80 transition-all placeholder-stone-400"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:scale-100 flex items-center justify-center cursor-pointer shrink-0"
              >
                {sending ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <Send className="h-4.5 w-4.5" />
                )}
              </button>
            </form>
          </>
        ) : (
          /* Estado Vazio (Sem chat selecionado) */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 md:p-8 bg-stone-50/30 overflow-y-auto max-h-full">
            <div className="h-12 w-12 md:h-16 md:w-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-xs mb-3 md:mb-4 shrink-0">
              <MessageSquare className="h-6 w-6 md:h-8 md:w-8" />
            </div>
            <h2 className="text-base md:text-lg font-bold text-stone-800">Selecione uma conversa</h2>
            <p className="text-xs md:text-sm text-stone-500 max-w-sm mt-1 leading-relaxed">
              {isUserAdmin
                ? "Escolha um contato na lista ao lado para iniciar ou continuar um chat com qualquer colaborador da empresa."
                : "Escolha um administrador na lista ao lado para tirar suas dúvidas com o Recursos Humanos ou Departamento Pessoal."}
            </p>
            
            <div className="mt-6 md:mt-8 border border-amber-200 bg-amber-50/50 rounded-2xl p-3 md:p-4 max-w-md flex gap-2 md:gap-3 text-left shrink-0">
              <AlertTriangle className="h-4.5 w-4.5 md:h-5 md:w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[11px] md:text-xs font-bold text-amber-800 uppercase tracking-wider">Aviso importante</h4>
                <p className="text-[10px] md:text-xs text-amber-800/85 mt-0.5 md:mt-1 leading-relaxed">
                  Todas as conversas neste chat são temporárias e mantidas no banco de dados por um prazo limite de <strong>3 dias</strong>. Após esse período, as mensagens são excluídas permanentemente.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
