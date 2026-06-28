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

// Obter todas as notificações do usuário logado
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    console.error("Erro ao carregar notificações:", error);
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 });
  }
}

// Modificar notificações (marcar como lidas, deletar)
export async function PUT(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { action, id } = body;

    if (action === "mark-all-read") {
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true }
      });
      return NextResponse.json({ success: true, message: "Todas as notificações marcadas como lidas" });
    }

    if (action === "mark-read") {
      if (!id) {
        return NextResponse.json({ success: false, message: "ID da notificação é obrigatório" }, { status: 400 });
      }
      const updated = await prisma.notification.update({
        where: { id, userId },
        data: { read: true }
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === "delete") {
      if (!id) {
        return NextResponse.json({ success: false, message: "ID da notificação é obrigatório" }, { status: 400 });
      }
      await prisma.notification.delete({
        where: { id, userId }
      });
      return NextResponse.json({ success: true, message: "Notificação excluída com sucesso" });
    }

    return NextResponse.json({ success: false, message: "Ação inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro ao processar alteração de notificação:", error);
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 });
  }
}
