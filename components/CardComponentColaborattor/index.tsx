import React from "react";

interface Props {
  tittle: string;
  description?: string;
  icon: React.ReactNode;
}

export default function CardComponentCollaborator({
  tittle,
  description,
  icon,
}: Props) {
  return (
    <div className="flex items-center bg-white p-4 rounded-2xl border border-stone-100 shadow-sm gap-4 hover:shadow-md transition-shadow w-full h-full">
      <div className="p-3 rounded-xl bg-blue-50/80 text-blue-600 flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div className="flex flex-col gap-0.5 min-w-0">
        <h4 className="text-sm font-bold text-stone-700 tracking-wide truncate">
          {tittle}
        </h4>
        {description && (
          <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
