"use client";

import { useEffect, useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import SectionComponent from "@/components/SectionComponent";
import TittleHeader from "@/components/TittleHeader";
import Breadcrumb from "@/components/Breadcrumb";
import CalendarTab from "@/app/(dashboard)/colaboradores/[id]/_components/Calendar";

interface UserProfile {
  id: string;
  name: string;
}

export default function MinhaEscalaPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/auth/me");
        const result = await response.json();
        if (result.success && result.data) {
          setUser(result.data);
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const navigation = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Minha Escala", href: "/escala" }
  ];

  return (
    <SectionComponent>
      <TittleHeader tittle="Minha Escala de Trabalho" className="w-full" />
      <div className="w-full">
        <Breadcrumb items={navigation} />
      </div>

      <div className="w-full bg-white rounded-3xl shadow-xl border border-stone-100 p-8 mt-6">
        <h3 className="text-md font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2 mb-6">
          <Calendar className="text-blue-500" size={20} />
          Meu Calendário de Trabalho
        </h3>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-stone-400 text-sm font-medium">Carregando escala...</p>
          </div>
        ) : user ? (
          <div className="w-full">
            <CalendarTab collaboratorId={user.id} readOnly={true} />
          </div>
        ) : (
          <div className="py-12 text-center text-stone-500 text-sm">
            Erro ao carregar dados do colaborador. Por favor, recarregue a página.
          </div>
        )}
      </div>
    </SectionComponent>
  );
}
