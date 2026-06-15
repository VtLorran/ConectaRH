import Link from "next/link";
import React from "react";

// Definindo a estrutura de cada item da trilha
interface BreadcrumbItem {
  label: string;
  href?: string; // Opcional, pois o último item (tela atual) não precisa de link
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3 text-sm font-medium">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="inline-flex items-center">
              {/* Separador: Mostra a setinha antes de todos os itens, exceto o primeiro */}
              {index > 0 && (
                <svg
                  className="mx-2 h-4 w-4 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}

              {isLast ? (
                // Último item: Texto simples cinza escuro (representa a página atual)
                <span
                  className="text-gray-700 font-semibold"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                // Itens anteriores: Links clicáveis com efeito hover
                <Link
                  href={item.href || "#"}
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
