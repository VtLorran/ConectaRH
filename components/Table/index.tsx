import React, { ReactNode } from "react";

export interface Column<T> {
  label: string;
  field?: keyof T | ((row: T) => ReactNode);
  render?: (row: T) => ReactNode;
  align?: "left" | "center" | "right";
}

interface TableProps<T> {
  title?: string;
  description?: string;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  notShadow?: boolean;
}

export function Table<T>({
  title,
  description,
  columns,
  data = [],
  keyExtractor,
  emptyMessage = "Nenhum dado encontrado.",
  notShadow
}: TableProps<T>) {
  return (
    <div className={`flex-1 bg-white rounded-2xl ${notShadow === false ? "shadow-xl" : ""} p-6 border border-stone-100 overflow-x-auto`}>
      {(title || description) && (
        <div className="border-b border-stone-100 pb-4 mb-4">
          {title && (
            <h2 className="text-lg font-bold text-stone-700">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-stone-500">{description}</p>
          )}
        </div>
      )}

      <table className="w-full text-left border-collapse min-w-full">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className={`pb-3 px-4 first:pl-0 last:pr-0 font-semibold text-stone-400 text-xs uppercase tracking-wider border-b border-stone-100 text-${col.align || "left"}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-sm text-stone-500 py-8 text-center italic px-4 first:pl-0 last:pr-0"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50 transition-colors"
              >
                {columns.map((col, index) => (
                  <td
                    key={index}
                    className={`py-4 px-4 first:pl-0 last:pr-0 align-middle text-${col.align || "left"}`}
                  >
                    <span className="text-sm text-stone-700 font-medium">
                      {col.render
                        ? col.render(row)
                        : typeof col.field === "function"
                          ? col.field(row)
                          : col.field
                            ? (row[col.field] as ReactNode)
                            : null}
                    </span>
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
