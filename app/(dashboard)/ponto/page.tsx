"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  QrCode,
  Building2,
  Users,
  Search,
  Lock,
  User,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Loader2,
  X,
  ShieldAlert,
  ArrowLeftRight,
  Filter,
} from "lucide-react";
import SectionComponent from "@/components/SectionComponent";
import TittleHeader from "@/components/TittleHeader";
import Breadcrumb from "@/components/Breadcrumb";
import Modal from "@/components/Modal";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";

interface Pause {
  id: string;
  startTime: string;
  endTime: string | null;
  pauseCategoryId: string;
  pauseCategory: {
    name: string;
    duration: number;
  };
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  cpf: string;
  avatar: string | null;
  jobPosition?: {
    name: string;
    department?: {
      name: string;
    };
  } | null;
}

interface TimeRecord {
  id: string;
  userId: string;
  date: string;
  entryTime: string | null;
  exitTime: string | null;
  user: Collaborator;
  pauses: Pause[];
}

interface Sector {
  id: string;
  name: string;
  description: string | null;
}

interface PauseCategory {
  id: string;
  name: string;
  duration: number;
}

export default function PontoPage() {
  // Navigation / Tab states (Admin only)
  const [activeTab, setActiveTab] = useState<"geral" | "setor">("geral");
  const [selectedSectorId, setSelectedSectorId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data states
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [pauseCategories, setPauseCategories] = useState<PauseCategory[]>([]);
  const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Kiosk / Totem states (Used by Admins to host kiosk)
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [kioskClock, setKioskClock] = useState<Date | null>(null);
  const [qrToken, setQrToken] = useState("");
  const [qrCountdown, setQrCountdown] = useState(10);

  // Kiosk Entry/Exit password modal
  const [showEnterAuthModal, setShowEnterAuthModal] = useState(false);
  const [showExitAuthModal, setShowExitAuthModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Collaborator Camera Scanner states
  const [scanning, setScanning] = useState(false);
  const [scannerInstance, setScannerInstance] = useState<any>(null);
  const [scannerError, setScannerError] = useState("");
  const [scannedQrToken, setScannedQrToken] = useState("");
  
  // Collaborator Point Registration Modal
  const [showConfirmRecordModal, setShowConfirmRecordModal] = useState(false);
  const [recordType, setRecordType] = useState<string>("entry");
  const [registeringPoint, setRegisteringPoint] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  // Fetch initial profile, point logs, sectors, and categories
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Fetch current logged in user details
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        throw new Error("Erro ao autenticar usuário.");
      }
      const userData = await userRes.json();
      const userProfile = userData.success ? userData.data : null;
      setCurrentUser(userProfile);

      // 2. Fetch point records (Returns all for admin, returns own for collaborator)
      const pointsRes = await fetch("/api/ponto");
      if (!pointsRes.ok) {
        throw new Error("Erro ao buscar registros de ponto.");
      }
      const pointsData = await pointsRes.json();
      if (pointsData.success) {
        setTimeRecords(pointsData.data);
      } else {
        throw new Error(pointsData.message || "Erro ao carregar registros.");
      }

      // 3. Fetch sectors (Admin only)
      if (userProfile && userProfile.role === "ADMIN") {
        const sectorsRes = await fetch("/api/setores");
        if (sectorsRes.ok) {
          const sectorsData = await sectorsRes.json();
          if (Array.isArray(sectorsData)) {
            setSectors(sectorsData);
            if (sectorsData.length > 0) {
              setSelectedSectorId(sectorsData[0].id);
            }
          }
        }
      }

      // 4. Fetch Pause Categories (For registration options)
      const catRes = await fetch("/api/ponto/categorias");
      if (catRes.ok) {
        const catData = await catRes.json();
        if (catData.success && Array.isArray(catData.data)) {
          setPauseCategories(catData.data);
        }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Load html5-qrcode scanner script dynamically from unpkg CDN
    if (typeof window !== "undefined" && !(window as any).Html5Qrcode) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/html5-qrcode";
      script.async = true;
      document.body.appendChild(script);
    }

    // Check kiosk cache for 7 days
    const kioskExpires = localStorage.getItem("ponto_kiosk_expires");
    if (kioskExpires) {
      const expiresTime = parseInt(kioskExpires, 10);
      if (!isNaN(expiresTime) && Date.now() < expiresTime) {
        setIsKioskMode(true);
      } else {
        localStorage.removeItem("ponto_kiosk_expires");
      }
    }
  }, []);

  // Kiosk mode clock and QR countdown loops
  useEffect(() => {
    if (!isKioskMode) return;

    setKioskClock(new Date());

    const clockInterval = setInterval(() => {
      setKioskClock(new Date());
    }, 1000);

    const generateNewQR = () => {
      const randToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const payload = {
        type: "kiosk-ponto",
        timestamp: Date.now(),
        token: randToken,
        company: "ConectaRH",
      };
      setQrToken(JSON.stringify(payload));
    };
    generateNewQR();

    const countdownInterval = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          generateNewQR();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(countdownInterval);
    };
  }, [isKioskMode]);

  // Camera Scanner controls for Collaborator
  const startScanner = () => {
    setScanning(true);
    setScannerError("");
    setScannedQrToken("");

    setTimeout(() => {
      try {
        if (typeof window !== "undefined" && (window as any).Html5Qrcode) {
          const html5QrCode = new (window as any).Html5Qrcode("qr-reader");
          setScannerInstance(html5QrCode);

          html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText: string) => {
              // Successfully read QR Code!
              setScannedQrToken(decodedText);

              // Stop scanner immediately
              html5QrCode.stop().then(() => {
                setScanning(false);
                setScannerInstance(null);
                
                // Show registration modal and default options
                setShowConfirmRecordModal(true);
              }).catch(err => console.error("Erro ao parar scanner:", err));
            },
            (errorMessage: string) => {
              // Verbose scan errors, safe to ignore
            }
          ).catch((err: any) => {
            console.error("Erro ao iniciar câmera:", err);
            setScannerError("Permissão de câmera negada ou nenhuma câmera encontrada.");
          });
        } else {
          setScannerError("Carregando o leitor de QR Code, por favor tente novamente em segundos.");
        }
      } catch (err) {
        console.error(err);
        setScannerError("Erro ao inicializar o leitor de câmera.");
      }
    }, 200);
  };

  const stopScanner = () => {
    if (scannerInstance) {
      scannerInstance.stop().then(() => {
        setScanning(false);
        setScannerInstance(null);
      }).catch((err: any) => {
        console.error("Erro ao parar câmera:", err);
        setScanning(false);
        setScannerInstance(null);
      });
    } else {
      setScanning(false);
    }
  };

  // Dynamic selector options based on today's state
  const getRecordTypeOptions = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayRecord = timeRecords.find(r => r.date.startsWith(todayStr));

    const options: { value: string; label: string }[] = [];

    if (!todayRecord || !todayRecord.entryTime) {
      options.push({ value: "entry", label: "Registrar Entrada" });
    } else {
      if (!todayRecord.exitTime) {
        options.push({ value: "exit", label: "Registrar Saída" });

        // Add pause options (Start / End depending on whether there's an open pause)
        pauseCategories.forEach((cat) => {
          const isActive = todayRecord.pauses?.some(
            p => p.pauseCategoryId === cat.id && !p.endTime
          );

          if (isActive) {
            options.push({ value: `pause_${cat.id}`, label: `Finalizar Pausa: ${cat.name}` });
          } else {
            options.push({ value: `pause_${cat.id}`, label: `Iniciar Pausa: ${cat.name}` });
          }
        });
      }
    }

    return options;
  };

  // Automatically select the first valid option when the modal is shown
  useEffect(() => {
    if (showConfirmRecordModal) {
      const options = getRecordTypeOptions();
      if (options.length > 0) {
        setRecordType(options[0].value);
      }
    }
  }, [showConfirmRecordModal]);

  // Submit point registration
  const submitPointRegistration = async () => {
    setRegisterError("");
    setRegisterSuccess("");
    setRegisteringPoint(true);

    try {
      const typeParam = recordType.startsWith("pause_") ? "pause" : recordType;
      const pauseCategoryId = recordType.startsWith("pause_") ? recordType.replace("pause_", "") : undefined;

      const res = await fetch("/api/ponto/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrToken: scannedQrToken,
          type: typeParam,
          pauseCategoryId,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Erro ao registrar ponto.");
      }

      setRegisterSuccess(result.message || "Ponto registrado com sucesso!");
      
      // Refresh logs after 1.5 seconds and close modal
      setTimeout(() => {
        setShowConfirmRecordModal(false);
        setRegisterSuccess("");
        fetchData();
      }, 1500);

    } catch (err: any) {
      setRegisterError(err.message || "Erro ao registrar ponto.");
    } finally {
      setRegisteringPoint(false);
    }
  };

  // Handle entering Totem Mode
  const handleEnterKioskAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSubmitting(true);

    try {
      const res = await fetch("/api/ponto/verify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Senha incorreta");
      }

      // Successful login - persist for 7 days
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem("ponto_kiosk_expires", (Date.now() + sevenDaysInMs).toString());
      
      setAdminPassword("");
      setShowEnterAuthModal(false);
      setIsKioskMode(true);
    } catch (err: any) {
      setAuthError(err.message || "Erro na verificação da senha.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Handle exiting Totem Mode
  const handleExitKioskAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSubmitting(true);

    try {
      const res = await fetch("/api/ponto/verify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Senha incorreta");
      }

      // Exit kiosk and clear storage
      localStorage.removeItem("ponto_kiosk_expires");
      setAdminPassword("");
      setShowExitAuthModal(false);
      setIsKioskMode(false);
      
      // Refresh logs
      fetchData();
    } catch (err: any) {
      setAuthError(err.message || "Erro na verificação da senha.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Helper formatting functions
  const formatTime = (isoString: string | null) => {
    if (!isoString) return "--:--";
    const date = new Date(isoString);
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return adjustedDate.toLocaleDateString("pt-BR");
  };

  const calculateTotalPauses = (pauses: Pause[]) => {
    let totalMinutes = 0;
    pauses.forEach((pause) => {
      if (pause.startTime && pause.endTime) {
        const start = new Date(pause.startTime).getTime();
        const end = new Date(pause.endTime).getTime();
        totalMinutes += Math.round((end - start) / 60000);
      }
    });
    return totalMinutes > 0 ? `${totalMinutes} min` : "Sem pausas";
  };

  // Filtering point logs (Admin only)
  const getFilteredRecords = () => {
    return timeRecords.filter((record) => {
      // Tab filter
      if (activeTab === "setor" && selectedSectorId) {
        const userDeptId = record.user.jobPosition?.department?.name;
        const targetDeptName = sectors.find((s) => s.id === selectedSectorId)?.name;
        if (userDeptId !== targetDeptName) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = record.user.name.toLowerCase().includes(query);
        const cpfMatch = record.user.cpf.replace(/\D/g, "").includes(query.replace(/\D/g, ""));
        const sectorMatch = record.user.jobPosition?.department?.name.toLowerCase().includes(query) || false;
        const positionMatch = record.user.jobPosition?.name.toLowerCase().includes(query) || false;
        return nameMatch || cpfMatch || sectorMatch || positionMatch;
      }

      return true;
    });
  };

  const filteredRecords = getFilteredRecords();

  // Loading screen before user role is resolved
  if (loading && !currentUser) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
        <p className="text-stone-500 font-semibold text-xs animate-pulse">Carregando informações...</p>
      </div>
    );
  }

  // If in kiosk mode, render the full-screen kiosk view
  if (isKioskMode) {
    const formattedKioskTime = kioskClock
      ? kioskClock.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : "00:00:00";

    const formattedKioskDate = kioskClock
      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(kioskClock)
      : "";

    const capitalizedKioskDate = formattedKioskDate
      ? formattedKioskDate.charAt(0).toUpperCase() + formattedKioskDate.slice(1)
      : "";

    return (
      <div className="fixed inset-0 bg-[#0F172A] text-white flex flex-col justify-between items-center py-12 px-6 z-[9999] animate-fade-in font-sans overflow-hidden select-none">
        {/* Animated background highlights */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />

        {/* Top Header */}
        <div className="w-full max-w-4xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
              <Clock className="h-6 w-6 text-blue-400 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-[linear-gradient(to_right,#60a5fa,#2dd4bf)] bg-clip-text text-transparent">
                ConectaRH
              </span>
              <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                Terminal de Ponto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-2xl text-xs font-bold tracking-wide shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping mr-1" />
            Sistema Online
          </div>
        </div>

        {/* Clock & Date View */}
        <div className="flex flex-col items-center justify-center text-center gap-4 z-10 w-full max-w-2xl px-4 mt-4">
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tight text-white font-mono drop-shadow-md select-all">
            {formattedKioskTime}
          </h1>
          <p className="text-stone-300 font-semibold text-lg sm:text-xl drop-shadow-sm max-w-xl">
            {capitalizedKioskDate}
          </p>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center z-10 my-4">
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 to-teal-400 rounded-3xl blur opacity-30 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            
            <div className="relative w-80 h-80 bg-white rounded-3xl p-6 shadow-2xl border border-stone-800/20 flex items-center justify-center flex-col gap-4">
              {qrToken ? (
                <div className="relative flex items-center justify-center w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=0f172a&data=${encodeURIComponent(qrToken)}`}
                    alt="QR Code de Ponto"
                    className="w-[230px] h-[230px] object-contain select-none"
                    draggable={false}
                  />
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.8)] rounded-full animate-scan pointer-events-none" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                  <p className="text-stone-500 font-bold text-xs uppercase tracking-wider">Gerando token...</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-6 bg-slate-800/80 border border-slate-700/50 px-4 py-2 rounded-2xl shadow-lg">
            <span className="text-stone-400 text-xs font-bold uppercase tracking-wider">Novo QR Code em:</span>
            <span className="bg-blue-500/20 text-blue-400 w-7 h-7 rounded-xl flex items-center justify-center font-bold text-sm border border-blue-500/20 font-mono">
              {qrCountdown}
            </span>
          </div>
        </div>

        {/* Bottom Instruction and Exit button */}
        <div className="w-full max-w-md flex flex-col items-center gap-6 z-10 text-center px-4">
          <p className="text-stone-400 text-sm leading-relaxed max-w-sm">
            Abra a câmera do seu celular no app <strong className="text-stone-200">ConectaRH</strong> e escaneie o código para registrar sua entrada ou saída.
          </p>

          <button
            onClick={() => {
              setAuthError("");
              setAdminPassword("");
              setShowExitAuthModal(true);
            }}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 px-8 rounded-2xl transition-all border border-slate-700/50 shadow-md active:scale-95 text-xs tracking-wider uppercase cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Painel
          </button>
        </div>

        {/* Exit Authentication Overlay Modal */}
        {showExitAuthModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowExitAuthModal(false)} />
            
            <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 text-left shadow-2xl transition-all z-10 text-slate-100 animate-scale-up">
              <button
                onClick={() => setShowExitAuthModal(false)}
                className="absolute top-5 right-5 rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Segurança do Kiosk</h3>
                  <p className="text-stone-500 text-xs mt-0.5">Insira as credenciais de admin para fechar o totem.</p>
                </div>
              </div>

              <form onSubmit={handleExitKioskAuth} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    Senha do Administrador
                  </label>
                  <InputField
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    disabled={authSubmitting}
                    icon={<Lock className="text-slate-500" size={18} />}
                    classNameDiv="bg-slate-950 border-slate-800/80 !text-slate-200 focus-within:border-blue-500"
                    classNameInput="placeholder-slate-600"
                    required
                  />
                </div>

                {authError && (
                  <div className="text-xs text-rose-400 flex items-center gap-2 bg-rose-500/10 p-3.5 rounded-2xl border border-rose-500/20 mt-1">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-4 border-t border-slate-800 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowExitAuthModal(false)}
                    disabled={authSubmitting}
                    className="px-5 py-3 rounded-2xl border border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold py-3 px-6 rounded-2xl shadow-md transition-all active:scale-95 text-xs tracking-wider uppercase cursor-pointer"
                  >
                    {authSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      "Confirmar Saída"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- COLLABORATOR VIEW ---
  if (currentUser && currentUser.role !== "ADMIN") {
    // Find today's point record
    const todayStr = new Date().toISOString().split("T")[0];
    const todayRecord = timeRecords.find(r => r.date.startsWith(todayStr));

    // Resolve today's point state
    let statusText = "Não Iniciado";
    let statusColor = "bg-stone-100 text-stone-600 border-stone-200";
    let statusIcon = <Calendar className="h-4 w-4" />;

    if (todayRecord) {
      if (todayRecord.exitTime) {
        statusText = "Finalizado";
        statusColor = "bg-purple-50 text-purple-600 border-purple-100";
        statusIcon = <CheckCircle2 className="h-4 w-4" />;
      } else if (todayRecord.pauses?.some(p => !p.endTime)) {
        statusText = "Em Pausa";
        statusColor = "bg-orange-50 text-orange-600 border-orange-100 animate-pulse";
        statusIcon = <Clock className="h-4 w-4" />;
      } else {
        statusText = "Trabalhando";
        statusColor = "bg-blue-50 text-blue-600 border-blue-100";
        statusIcon = <Clock className="h-4 w-4 animate-spin" style={{ animationDuration: "3s" }} />;
      }
    }

    const todayEntry = todayRecord?.entryTime ? formatTime(todayRecord.entryTime) : "--:--";
    const todayExit = todayRecord?.exitTime ? formatTime(todayRecord.exitTime) : "--:--";
    const pausesCount = todayRecord?.pauses?.length || 0;
    const todayPauses = pausesCount > 0 ? `${pausesCount} ${pausesCount === 1 ? 'pausa' : 'pausas'}` : "Nenhuma";

    return (
      <SectionComponent>
        {/* Breadcrumbs and Header */}
        <div className="w-full flex flex-col gap-2">
          <Breadcrumb
            items={[
              { label: "Painel", href: "/" },
              { label: "Meu Ponto" },
            ]}
          />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
            <TittleHeader
              tittle="Meu Ponto Eletrônico"
              description="Acompanhe seus horários de entrada, saída, pausas e registre seu ponto via QR Code do totem."
            />
            <button
              onClick={startScanner}
              className="flex items-center justify-center gap-2 bg-[linear-gradient(to_right,#3b82f6,#2563eb)] hover:brightness-110 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all active:scale-95 text-sm cursor-pointer shrink-0 w-full md:w-auto"
            >
              <QrCode size={18} />
              Bater Ponto / Ler QR Code
            </button>
          </div>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 w-full">
          {/* Status Card */}
          <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-xs flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Status de Hoje</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border mt-1 ${statusColor}`}>
                {statusIcon}
                {statusText}
              </span>
            </div>
            <div className="p-3 bg-stone-50 rounded-2xl text-stone-400">
              <Clock size={20} />
            </div>
          </div>

          {/* Entry Card */}
          <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-xs flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Horário de Entrada</span>
              <span className="text-xl font-extrabold text-stone-700 mt-1">{todayEntry}</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
              <Clock size={20} />
            </div>
          </div>

          {/* Pauses Card */}
          <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-xs flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Pausas Hoje</span>
              <span className="text-xl font-extrabold text-stone-700 mt-1">{todayPauses}</span>
            </div>
            <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl">
              <Clock size={20} />
            </div>
          </div>

          {/* Exit Card */}
          <div className="bg-white p-5 rounded-3xl border border-stone-100 shadow-xs flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Horário de Saída</span>
              <span className="text-xl font-extrabold text-stone-700 mt-1">{todayExit}</span>
            </div>
            <div className="p-3 bg-purple-50 text-purple-500 rounded-2xl">
              <Clock size={20} />
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="w-full bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden mt-6">
          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-bold text-stone-700 text-sm">Histórico de Registros</h3>
            <span className="text-stone-400 text-xs font-semibold">{timeRecords.length} dias registrados</span>
          </div>

          {timeRecords.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-3 px-6">
              <Clock size={40} className="text-stone-300" />
              <p className="text-stone-600 font-semibold text-sm">Nenhum registro de ponto encontrado</p>
              <p className="text-stone-400 text-xs max-w-xs leading-relaxed">
                Você ainda não realizou nenhum registro de ponto no sistema. Use o botão "Bater Ponto" acima para escanear o totem.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-stone-400">Data</th>
                    <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-stone-400">Entrada</th>
                    <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-stone-400">Saída</th>
                    <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-stone-400">Pausas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {timeRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-stone-50/40 transition-colors">
                      <td className="py-4 px-6 font-semibold text-stone-600 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-stone-400" />
                          {formatDate(record.date)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${record.entryTime ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-stone-50 text-stone-400 border border-stone-100'}`}>
                          {formatTime(record.entryTime)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${record.exitTime ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-stone-50 text-stone-400 border border-stone-100'}`}>
                          {formatTime(record.exitTime)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg ${record.pauses && record.pauses.length > 0 ? 'bg-teal-50 text-teal-600 border border-teal-100' : 'bg-stone-50 text-stone-400 border border-stone-100'}`}>
                          {calculateTotalPauses(record.pauses)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Camera Scanner Modal Overlay */}
        {scanning && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={stopScanner} />
            <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 text-left shadow-2xl transition-all z-10 text-slate-100 animate-scale-up">
              <button
                onClick={stopScanner}
                className="absolute top-5 right-5 rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Escanear QR Code</h3>
                  <p className="text-stone-500 text-xs mt-0.5">Aponte a câmera para o QR Code do Totem.</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 items-center justify-center">
                <div id="qr-reader" className="w-full max-w-xs overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 aspect-square flex items-center justify-center relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.8)] rounded-full animate-scan pointer-events-none" />
                </div>

                {scannerError && (
                  <div className="text-xs text-rose-400 flex items-center gap-2 bg-rose-500/10 p-3.5 rounded-2xl border border-rose-500/20 mt-2 text-center w-full">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{scannerError}</span>
                  </div>
                )}

                <p className="text-stone-400 text-xs text-center leading-relaxed max-w-xs mt-2">
                  Certifique-se de conceder permissão de acesso à câmera no seu navegador.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t border-slate-800 pt-6">
                <button
                  type="button"
                  onClick={stopScanner}
                  className="px-5 py-3 rounded-2xl border border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmRecordModal && (
          <Modal
            isOpen={showConfirmRecordModal}
            onClose={() => setShowConfirmRecordModal(false)}
            title="Confirmar Registro de Ponto"
            maxWidth="max-w-md"
          >
            <div className="flex flex-col gap-4">
              {/* Collaborator Details */}
              <div className="flex items-center gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-250">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}`}
                  alt={currentUser.name}
                  className="h-12 w-12 rounded-full object-cover border border-stone-200"
                />
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-stone-700 text-sm">{currentUser.name}</span>
                  <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">
                    {currentUser.jobPosition?.department?.name || "Sem Setor"} • {currentUser.jobPosition?.name || "Sem Cargo"}
                  </span>
                </div>
              </div>

              {/* Date & Time info */}
              <div className="grid grid-cols-2 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-150">
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Data do Registro</span>
                  <span className="font-extrabold text-stone-700 text-sm mt-1">{new Date().toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Hora do Registro</span>
                  <span className="font-extrabold text-stone-700 text-sm mt-1">{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>

              {getRecordTypeOptions().length === 0 ? (
                <div className="text-xs text-amber-600 flex items-center gap-2 bg-amber-50 p-4 rounded-2xl border border-amber-100 mt-1">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>Todos os registros de ponto de hoje já foram concluídos.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Tipo de Registro
                  </label>
                  <div className="relative flex items-center bg-white border border-stone-200 rounded-2xl px-3.5 py-3 shadow-xs">
                    <select
                      value={recordType}
                      onChange={(e) => setRecordType(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-stone-700 outline-none pr-8 cursor-pointer w-full"
                    >
                      {getRecordTypeOptions().map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {registerError && (
                <div className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 p-3.5 rounded-xl border border-red-100">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{registerError}</span>
                </div>
              )}

              {registerSuccess && (
                <div className="text-xs text-emerald-600 flex items-center gap-1.5 bg-emerald-50 p-3.5 rounded-xl border border-emerald-100">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{registerSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-stone-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmRecordModal(false)}
                  disabled={registeringPoint}
                  className="px-4 py-2.5 rounded-xl border border-stone-400/50 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                {getRecordTypeOptions().length > 0 && !registerSuccess && (
                  <button
                    onClick={submitPointRegistration}
                    disabled={registeringPoint}
                    className="flex items-center justify-center gap-2 bg-[linear-gradient(to_right,#3b82f6,#2563eb)] hover:brightness-110 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all active:scale-95 text-xs tracking-wider cursor-pointer"
                  >
                    {registeringPoint ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      "Confirmar Registro"
                    )}
                  </button>
                )}
              </div>
            </div>
          </Modal>
        )}
      </SectionComponent>
    );
  }

  // --- ADMIN VIEW ---
  return (
    <SectionComponent>
      {/* Breadcrumbs and Header */}
      <div className="w-full flex flex-col gap-2">
        <Breadcrumb
          items={[
            { label: "Painel", href: "/" },
            { label: "Controle de Ponto" },
          ]}
        />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <TittleHeader
            tittle="Registros de Ponto"
            description="Visualize e gerencie os registros de ponto diários dos colaboradores da empresa divididos por setor ou visão geral."
          />
          <button
            onClick={() => {
              setAuthError("");
              setAdminPassword("");
              setShowEnterAuthModal(true);
            }}
            className="flex items-center justify-center gap-2 bg-[linear-gradient(to_right,#0f172a,#1e293b)] hover:brightness-120 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all active:scale-95 text-sm cursor-pointer shrink-0 w-full md:w-auto"
          >
            <QrCode size={18} className="text-teal-400" />
            Modo Totem / Registro
          </button>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-3">
        <div className="flex bg-white p-1 rounded-2xl border border-stone-200 shadow-xs max-w-sm w-full">
          <button
            onClick={() => {
              setActiveTab("geral");
              setSearchQuery("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "geral"
                ? "bg-stone-900 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            <Users size={15} />
            Visão Geral
          </button>
          <button
            onClick={() => {
              setActiveTab("setor");
              setSearchQuery("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "setor"
                ? "bg-stone-900 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            <Building2 size={15} />
            Dividido por Setor
          </button>
        </div>

        {/* Sector selection dropdown if "setor" tab is active */}
        {activeTab === "setor" && sectors.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-2xl px-3 py-1.5 shadow-xs shrink-0 w-full sm:w-auto">
            <Filter size={15} className="text-stone-400" />
            <select
              value={selectedSectorId}
              onChange={(e) => setSelectedSectorId(e.target.value)}
              className="bg-transparent text-xs font-bold text-stone-700 outline-none pr-6 cursor-pointer w-full py-1"
            >
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  Setor: {sector.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="w-full flex gap-3 mt-1">
        <InputField
          placeholder="Pesquisar por nome, CPF, cargo ou setor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="text-stone-400" size={20} />}
          classNameDiv="bg-white border border-stone-200 shadow-sm"
        />
      </div>

      {/* Point Logs Table */}
      <div className="w-full bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden mt-3">
        {error ? (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3 px-6">
            <AlertCircle size={40} className="text-rose-400" />
            <p className="text-stone-600 font-bold text-sm">Ocorreu um erro</p>
            <p className="text-stone-400 text-xs max-w-sm">{error}</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3 px-6">
            <Clock size={40} className="text-stone-300" />
            <p className="text-stone-600 font-semibold text-sm">Nenhum registro de ponto encontrado</p>
            <p className="text-stone-400 text-xs max-w-xs leading-relaxed">
              Não existem registros de ponto que atendam aos critérios de busca ou filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-stone-400">Colaborador</th>
                  <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-stone-400">Setor / Cargo</th>
                  <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-stone-400">Data</th>
                  <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-stone-400">Entrada</th>
                  <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-stone-400">Saída</th>
                  <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-stone-400">Pausas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-stone-50/40 transition-colors">
                    {/* Collaborator */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            record.user.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(record.user.name)}`
                          }
                          alt={record.user.name}
                          className="h-9 w-9 rounded-full object-cover border border-stone-200"
                        />
                        <div className="flex flex-col leading-tight">
                          <span className="font-bold text-stone-700 text-xs">{record.user.name}</span>
                          <span className="text-[10px] text-stone-400 font-normal mt-0.5">{record.user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Sector / Cargo */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col leading-tight">
                        <span className="font-semibold text-stone-700 text-xs">
                          {record.user.jobPosition?.department?.name || "Sem setor"}
                        </span>
                        <span className="text-[10px] text-stone-400 font-normal mt-0.5">
                          {record.user.jobPosition?.name || "Sem cargo"}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 font-semibold text-stone-600 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-stone-400" />
                        {formatDate(record.date)}
                      </div>
                    </td>

                    {/* Entry */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                          record.entryTime
                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                            : "bg-stone-50 text-stone-400 border border-stone-100"
                        }`}
                      >
                        {formatTime(record.entryTime)}
                      </span>
                    </td>

                    {/* Exit */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                          record.exitTime
                            ? "bg-purple-50 text-purple-600 border border-purple-100"
                            : "bg-stone-50 text-stone-400 border border-stone-100"
                        }`}
                      >
                        {formatTime(record.exitTime)}
                      </span>
                    </td>

                    {/* Pauses */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg ${
                          record.pauses && record.pauses.length > 0
                            ? "bg-teal-50 text-teal-600 border border-teal-100"
                            : "bg-stone-50 text-stone-400 border border-stone-100"
                        }`}
                      >
                        {calculateTotalPauses(record.pauses)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enter Kiosk Authentication Modal */}
      {showEnterAuthModal && (
        <Modal
          isOpen={showEnterAuthModal}
          onClose={() => setShowEnterAuthModal(false)}
          title="Autenticação de Segurança"
          maxWidth="max-w-md"
        >
          <div className="flex flex-col gap-1 mb-4">
            <p className="text-stone-500 text-xs font-medium leading-relaxed">
              Para entrar no Modo Totem de Ponto e exibir o relógio e QR Code, digite suas credenciais de administrador.
            </p>
          </div>

          <form onSubmit={handleEnterKioskAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Senha do Administrador
              </label>
              <InputField
                type="password"
                placeholder="Senha"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                disabled={authSubmitting}
                icon={<Lock className="text-stone-400" size={18} />}
                required
              />
            </div>

            {authError && (
              <div className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 p-3 rounded-xl border border-red-100 mt-1">
                <AlertCircle size={14} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-stone-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setShowEnterAuthModal(false)}
                disabled={authSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-400/50 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <SubmitButton
                text={authSubmitting ? "Verificando..." : "Entrar no Totem"}
                disabled={authSubmitting}
                className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
              />
            </div>
          </form>
        </Modal>
      )}
    </SectionComponent>
  );
}
