"use client";

import { useEffect, useState } from "react";
import { X, UserRound, IdCard, Lock, ShieldAlert, CheckCircle2, Tags, Briefcase } from "lucide-react";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";
import { formatCPF } from "@/lib/masks";

interface ManualUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualUserModal({
  isOpen,
  onClose,
  onSuccess,
}: ManualUserModalProps) {
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [jobPositions, setJobPositions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedJobPositionId, setSelectedJobPositionId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchJobPositions = async () => {
    try {
      const response = await fetch("/api/job-positions");
      const result = await response.json();
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
    } catch (err) {
      console.error("Erro ao carregar cargos:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setName("");
      setCpf("");
      setPassword("");
      setSelectedDepartmentId("");
      setSelectedJobPositionId("");
      setError(null);
      setSuccessMsg(null);
      fetchJobPositions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      setError("Por favor, insira um CPF válido com 11 dígitos.");
      return;
    }

    if (!name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }

    if (!password || password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/colaboradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          cpf: cleanCpf,
          password: password,
          jobPositionId: selectedJobPositionId || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMsg("Usuário criado com sucesso!");
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccessMsg(null);
        }, 2000);
      } else {
        setError(result.message || "Erro ao criar usuário.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Erro de rede. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-white w-full max-w-[500px] rounded-3xl shadow-2xl overflow-hidden border border-stone-100 flex flex-col transform transition-all scale-100 relative">
        {/* Cabeçalho do Modal */}
        <div className="bg-[linear-gradient(to_right,#1e293b,#0f172a)] p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all duration-200"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
          <h2 className="text-xl font-bold">Cadastro Manual de Usuário</h2>
          <p className="text-stone-300 text-xs mt-1">
            Insira os dados básicos para criar o novo colaborador no sistema imediatamente.
          </p>
        </div>

        {/* Corpo do Modal - Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col p-6 gap-5 max-h-[75vh] overflow-y-auto">
          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-600/80 uppercase tracking-wider ml-1">
              Nome Completo
            </label>
            <InputField
              icon={<UserRound size={18} className="text-stone-400" />}
              placeholder="Digite o nome completo"
              type="text"
              required
              disabled={loading || !!successMsg}
              value={name}
              onChange={(e) => setName(e.target.value)}
              classNameInput="text-sm text-stone-700"
            />
          </div>

          {/* CPF */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-600/80 uppercase tracking-wider ml-1">
              CPF
            </label>
            <InputField
              icon={<IdCard size={18} className="text-stone-400" />}
              placeholder="000.000.000-00"
              type="text"
              required
              disabled={loading || !!successMsg}
              value={cpf}
              onChange={handleCpfChange}
              classNameInput="text-sm text-stone-700"
            />
          </div>

          {/* Senha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-600/80 uppercase tracking-wider ml-1">
              Senha
            </label>
            <InputField
              icon={<Lock size={18} className="text-stone-400" />}
              placeholder="••••••••"
              type="password"
              required
              disabled={loading || !!successMsg}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              classNameInput="text-sm text-stone-700"
            />
          </div>

          {/* Setor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-600/80 uppercase tracking-wider ml-1">
              Setor
            </label>
            <div className="flex w-full border border-stone-400/50 rounded-xl py-3 px-3 gap-2 items-center bg-transparent">
              <Tags size={18} className="text-stone-400 shrink-0" />
              <select
                disabled={loading || !!successMsg}
                value={selectedDepartmentId}
                onChange={(e) => {
                  setSelectedDepartmentId(e.target.value);
                  setSelectedJobPositionId("");
                }}
                className="outline-none w-full bg-transparent text-sm text-stone-700 appearance-none cursor-pointer"
              >
                <option value="">-- Selecione o Setor (Opcional) --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none pr-1 flex items-center justify-center text-stone-400">
                <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Cargo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-600/80 uppercase tracking-wider ml-1">
              Cargo
            </label>
            <div className="flex w-full border border-stone-400/50 rounded-xl py-3 px-3 gap-2 items-center bg-transparent">
              <Briefcase size={18} className="text-stone-400 shrink-0" />
              <select
                disabled={loading || !!successMsg || !selectedDepartmentId}
                value={selectedJobPositionId}
                onChange={(e) => setSelectedJobPositionId(e.target.value)}
                className="outline-none w-full bg-transparent text-sm text-stone-700 appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Selecione o Cargo (Opcional) --</option>
                {jobPositions
                  .filter((pos) => pos.departmentId === selectedDepartmentId)
                  .map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.name}
                    </option>
                  ))}
              </select>
              <div className="pointer-events-none pr-1 flex items-center justify-center text-stone-400">
                <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Feedbacks */}
          {(error || successMsg) && (
            <div className="mt-2">
              {error && (
                <div className="flex items-center gap-2 text-red-700 text-xs font-medium bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                  <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
                  <span className="truncate">{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="flex items-center gap-2 text-green-700 text-xs font-medium bg-green-50 border border-green-100 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="truncate">{successMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3 mt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || !!successMsg}
              className="px-5 py-3 text-stone-500 hover:text-stone-700 bg-white hover:bg-stone-100 rounded-2xl text-xs font-bold border border-stone-200 transition-all cursor-pointer flex-1"
            >
              Cancelar
            </button>
            <div className="flex-1">
              <SubmitButton
                text={loading ? "Criando..." : "Criar Usuário"}
                disabled={loading || !!successMsg}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
