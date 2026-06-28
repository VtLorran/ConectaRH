import Image from "next/image";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import logoHorizontal from "@/public/conectaRH_horizontal.png";

export default function Footer() {
  return (
    <footer className="w-full bg-white -mb-4 border border-stone-200/80 rounded-2xl p-6 md:p-8 mt-8 shadow-sm">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 pb-8 border-b border-stone-200/60">
          
          {/* Logo e Informações de Contato */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Image
                src={logoHorizontal}
                alt="ConectaRH Logo"
                width={140}
                height={35}
                className="h-8 w-auto object-contain"
                priority
              />
            </div>
            <p className="text-sm text-stone-500 max-w-xs leading-relaxed">
              Plataforma inteligente de Recursos Humanos para conectar e impulsionar o talento da sua empresa.
            </p>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="text-sm font-semibold text-stone-850 uppercase tracking-wider mb-4">
              Empresa
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-sm text-stone-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-blue-500 transition-colors shrink-0" />
                  Sobre
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-stone-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-blue-500 transition-colors shrink-0" />
                  Carreiras
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-stone-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-blue-500 transition-colors shrink-0" />
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h3 className="text-sm font-semibold text-stone-850 uppercase tracking-wider mb-4">
              Recursos
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-sm text-stone-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-blue-500 transition-colors shrink-0" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/documentos" className="text-sm text-stone-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-blue-500 transition-colors shrink-0" />
                  Documentos
                </Link>
              </li>
              <li>
                <Link href="/colaboradores" className="text-sm text-stone-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-blue-500 transition-colors shrink-0" />
                  Colaboradores
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-stone-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-blue-500 transition-colors shrink-0" />
                  Relatórios
                </Link>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="text-sm font-semibold text-stone-850 uppercase tracking-wider mb-4">
              Suporte
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-sm text-stone-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-blue-500 transition-colors shrink-0" />
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-stone-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-blue-500 transition-colors shrink-0" />
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-stone-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-blue-500 transition-colors shrink-0" />
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-stone-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-blue-500 transition-colors shrink-0" />
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Linha Inferior com Redes Sociais, Copyright, Contato Rápido e Versão */}
        <div className="mt-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Contato Direto */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm text-stone-500">
            <a href="mailto:contato@empresa.com" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
              <Mail className="h-4 w-4 text-stone-400" />
              contato@empresa.com
            </a>
            <span className="hidden sm:inline text-stone-300">|</span>
            <a href="tel:+5586999999999" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
              <Phone className="h-4 w-4 text-stone-400" />
              (86) 99999-9999
            </a>
          </div>

          {/* Redes Sociais (Instagram | LinkedIn | GitHub) */}
          <div className="flex items-center gap-3">
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200/60 text-sm text-stone-600 hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50/30 transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <span className="text-xs font-medium">Instagram</span>
            </a>
            <span className="text-stone-300 text-xs">|</span>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200/60 text-sm text-stone-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
              <span className="text-xs font-medium">LinkedIn</span>
            </a>
            <span className="text-stone-300 text-xs">|</span>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200/60 text-sm text-stone-600 hover:text-stone-900 hover:border-stone-400 hover:bg-stone-50 transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
              <span className="text-xs font-medium">GitHub</span>
            </a>
          </div>
        </div>

        {/* Direitos Reservados e Versão */}
        <div className="mt-6 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <div>
            © 2026 Empresa. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200/50 px-2.5 py-1 rounded-md text-stone-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Versão 1.0.0
          </div>
        </div>

      </div>
    </footer>
  );
}
