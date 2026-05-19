import { Eye } from "lucide-react";
import Link from "next/link";

interface Candidate {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string | null;
}

interface ReviewListProps {
  candidates: Candidate[];
}

export function ReviewList({ candidates }: ReviewListProps) {
  return (
    <div className="flex-1 bg-white rounded-2xl shadow-xl p-6 border border-stone-100">
      <div className="border-b border-stone-100 pb-4 mb-4">
        <h2 className="text-lg font-bold text-stone-700">
          Colaboradores em Análise
        </h2>
        <p className="text-sm text-stone-500">
          Revise os dados e aprove as contratações pendentes.
        </p>
      </div>

      <div className="flex flex-col">
        {candidates.length === 0 ? (
          <p className="text-sm text-stone-500 py-6 text-center italic">
            Nenhum colaborador aguardando análise no momento.
          </p>
        ) : (
          candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="flex items-center justify-between py-4 border-b border-stone-50 last:border-0"
            >
              <div className="flex items-center gap-4">
                <img
                  src={
                    candidate.candidateAvatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.candidateName)}&background=F5F5F4&color=44403C`
                  }
                  alt={`Avatar de ${candidate.candidateName}`}
                  className="h-12 w-12 rounded-full object-cover border border-stone-200"
                />
                <div>
                  <h3 className="font-semibold text-stone-700">
                    {candidate.candidateName}
                  </h3>
                  <p className="text-sm text-stone-500">
                    {candidate.candidateEmail}
                  </p>
                </div>
              </div>

              <Link
                href={`/admissoes/${candidate.id}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-[#3B82F6] font-semibold rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Eye className="h-4 w-4" />
                Ver
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
