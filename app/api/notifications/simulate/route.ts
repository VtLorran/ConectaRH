import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const decoded = jwt.verify(token, secret) as { userID: string };
    return decoded.userID;
  } catch {
    return null;
  }
}

const templates = [
  {
    title: "Solicitação de Ponto Aprovada 🕒",
    description: "Sua solicitação de ajuste de ponto para o dia 26/06 foi revisada e aprovada pelo gestor de setor.",
    link: "/ponto"
  },
  {
    title: "Nova Mensagem no Chat 💬",
    description: "Você recebeu uma mensagem direta de Ana Silva (Recursos Humanos) referente ao envio de documentos.",
    link: "/chat"
  },
  {
    title: "Documento Assinado com Sucesso 📄",
    description: "O contrato de trabalho atualizado da sua equipe foi assinado por todas as partes e está disponível.",
    link: "/documentos"
  },
  {
    title: "Nova Solicitação de Documento 📤",
    description: "O time de Recursos Humanos solicitou o upload da foto do seu comprovante de residência atualizado.",
    link: "/onboarding"
  },
  {
    title: "Planejamento de Férias Atualizado 🌴",
    description: "Seu gestor direto iniciou o planejamento das suas férias coletivas previstas para o próximo semestre.",
    link: "/ponto"
  },
  {
    title: "Mensagem no Canal Geral 📢",
    description: "Foi postado um novo aviso importante para todos os colaboradores no canal #geral do chat corporativo.",
    link: "/chat"
  }
];

export async function POST() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    // Selecionar um template aleatório
    const template = templates[Math.floor(Math.random() * templates.length)];

    const created = await prisma.notification.create({
      data: {
        userId,
        title: template.title,
        description: template.description,
        link: template.link,
        read: false
      }
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("Erro ao simular notificação:", error);
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 });
  }
}
