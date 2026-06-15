"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Briefcase,
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Info,
} from "lucide-react";
import Link from "next/link";

import SectionComponent from "@/components/SectionComponent";
import TittleHeader from "@/components/TittleHeader";
import Breadcrumb from "@/components/Breadcrumb";
import Modal from "@/components/Modal";
import InputField from "@/components/InputField";
import SubmitButton from "@/components/SubmitButton";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  cpf: string;
  avatar: string | null;
  role: string;
  status: string;
}

interface Cargo {
  id: string;
  name: string;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
  users: Collaborator[];
}

interface Sector {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  positions: Cargo[];
}

export default function SetoresPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});

  // Modal States
  const [activeModal, setActiveModal] = useState<
    | null
    | "create-sector"
    | "edit-sector"
    | "delete-sector"
    | "create-cargo"
    | "edit-cargo"
    | "delete-cargo"
  >(null);

  // Form inputs and selected items
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedCargo, setSelectedCargo] = useState<Cargo | null>(null);
  
  const [sectorName, setSectorName] = useState("");
  const [sectorDescription, setSectorDescription] = useState("");
  
  const [cargoName, setCargoName] = useState("");
  const [cargoSectorId, setCargoSectorId] = useState("");

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all sectors
  const fetchSectors = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/setores");
      if (!res.ok) {
        throw new Error("Erro ao carregar os setores.");
      }
      const data = await res.json();
      setSectors(data);

      // Auto-expand sectors that contain positions/collaborators by default
      const initialExpanded: Record<string, boolean> = {};
      data.forEach((s: Sector) => {
        initialExpanded[s.id] = true; // start all expanded for better visibility
      });
      setExpandedSectors(initialExpanded);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSectors();
  }, []);

  const toggleExpandSector = (sectorId: string) => {
    setExpandedSectors((prev) => ({
      ...prev,
      [sectorId]: !prev[sectorId],
    }));
  };

  const handleOpenCreateSector = () => {
    setSectorName("");
    setSectorDescription("");
    setFormError("");
    setActiveModal("create-sector");
  };

  const handleOpenEditSector = (sector: Sector) => {
    setSelectedSector(sector);
    setSectorName(sector.name);
    setSectorDescription(sector.description || "");
    setFormError("");
    setActiveModal("edit-sector");
  };

  const handleOpenDeleteSector = (sector: Sector) => {
    setSelectedSector(sector);
    setFormError("");
    setActiveModal("delete-sector");
  };

  const handleOpenCreateCargo = (sector: Sector) => {
    setSelectedSector(sector);
    setCargoName("");
    setCargoSectorId(sector.id);
    setFormError("");
    setActiveModal("create-cargo");
  };

  const handleOpenEditCargo = (sector: Sector, cargo: Cargo) => {
    setSelectedSector(sector);
    setSelectedCargo(cargo);
    setCargoName(cargo.name);
    setCargoSectorId(cargo.departmentId);
    setFormError("");
    setActiveModal("edit-cargo");
  };

  const handleOpenDeleteCargo = (sector: Sector, cargo: Cargo) => {
    setSelectedSector(sector);
    setSelectedCargo(cargo);
    setFormError("");
    setActiveModal("delete-cargo");
  };

  // Submit handlers
  const handleCreateSectorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/setores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sectorName,
          description: sectorDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar setor.");
      }

      await fetchSectors();
      setActiveModal(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSectorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSector) return;
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/setores/${selectedSector.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sectorName,
          description: sectorDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar setor.");
      }

      await fetchSectors();
      setActiveModal(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSectorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSector) return;
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/setores/${selectedSector.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao excluir setor.");
      }

      await fetchSectors();
      setActiveModal(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCargoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/cargos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cargoName,
          departmentId: cargoSectorId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar cargo.");
      }

      await fetchSectors();
      setActiveModal(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCargoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCargo) return;
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/cargos/${selectedCargo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cargoName,
          departmentId: cargoSectorId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar cargo.");
      }

      await fetchSectors();
      setActiveModal(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCargoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCargo) return;
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/cargos/${selectedCargo.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao excluir cargo.");
      }

      await fetchSectors();
      setActiveModal(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter logic
  const filteredSectors = sectors.map((sector) => {
    // Check if sector name or description matches query
    const sectorMatches =
      sector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sector.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    // Filter positions within sector
    const filteredPositions = sector.positions.filter((pos) => {
      const cargoMatches = pos.name.toLowerCase().includes(searchQuery.toLowerCase());
      const usersMatches = pos.users.some(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return cargoMatches || usersMatches || sectorMatches;
    });

    return {
      ...sector,
      positions: filteredPositions,
      matchesSearch: sectorMatches || filteredPositions.length > 0,
    };
  }).filter((sector) => sector.matchesSearch);

  // Stats calculation
  const totalSectorsCount = sectors.length;
  const totalCargosCount = sectors.reduce((acc, s) => acc + s.positions.length, 0);
  const totalColaboradoresCount = sectors.reduce(
    (acc, s) => acc + s.positions.reduce((pAcc, p) => pAcc + p.users.length, 0),
    0
  );
  const desocupadosCount = sectors
    .find((s) => s.name === "Desocupados")
    ?.positions.find((p) => p.name === "Desocupado")
    ?.users.length || 0;

  if (loading && sectors.length === 0) {
    return (
      <section className="p-5 flex flex-col items-center gap-5 w-full max-w-[1400px] mx-auto min-h-[80vh] justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-stone-500 font-semibold text-sm animate-pulse">
            Carregando painel de setores e cargos...
          </p>
        </div>
      </section>
    );
  }

  return (
    <SectionComponent>
      {/* Breadcrumbs e Header */}
      <div className="w-full flex flex-col gap-2">
        <Breadcrumb
          items={[
            { label: "Painel", href: "/" },
            { label: "Setores e Cargos" },
          ]}
        />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <TittleHeader
            tittle="Setores e Cargos"
            description="Gerencie a estrutura organizacional da empresa, organize cargos e visualize colaboradores vinculados."
          />
          <button
            onClick={handleOpenCreateSector}
            className="flex items-center justify-center gap-2 bg-[linear-gradient(to_right,#2f5fd0,#2ec4b6)] hover:brightness-110 text-white font-semibold py-3 px-6 rounded-2xl shadow-md transition-all active:scale-95 text-sm cursor-pointer shrink-0 w-full md:w-auto"
          >
            <Plus size={18} />
            Cadastrar Novo Setor
          </button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3.5 bg-blue-50 text-blue-500 rounded-2xl">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-wider">Setores</p>
            <h3 className="text-2xl font-bold text-stone-700 mt-0.5">{totalSectorsCount}</h3>
          </div>
        </div>

        <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3.5 bg-teal-50 text-teal-500 rounded-2xl">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-wider">Cargos</p>
            <h3 className="text-2xl font-bold text-stone-700 mt-0.5">{totalCargosCount}</h3>
          </div>
        </div>

        <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3.5 bg-purple-50 text-purple-500 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-wider">Colaboradores</p>
            <h3 className="text-2xl font-bold text-stone-700 mt-0.5">{totalColaboradoresCount}</h3>
          </div>
        </div>

        <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3.5 bg-amber-50 text-amber-500 rounded-2xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-wider">Desocupados</p>
            <h3 className="text-2xl font-bold text-stone-700 mt-0.5">{desocupadosCount}</h3>
          </div>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="w-full flex gap-3 mt-2">
        <InputField
          placeholder="Pesquisar por setor, cargo ou colaborador..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="text-stone-400" size={20} />}
          classNameDiv="bg-white border border-stone-200 shadow-sm"
        />
      </div>

      {/* Listagem de Setores Expandível */}
      <div className="w-full flex flex-col gap-6 mt-2">
        {filteredSectors.length === 0 ? (
          <div className="w-full py-16 flex flex-col items-center justify-center text-center gap-3 bg-white rounded-3xl border border-stone-100 shadow-sm">
            <Building2 size={48} className="text-stone-300 animate-pulse" />
            <p className="text-stone-500 font-semibold text-base">Nenhum setor ou cargo encontrado</p>
            <p className="text-stone-400 text-sm max-w-sm">
              Tente redefinir sua pesquisa ou crie um novo setor utilizando o botão no topo da página.
            </p>
          </div>
        ) : (
          filteredSectors.map((sector) => {
            const isExpanded = !!expandedSectors[sector.id];
            const isReserved = sector.name === "Desocupados";
            const departmentColaboratorsCount = sector.positions.reduce((acc, pos) => acc + pos.users.length, 0);

            return (
              <div
                key={sector.id}
                className={`w-full bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden transition-all duration-300 hover:shadow-md ${
                  isReserved ? "border-l-4 border-l-amber-500/70" : "border-l-4 border-l-blue-500/70"
                }`}
              >
                {/* Cabeçalho do Setor */}
                <div
                  onClick={() => toggleExpandSector(sector.id)}
                  className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/50 transition-colors select-none"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h2 className="text-lg font-bold text-stone-700 flex items-center gap-2">
                        {isReserved ? (
                          <AlertCircle size={20} className="text-amber-500" />
                        ) : (
                          <Building2 size={20} className="text-blue-500" />
                        )}
                        {sector.name}
                      </h2>
                      <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {sector.positions.length} {sector.positions.length === 1 ? "cargo" : "cargos"}
                      </span>
                      <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {departmentColaboratorsCount} {departmentColaboratorsCount === 1 ? "colaborador" : "colaboradores"}
                      </span>
                    </div>
                    {sector.description && (
                      <p className="text-stone-500 text-sm mt-1.5 leading-relaxed font-normal">
                        {sector.description}
                      </p>
                    )}
                  </div>

                  {/* Ações do Setor */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto justify-end" onClick={(e) => e.stopPropagation()}>
                    {!isReserved && (
                      <>
                        <button
                          onClick={() => handleOpenCreateCargo(sector)}
                          className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-600 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                          title="Inserir Cargo"
                        >
                          <PlusCircle size={15} />
                          Inserir Cargo
                        </button>
                        <button
                          onClick={() => handleOpenEditSector(sector)}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-600 p-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                          title="Editar Setor"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteSector(sector)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                          title="Excluir Setor"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                    
                    {isReserved && (
                      <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl text-xs font-semibold">
                        <Info size={14} />
                        Reservado do Sistema
                      </div>
                    )}

                    <div className="text-stone-400 p-2 ml-1" onClick={() => toggleExpandSector(sector.id)}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Área Expansível (Cargos e Colaboradores) */}
                {isExpanded && (
                  <div className="border-t border-stone-100 bg-stone-50/20 px-6 py-4 flex flex-col gap-4">
                    {sector.positions.length === 0 ? (
                      <div className="py-8 text-center text-stone-500 font-normal italic text-sm">
                        Nenhum cargo cadastrado neste setor. Clique em &quot;Inserir Cargo&quot; para começar.
                      </div>
                    ) : (
                      sector.positions.map((cargo) => {
                        const isCargoReserved = cargo.name === "Desocupado";

                        return (
                          <div
                            key={cargo.id}
                            className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm flex flex-col gap-4"
                          >
                            {/* Cabeçalho do Cargo */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-50 pb-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Briefcase size={16} className="text-stone-400" />
                                <span className="font-bold text-stone-700 text-sm">{cargo.name}</span>
                                <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {cargo.users.length} {cargo.users.length === 1 ? "colaborador" : "colaboradores"}
                                </span>
                              </div>

                              {!isCargoReserved && !isReserved && (
                                <div className="flex items-center gap-1.5 self-end sm:self-center">
                                  <button
                                    onClick={() => handleOpenEditCargo(sector, cargo)}
                                    className="bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-stone-700 p-2 rounded-lg transition-colors cursor-pointer"
                                    title="Editar Cargo"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenDeleteCargo(sector, cargo)}
                                    className="bg-red-50 hover:bg-red-100 text-red-500 p-2 rounded-lg transition-colors cursor-pointer"
                                    title="Excluir Cargo"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Lista de Colaboradores */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {cargo.users.length === 0 ? (
                                <div className="col-span-full py-4 text-left text-stone-400 font-normal italic text-xs flex items-center gap-1.5">
                                  <Info size={14} />
                                  Nenhum colaborador alocado neste cargo.
                                </div>
                              ) : (
                                cargo.users.map((colab) => (
                                  <div
                                    key={colab.id}
                                    className="flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:border-blue-200 hover:bg-blue-50/10 transition-all group"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <img
                                        src={
                                          colab.avatar ||
                                          `https://ui-avatars.com/api/?name=${encodeURIComponent(colab.name)}`
                                        }
                                        alt="Avatar"
                                        className="h-9 w-9 rounded-full object-cover border border-stone-200"
                                      />
                                      <div className="flex flex-col leading-tight min-w-0">
                                        <span className="font-semibold text-stone-700 text-xs truncate">
                                          {colab.name}
                                        </span>
                                        <span className="text-[10px] text-stone-500 truncate font-normal">
                                          {colab.email}
                                        </span>
                                      </div>
                                    </div>
                                    <Link
                                      href={`/colaboradores/${colab.id}`}
                                      className="text-stone-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 transition-colors shrink-0"
                                      title="Ver perfil"
                                    >
                                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                    </Link>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Criar Setor */}
      {activeModal === "create-sector" && (
        <Modal
          isOpen={activeModal === "create-sector"}
          onClose={() => setActiveModal(null)}
          title="Cadastrar Novo Setor"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateSectorSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Nome do Setor
              </label>
              <InputField
                type="text"
                placeholder="Ex: Recursos Humanos, Financeiro"
                value={sectorName}
                onChange={(e) => setSectorName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Descrição
              </label>
              <InputField
                type="text"
                placeholder="Breve descrição sobre a responsabilidade do setor"
                value={sectorDescription}
                onChange={(e) => setSectorDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {formError && (
              <div className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-100">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-stone-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-400/50 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <SubmitButton
                text={isSubmitting ? "Cadastrando..." : "Cadastrar Setor"}
                disabled={isSubmitting}
                className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Editar Setor */}
      {activeModal === "edit-sector" && selectedSector && (
        <Modal
          isOpen={activeModal === "edit-sector"}
          onClose={() => setActiveModal(null)}
          title={`Editar Setor: ${selectedSector.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleEditSectorSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Nome do Setor
              </label>
              <InputField
                type="text"
                placeholder="Ex: Tecnologia da Informação"
                value={sectorName}
                onChange={(e) => setSectorName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Descrição
              </label>
              <InputField
                type="text"
                placeholder="Breve descrição sobre a responsabilidade do setor"
                value={sectorDescription}
                onChange={(e) => setSectorDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {formError && (
              <div className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-100">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-stone-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-400/50 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <SubmitButton
                text={isSubmitting ? "Salvando..." : "Salvar Alterações"}
                disabled={isSubmitting}
                className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Excluir Setor */}
      {activeModal === "delete-sector" && selectedSector && (
        <Modal
          isOpen={activeModal === "delete-sector"}
          onClose={() => setActiveModal(null)}
          title="Excluir Setor"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleDeleteSectorSubmit} className="flex flex-col gap-4">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div className="flex flex-col gap-1">
                <p className="text-xs font-bold text-red-800 uppercase tracking-wide">Atenção! Ação Irreversível</p>
                <p className="text-xs text-red-700 leading-relaxed font-normal">
                  Você está prestes a excluir o setor <strong className="font-bold">{selectedSector.name}</strong> e todos os seus cargos vinculados.
                </p>
                <p className="text-xs text-red-700 leading-relaxed mt-2 font-normal">
                  Os colaboradores atualmente alocados nestes cargos serão automaticamente movidos para a vaga de <strong className="font-bold">Desocupados</strong> no banco de dados.
                </p>
              </div>
            </div>

            {formError && (
              <div className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-100">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-stone-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-400/50 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Criar Cargo */}
      {activeModal === "create-cargo" && selectedSector && (
        <Modal
          isOpen={activeModal === "create-cargo"}
          onClose={() => setActiveModal(null)}
          title={`Inserir Cargo em: ${selectedSector.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateCargoSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Nome do Cargo
              </label>
              <InputField
                type="text"
                placeholder="Ex: Desenvolvedor Senior, Analista Comercial"
                value={cargoName}
                onChange={(e) => setCargoName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {formError && (
              <div className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-100">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-stone-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-400/50 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <SubmitButton
                text={isSubmitting ? "Cadastrando..." : "Cadastrar Cargo"}
                disabled={isSubmitting}
                className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Editar Cargo */}
      {activeModal === "edit-cargo" && selectedCargo && (
        <Modal
          isOpen={activeModal === "edit-cargo"}
          onClose={() => setActiveModal(null)}
          title={`Editar Cargo: ${selectedCargo.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleEditCargoSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Nome do Cargo
              </label>
              <InputField
                type="text"
                placeholder="Ex: Designer UI/UX"
                value={cargoName}
                onChange={(e) => setCargoName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Setor do Cargo
              </label>
              <div className="w-full border border-stone-400/50 rounded-xl py-3 px-3">
                <select
                  value={cargoSectorId}
                  onChange={(e) => setCargoSectorId(e.target.value)}
                  disabled={isSubmitting}
                  className="outline-none w-full bg-transparent text-sm text-stone-700"
                  required
                >
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formError && (
              <div className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-100">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-stone-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-400/50 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <SubmitButton
                text={isSubmitting ? "Salvando..." : "Salvar Alterações"}
                disabled={isSubmitting}
                className="!w-auto !py-2.5 !px-6 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Excluir Cargo */}
      {activeModal === "delete-cargo" && selectedCargo && (
        <Modal
          isOpen={activeModal === "delete-cargo"}
          onClose={() => setActiveModal(null)}
          title="Excluir Cargo"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleDeleteCargoSubmit} className="flex flex-col gap-4">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div className="flex flex-col gap-1">
                <p className="text-xs font-bold text-red-800 uppercase tracking-wide">Atenção! Ação Irreversível</p>
                <p className="text-xs text-red-700 leading-relaxed font-normal">
                  Você está prestes a excluir o cargo <strong className="font-bold">{selectedCargo.name}</strong>.
                </p>
                <p className="text-xs text-red-700 leading-relaxed mt-2 font-normal">
                  Os colaboradores atualmente alocados neste cargo serão automaticamente movidos para a vaga de <strong className="font-bold">Desocupados</strong> no banco de dados.
                </p>
              </div>
            </div>

            {formError && (
              <div className="text-xs text-red-500 flex items-center gap-1.5 bg-red-50 p-2.5 rounded-xl border border-red-100">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-stone-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-400/50 text-stone-600 hover:bg-stone-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </SectionComponent>
  );
}
