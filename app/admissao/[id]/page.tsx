"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, UploadCloud, FileText, ShieldAlert } from "lucide-react";
import { formatCPF, formatPhone } from "@/lib/masks";

export default function CandidateAdmissionPage() {
  const params = useParams();
  const admissionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [candidateInfo, setCandidateInfo] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchAdmission() {
      try {
        const response = await fetch(`/api/admission/${admissionId}`);
        const result = await response.json();

        if (result.success) {
          // Apenas permite preenchimento se estiver pendente (INVITED)
          if (result.data.status !== "INVITED") {
            setError("Este convite já foi processado ou está inativo.");
            setLoading(false);
            return;
          }

          setCandidateInfo(result.data);

          const initialData: Record<string, string> = {};
          if (Array.isArray(result.data.formConfig)) {
            result.data.formConfig.forEach((field: string) => {
              initialData[field] = result.data.formData?.[field] || "";
            });
          }
          setFormData(initialData);
        } else {
          setError(result.message || "Link inválido ou já processado.");
        }
      } catch (err) {
        setError(
          "Erro ao carregar as informações. Tente novamente mais tarde.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (admissionId) fetchAdmission();
  }, [admissionId]);

  const parseField = (field: string) => {
    const parts = field.split(":");
    const name = parts[0];
    const type = parts[1] === "FILE" ? "FILE" : "TEXT"; // Default is TEXT
    return { name, type };
  };

  const handleInputChange = (field: string, value: string) => {
    const { name } = parseField(field);
    const normalizedName = name.toLowerCase();

    let formattedValue = value;
    if (normalizedName === "cpf") {
      formattedValue = formatCPF(value);
    } else if (
      normalizedName.includes("telefone") ||
      normalizedName.includes("celular") ||
      normalizedName.includes("phone")
    ) {
      formattedValue = formatPhone(value);
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    if (!file) {
      setFormData((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    const { name } = parseField(field);
    const isPhoto = name === "foto" || name === "foto_perfil";

    // Validar tipo de arquivo com base no campo
    if (isPhoto) {
      if (!file.type.startsWith("image/")) {
        alert("Por favor, envie apenas arquivos de imagem (PNG, JPG, JPEG).");
        return;
      }
    } else {
      if (file.type !== "application/pdf") {
        alert("Por favor, envie apenas arquivos em formato PDF.");
        return;
      }
    }

    // Validar tamanho máximo: 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("O arquivo é muito grande. O tamanho máximo permitido é 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Valida se todos os campos/documentos obrigatórios foram preenchidos
    const missingFields = Object.entries(formData).filter(([_, value]) => !value);
    if (missingFields.length > 0) {
      setError("Por favor, preencha todos os campos e anexe os documentos solicitados.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admission/${admissionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, password }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || "Erro ao enviar dados.");
      }
    } catch (err) {
      setError("Erro de conexão ao enviar os dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600 font-medium">
          Carregando seu formulário...
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-gray-100">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tudo Certo!</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Seus dados e documentos foram enviados com sucesso para o RH. Agora é só aguardar a análise de contratação.
          </p>
        </div>
      </div>
    );
  }

  if (error && !candidateInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-gray-100">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Ops! Algo deu errado.
          </h1>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-gray-100/50">
        <div className="mb-8 border-b pb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Olá, {candidateInfo.candidateName}!
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Bem-vindo(a) ao seu portal de admissão. Por favor, responda aos campos solicitados e anexe os documentos necessários abaixo para podermos efetivar sua contratação.
          </p>
        </div>
 
        {candidateInfo.justification && (
          <div className="mb-6 p-5 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex flex-col gap-1.5 shadow-sm">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              Correções Solicitadas pelo RH
            </span>
            <p className="text-sm font-semibold leading-relaxed bg-white/60 p-3 rounded-xl border border-amber-100/50">
              {candidateInfo.justification}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800">
              Suas Informações
            </h2>

            {candidateInfo.formConfig && candidateInfo.formConfig.length > 0 ? (
              candidateInfo.formConfig.map((field: string) => {
                const { name, type } = parseField(field);
                const isFile = type === "FILE";

                return (
                  <div key={field} className="flex flex-col gap-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">
                      {name.replace(/_/g, " ")}{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    {isFile ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 w-full border border-gray-300 rounded-xl p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors relative cursor-pointer group border-dashed hover:border-blue-500">
                          <input
                            type="file"
                            accept={name === "foto" || name === "foto_perfil" ? "image/*" : ".pdf"}
                            required
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              handleFileChange(field, file);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <div className="p-3 bg-white rounded-xl border border-gray-200 text-gray-500 group-hover:text-blue-500 group-hover:border-blue-200 transition-colors flex items-center justify-center shrink-0">
                            {formData[field] ? (
                              name === "foto" || name === "foto_perfil" ? (
                                <img
                                  src={formData[field]}
                                  alt="Sua foto"
                                  className="h-8 w-8 rounded-full object-cover border border-stone-200"
                                />
                              ) : (
                                <FileText className="h-6 w-6 text-green-500" />
                              )
                            ) : (
                              <UploadCloud className="h-6 w-6 text-gray-400 group-hover:text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1 text-xs truncate">
                            {formData[field] ? (
                              <div className="flex flex-col">
                                <span className="text-green-600 font-bold">
                                  {name === "foto" || name === "foto_perfil" ? "✓ Foto Carregada" : "✓ Documento Carregado"}
                                </span>
                                <span className="text-[10px] text-gray-400 italic">Pronto para envio</span>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <span className="text-gray-700 font-medium">
                                  {name === "foto" || name === "foto_perfil" ? "Selecionar imagem (PNG, JPG)" : "Selecionar arquivo PDF"}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {name === "foto" || name === "foto_perfil" ? "Imagem de até 5MB" : "PDF de até 5MB"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formData[field] || ""}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-gray-700"
                        placeholder={`Digite seu ${name.replace(/_/g, " ")}`}
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 italic">
                Nenhuma informação adicional foi solicitada.
              </p>
            )}
          </div>

          <div className="space-y-6 border-t pt-8">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Crie sua Senha
              </h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Você usará essa senha em conjunto com seu CPF para acessar a plataforma do ConectaRH no futuro como colaborador ativo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">
                  Nova Senha <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-gray-700"
                  placeholder="Mínimo de 6 caracteres"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">
                  Confirme a Senha <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-gray-700"
                  placeholder="Repita a senha"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[linear-gradient(to_right,#3B82F6,#1D4ED8)] text-white py-4 px-6 rounded-2xl font-bold hover:brightness-110 shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center cursor-pointer text-sm tracking-wider uppercase"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              "Enviar Informações"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
