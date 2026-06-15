"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SectionComponent from "@/components/SectionComponent";
import { Column, Table } from "@/components/Table";
import TittleHeader from "@/components/TittleHeader";
import { formatCPF } from "@/lib/masks";
import {
  Eye,
  Loader2,
  Users2,
  Building2,
  Calendar,
  Palmtree,
  Search,
  Filter,
  Layers,
  BarChart2,
  PieChart,
} from "lucide-react";
import Link from "next/link";
import CentralFerias from "./_components/CentralFerias";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  cpf: string;
  avatar: string | null;
  role: string;
  status: string; // e.g. "ACTIVE", "VACATION"
  jobPosition?: {
    name: string;
    department: {
      id: string;
      name: string;
    };
  } | null;
}

interface Department {
  id: string;
  name: string;
  description: string | null;
  positions: {
    id: string;
    name: string;
    users: {
      id: string;
      name: string;
      email: string;
      cpf: string;
      avatar: string | null;
      role: string;
      status: string;
    }[];
  }[];
}

interface Vacation {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
}

export default function ColaboradoresPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") || "colaboradores";
  const [activeTab, setActiveTab] = useState(tabParam);

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [groupBySector, setGroupBySector] = useState(true);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [resColab, resDept, resFerias] = await Promise.all([
        fetch("/api/colaboradores"),
        fetch("/api/setores"),
        fetch("/api/ferias"),
      ]);

      if (!resColab.ok || !resDept.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const colabData = await resColab.json();
      const deptData = await resDept.json();

      let feriasData = [];
      if (resFerias.ok) {
        const fJson = await resFerias.json();
        if (fJson.success) feriasData = fJson.data;
      }

      setCollaborators(colabData);
      setDepartments(deptData);
      setVacations(feriasData);
    } catch (error) {
      console.error("Erro na busca de dados dos colaboradores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    router.push(`/colaboradores?tab=${newTab}`);
  };

  // Cálculos do Dashboard
  const totalCollaborators = collaborators.length;
  const totalSectors = departments.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeVacationsCount = vacations.filter((v) => {
    if (v.status !== "APPROVED") return false;
    const start = new Date(v.startDate);
    const end = new Date(v.endDate);
    const utcStart = new Date(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate(),
    );
    const utcEnd = new Date(
      end.getUTCFullYear(),
      end.getUTCMonth(),
      end.getUTCDate(),
      23,
      59,
      59,
    );
    return today >= utcStart && today <= utcEnd;
  }).length;

  const scheduledVacationsCount = vacations.filter((v) => {
    if (v.status !== "APPROVED") return false;
    const start = new Date(v.startDate);
    const utcStart = new Date(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate(),
    );
    return utcStart > today;
  }).length;

  // Contagem de colaboradores por setor para o gráfico de barras
  const sectorCounts = departments.map((dept) => {
    // Somar usuários de todas as posições desse setor
    const count = dept.positions.reduce(
      (acc, pos) => acc + pos.users.length,
      0,
    );
    return {
      id: dept.id,
      name: dept.name,
      count,
    };
  });

  // Contagem de status para o gráfico donut/breakdown
  const activeStatusCount = collaborators.filter(
    (c) => c.status === "ACTIVE",
  ).length;
  const vacationStatusCount = collaborators.filter(
    (c) => c.status === "VACATION",
  ).length;
  const inactiveStatusCount = collaborators.filter(
    (c) => c.status === "INACTIVE" || c.status === "OFF",
  ).length;

  // Filtragem
  const getFilteredCollaborators = (list: Collaborator[]) => {
    return list.filter((c) => {
      // Filtro de pesquisa
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cpf.includes(searchQuery);

      // Filtro de setor
      const deptId = c.jobPosition?.department?.id;
      const matchesSector =
        selectedSector === "all" || deptId === selectedSector;

      return matchesSearch && matchesSector;
    });
  };

  const filteredList = getFilteredCollaborators(collaborators);

  // Colunas da tabela
  const columns: Column<Collaborator>[] = [
    {
      label: "Colaborador",
      render: (c) => (
        <div className="flex items-center gap-3">
          <img
            src={
              c.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}`
            }
            alt={c.name}
            className="h-10 w-10 rounded-full object-cover border border-stone-200"
          />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-semibold text-stone-700 truncate">
              {c.name}
            </span>
            <span className="text-xs text-stone-400 font-normal truncate">
              {c.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      label: "Cargo / Setor",
      render: (c) => (
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-stone-650 text-sm">
            {c.jobPosition?.name || "Não atribuído"}
          </span>
          <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
            {c.jobPosition?.department?.name || "Sem setor"}
          </span>
        </div>
      ),
    },
    {
      label: "Status",
      render: (c) => {
        const isVacation = c.status === "VACATION";
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isVacation
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-blue-50 text-blue-700 border border-blue-100"
            }`}
          >
            {isVacation ? "Em Férias" : "Ativo"}
          </span>
        );
      },
    },
    {
      label: "CPF",
      render: (c) => (
        <span className="font-mono text-xs text-stone-600">
          {formatCPF(c.cpf)}
        </span>
      ),
      align: "right",
    },
    {
      label: "Ações",
      align: "center",
      render: (c) => (
        <Link
          href={`/colaboradores/${c.id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
        >
          <Eye size={14} />
          Visualizar
        </Link>
      ),
    },
  ];

  if (loading) {
    return (
      <section className="p-5 flex flex-col items-center gap-5 w-full max-w-[1400px] mx-auto min-h-[80vh] justify-center animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-stone-500 font-semibold text-sm">
            Carregando painel de colaboradores...
          </p>
        </div>
      </section>
    );
  }

  return (
    <SectionComponent>
      {/* Título */}
      <TittleHeader
        tittle={
          activeTab === "colaboradores"
            ? "Painel de Colaboradores"
            : "Gestão Central de Férias"
        }
        description={
          activeTab === "colaboradores"
            ? "Gerencie a equipe, setores e acompanhe métricas corporativas"
            : "Aprovação, registro e cronograma de férias de toda a empresa"
        }
        className="w-full"
      />

      {/* Abas */}
      <div className="w-full flex border-b border-stone-200/60 overflow-x-auto gap-4 mt-2">
        <button
          onClick={() => handleTabChange("colaboradores")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap px-1 flex items-center gap-2 ${
            activeTab === "colaboradores"
              ? "border-blue-500 text-blue-500"
              : "border-transparent text-stone-400 hover:text-stone-650"
          }`}
        >
          <Users2 size={16} />
          Colaboradores
        </button>
        <button
          onClick={() => handleTabChange("ferias")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap px-1 flex items-center gap-2 ${
            activeTab === "ferias"
              ? "border-blue-500 text-blue-500"
              : "border-transparent text-stone-400 hover:text-stone-650"
          }`}
        >
          <Palmtree size={16} />
          Gestão de Férias
        </button>
      </div>

      {activeTab === "colaboradores" ? (
        <div className="w-full space-y-6">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl   shadow-lg flex items-center gap-4 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users2 size={24} />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Total Colaboradores
                </h4>
                <p className="text-xl font-bold text-stone-750">
                  {totalCollaborators}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-lg flex items-center gap-4 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Building2 size={24} />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Setores Ativos
                </h4>
                <p className="text-xl font-bold text-stone-755">
                  {totalSectors}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl  shadow-lg flex items-center gap-4 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Palmtree size={24} />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Férias Ativas
                </h4>
                <p className="text-xl font-bold text-emerald-700">
                  {activeVacationsCount}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl  shadow-lg flex items-center gap-4 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Calendar size={24} />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Férias Agendadas
                </h4>
                <p className="text-xl font-bold text-amber-700">
                  {scheduledVacationsCount}
                </p>
              </div>
            </div>
          </div>

          {/* Gráficos em Linha/Barra Dinâmicos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico 1: Colaboradores por Setor */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl  shadow-lg space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <BarChart2 className="text-blue-500" size={18} />
                <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">
                  Distribuição por Setor
                </h3>
              </div>

              <div className="space-y-4">
                {sectorCounts.map((s) => {
                  const percentage =
                    totalCollaborators > 0
                      ? (s.count / totalCollaborators) * 100
                      : 0;
                  return (
                    <div key={s.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-stone-600">
                          {s.name}
                        </span>
                        <span className="font-bold text-stone-500">
                          {s.count} colaboradores ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráfico 2: Status dos Colaboradores */}
            <div className="bg-white p-6 rounded-3xl  shadow-lg flex flex-col justify-between gap-4">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <PieChart className="text-blue-500" size={18} />
                <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">
                  Status da Equipe
                </h3>
              </div>

              {/* Animação Gráfica Donut usando SVG nativo */}
              <div className="flex items-center justify-center py-2 relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  {/* Círculo fundo */}
                  <circle
                    cx="64"
                    cy="64"
                    r="50"
                    fill="transparent"
                    stroke="#f5f5f4"
                    strokeWidth="12"
                  />

                  {/* Fatias */}
                  {totalCollaborators > 0 && (
                    <>
                      {/* Ativos */}
                      <circle
                        cx="64"
                        cy="64"
                        r="50"
                        fill="transparent"
                        stroke="#3b82f6"
                        strokeWidth="12"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - activeStatusCount / totalCollaborators)}`}
                        className="transition-all duration-1000"
                      />
                      {/* Em Férias */}
                      <circle
                        cx="64"
                        cy="64"
                        r="50"
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - (activeStatusCount + vacationStatusCount) / totalCollaborators)}`}
                        style={{ transformOrigin: "center" }}
                        className="transition-all duration-1000"
                      />
                    </>
                  )}
                </svg>

                {/* Texto Central */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-stone-700">
                    {totalCollaborators}
                  </span>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                    Total
                  </span>
                </div>
              </div>

              {/* Legenda do Gráfico */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <p className="font-bold text-stone-600">
                      {activeStatusCount} Ativos
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {(totalCollaborators > 0
                        ? (activeStatusCount / totalCollaborators) * 100
                        : 0
                      ).toFixed(0)}
                      %
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="font-bold text-stone-600">
                      {vacationStatusCount} De Férias
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {(totalCollaborators > 0
                        ? (vacationStatusCount / totalCollaborators) * 100
                        : 0
                      ).toFixed(0)}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white p-6 rounded-3xl  shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Barra de Pesquisa */}
            <div className="relative w-full md:max-w-md">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Pesquisar por colaborador, email ou CPF..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200/80 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none  text-stone-700"
              />
            </div>

            {/* Ações de Filtros */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Dropdown Setor */}
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200/80 rounded-2xl px-3 py-1.5 shrink-0">
                <Filter size={14} className="text-stone-400" />
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="bg-transparent text-xs font-bold text-stone-650 focus:outline-none border-none py-1 cursor-pointer"
                >
                  <option value="all">Todos os Setores</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botão de Agrupamento */}
              <button
                onClick={() => setGroupBySector(!groupBySector)}
                className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-2xl border transition-all cursor-pointer ${
                  groupBySector
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50"
                }`}
              >
                <Layers size={14} />
                Agrupar por Setor
              </button>
            </div>
          </div>

          {/* Listas de Colaboradores */}
          <div className="w-full">
            {groupBySector ? (
              // Agrupamento por Setor
              <div className="space-y-8">
                {departments
                  .filter(
                    (dept) =>
                      selectedSector === "all" || dept.id === selectedSector,
                  )
                  .map((dept) => {
                    // Obter lista de colaboradores deste setor filtrando pela barra de pesquisa
                    const deptColabs: Collaborator[] = [];
                    dept.positions.forEach((pos) => {
                      pos.users.forEach((u) => {
                        // Cast para bater com Collaborator interface
                        deptColabs.push({
                          id: u.id,
                          name: u.name,
                          email: u.email,
                          cpf: u.cpf,
                          avatar: u.avatar,
                          role: u.role,
                          status: u.status,
                          jobPosition: {
                            name: pos.name,
                            department: {
                              id: dept.id,
                              name: dept.name,
                            },
                          },
                        });
                      });
                    });

                    const filteredDeptColabs =
                      getFilteredCollaborators(deptColabs);

                    if (filteredDeptColabs.length === 0) return null;

                    return (
                      <div
                        key={dept.id}
                        className="space-y-3 bg-white p-6 rounded-3xl  shadow-lg"
                      >
                        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                          <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                            <Building2 className="text-blue-500" size={16} />
                            {dept.name}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                            {filteredDeptColabs.length} colaboradores
                          </span>
                        </div>
                        <Table
                          columns={columns}
                          data={filteredDeptColabs}
                          keyExtractor={(c) => c.id}
                          notShadow={true}
                        />
                      </div>
                    );
                  })}

                {/* Verificar se há colaboradores sem setor correspondentes à busca */}
                {(() => {
                  const unassignedColabs = collaborators.filter(
                    (c) => !c.jobPosition,
                  );
                  const filteredUnassigned =
                    getFilteredCollaborators(unassignedColabs);

                  if (filteredUnassigned.length === 0) return null;

                  return (
                    <div className="space-y-3 bg-white p-6 rounded-3xl  shadow-lg">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                        <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                          <Layers className="text-stone-400" size={16} />
                          Colaboradores sem Setor
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500">
                          {filteredUnassigned.length} colaboradores
                        </span>
                      </div>
                      <Table
                        columns={columns}
                        data={filteredUnassigned}
                        keyExtractor={(c) => c.id}
                      />
                    </div>
                  );
                })()}

                {/* Empty state caso nenhum setor/colaborador bata com a busca */}
                {filteredList.length === 0 && (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-2 bg-white rounded-3xl  shadow-lg">
                    <Search size={32} className="text-stone-300" />
                    <p className="text-stone-500 font-semibold text-sm">
                      Nenhum colaborador encontrado
                    </p>
                    <p className="text-stone-400 text-xs">
                      Tente ajustar seus termos de pesquisa ou filtros.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Lista plana de Colaboradores
              <div className="bg-white p-6 rounded-3xl  shadow-lg">
                {filteredList.length > 0 ? (
                  <Table
                    columns={columns}
                    data={filteredList}
                    keyExtractor={(c) => c.id}
                  />
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
                    <Search size={32} className="text-stone-300" />
                    <p className="text-stone-500 font-semibold text-sm">
                      Nenhum colaborador encontrado
                    </p>
                    <p className="text-stone-400 text-xs">
                      Tente ajustar seus termos de pesquisa ou filtros.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Componente Férias Integrado
        <CentralFerias />
      )}
    </SectionComponent>
  );
}
