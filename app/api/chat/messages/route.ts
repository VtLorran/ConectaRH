import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cleanupExpiredMessages } from "@/lib/chat";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ success: false, message: "Parâmetro userId é obrigatório" }, { status: 400 });
    }

    // Executa a limpeza de mensagens expiradas em segundo plano para otimizar a resposta
    cleanupExpiredMessages().catch((err) => console.error("Erro na limpeza de mensagens:", err));

    // Busca o histórico de mensagens entre o usuário atual e o targetUserId
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUser.id },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Erro na rota GET /api/chat/messages:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content } = body;

    if (!receiverId || !content || content.trim() === "") {
      return NextResponse.json({ success: false, message: "Destinatário e conteúdo são obrigatórios" }, { status: 400 });
    }

    if (currentUser.id === receiverId) {
      return NextResponse.json({ success: false, message: "Você não pode enviar mensagens para si mesmo" }, { status: 400 });
    }

    // Busca o destinatário
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, role: true },
    });

    if (!receiver) {
      return NextResponse.json({ success: false, message: "Destinatário não encontrado" }, { status: 404 });
    }

    // Regra: Colaboradores comuns só podem mandar mensagens para os administradores (RH e DP)
    if (currentUser.role !== "ADMIN" && receiver.role !== "ADMIN") {
      return NextResponse.json({
        success: false,
        message: "Você só pode enviar mensagens para administradores (RH e DP).",
      }, { status: 403 });
    }

    // Cria a mensagem no banco
    const newMessage = await prisma.message.create({
      data: {
        senderId: currentUser.id,
        receiverId,
        content: content.trim(),
      },
    });

    // Executa a limpeza em segundo plano
    cleanupExpiredMessages().catch((err) => console.error("Erro na limpeza de mensagens:", err));

    return NextResponse.json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    console.error("Erro na rota POST /api/chat/messages:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
