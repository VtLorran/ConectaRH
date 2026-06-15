/**
 * Utilitários de Máscara para o ConectaRH
 * Centraliza a lógica de formatação de CPF e Telefone (Celular/Fixo) brasileiro.
 */

/**
 * Remove qualquer caractere que não seja número.
 */
export function cleanDigits(value: string): string {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

/**
 * Aplica a máscara de CPF: 000.000.000-00
 */
export function formatCPF(value: string): string {
  if (!value) return "";
  const cleanValue = cleanDigits(value);
  const limitedValue = cleanValue.slice(0, 11);

  if (limitedValue.length <= 3) return limitedValue;
  if (limitedValue.length <= 6) {
    return `${limitedValue.slice(0, 3)}.${limitedValue.slice(3)}`;
  }
  if (limitedValue.length <= 9) {
    return `${limitedValue.slice(0, 3)}.${limitedValue.slice(3, 6)}.${limitedValue.slice(6)}`;
  }
  return `${limitedValue.slice(0, 3)}.${limitedValue.slice(3, 6)}.${limitedValue.slice(6, 9)}-${limitedValue.slice(9, 11)}`;
}

/**
 * Aplica a máscara de Telefone brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatPhone(value: string): string {
  if (!value) return "";
  const cleanValue = cleanDigits(value);
  const limitedValue = cleanValue.slice(0, 11);

  if (limitedValue.length <= 2) {
    return limitedValue.length > 0 ? `(${limitedValue}` : "";
  }
  if (limitedValue.length <= 6) {
    return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2)}`;
  }
  if (limitedValue.length <= 10) {
    return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 6)}-${limitedValue.slice(6)}`;
  }
  return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 7)}-${limitedValue.slice(7, 11)}`;
}

/**
 * Aplica a máscara de data brasileira: DD/MM/AAAA
 */
export function formatDate(value: string): string {
  if (!value) return "";
  const cleanValue = cleanDigits(value);
  const limitedValue = cleanValue.slice(0, 8);

  if (limitedValue.length <= 2) return limitedValue;
  if (limitedValue.length <= 4) {
    return `${limitedValue.slice(0, 2)}/${limitedValue.slice(2)}`;
  }
  return `${limitedValue.slice(0, 2)}/${limitedValue.slice(2, 4)}/${limitedValue.slice(4, 8)}`;
}

