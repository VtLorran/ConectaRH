import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { DayOffStatus } from "@prisma/client";

async function getAuthUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const decoded = jwt.verify(token, secret) as { userID: string; role: string; cpf?: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// PATCH: Atualiza o status de uma solicitação de folga (Aprovar/Recusar)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<any> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, comment, startDate, endDate } = body;

    // Apenas ADMIN pode aprovar/recusar/cancelar solicitações
    if (user.role !== "ADMIN" && (status === "APPROVED" || status === "REJECTED" || status === "CANCELLED")) {
      return NextResponse.json({ success: false, message: "Apenas administradores podem aprovar, recusar ou cancelar solicitações." }, { status: 403 });
    }

    const currentDayOff = await prisma.dayOff.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!currentDayOff) {
      return NextResponse.json({ success: false, message: "Solicitação de folga não encontrada" }, { status: 404 });
    }

    // Se o usuário comum tentar editar, ele só pode fazer isso se for o proprietário e estiver em PENDING
    if (user.role !== "ADMIN" && currentDayOff.userId !== user.userID) {
      return NextResponse.json({ success: false, message: "Acesso negado" }, { status: 403 });
    }

    if (user.role !== "ADMIN" && currentDayOff.status !== "PENDING") {
      return NextResponse.json({ success: false, message: "Não é possível alterar solicitações que já foram analisadas." }, { status: 400 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status as DayOffStatus;
      if (status === "APPROVED" || status === "REJECTED") {
        updateData.approvedById = user.userID;
      }
    }
    if (comment !== undefined) {
      updateData.comment = comment;
    }

    let finalStart = currentDayOff.startDate;
    let finalEnd = currentDayOff.endDate;

    if (startDate) {
      finalStart = new Date(startDate);
      if (isNaN(finalStart.getTime())) {
        return NextResponse.json({ success: false, message: "Data de início inválida" }, { status: 400 });
      }
      updateData.startDate = finalStart;
    }
    if (endDate) {
      finalEnd = new Date(endDate);
      if (isNaN(finalEnd.getTime())) {
        return NextResponse.json({ success: false, message: "Data de fim inválida" }, { status: 400 });
      }
      updateData.endDate = finalEnd;
    }

    if (finalEnd < finalStart) {
      return NextResponse.json({ success: false, message: "A data de fim deve ser posterior à data de início" }, { status: 400 });
    }

    // Se datas mudaram, valida sobreposição
    if (startDate || endDate) {
      const overlappingDayOffs = await prisma.dayOff.findFirst({
        where: {
          userId: currentDayOff.userId,
          id: { not: id },
          status: { in: ["PENDING", "APPROVED"] },
          OR: [
            {
              startDate: { lte: finalStart },
              endDate: { gte: finalStart },
            },
            {
              startDate: { lte: finalEnd },
              endDate: { gte: finalEnd },
            },
            {
              startDate: { gte: finalStart },
              endDate: { lte: finalEnd },
            },
          ],
        },
      });

      if (overlappingDayOffs) {
        return NextResponse.json({
          success: false,
          message: "A alteração de datas resulta em sobreposição com outro período de folga já cadastrado."
        }, { status: 400 });
      }
    }

    // Executa a atualização da folga
    const updatedDayOff = await prisma.dayOff.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Se aprovado, insere a semana específica de folga na escala
    if (status === "APPROVED") {
      // 1. Gera os dias de folga no período
      const tempDays: Record<string, { trabalha: boolean; horas: number }> = {};
      const curr = new Date(updatedDayOff.startDate);
      const end = new Date(updatedDayOff.endDate);
      while (curr <= end) {
        const dateString = curr.toISOString().split("T")[0];
        tempDays[dateString] = { trabalha: false, horas: 0 };
        curr.setDate(curr.getDate() + 1);
      }

      // 2. Remove escalas específicas anteriores vinculadas a essa folga se existirem
      await prisma.workSchedule.deleteMany({
        where: {
          userId: updatedDayOff.userId,
          description: `Folga Aprovada (ID: ${id})`,
        },
      });

      // 3. Cria a nova escala específica de folga
      await prisma.workSchedule.create({
        data: {
          userId: updatedDayOff.userId,
          type: "SPECIFIC",
          startDate: updatedDayOff.startDate,
          endDate: updatedDayOff.endDate,
          description: `Folga Aprovada (ID: ${id})`,
          scheduleData: { dias: tempDays },
        },
      });

      // 4. Cria a notificação para o usuário
      await prisma.notification.create({
        data: {
          userId: updatedDayOff.userId,
          title: "Sua solicitação de folga foi aprovada.",
          description: `Período aprovado com sucesso de ${new Date(updatedDayOff.startDate).toLocaleDateString("pt-BR")} até ${new Date(updatedDayOff.endDate).toLocaleDateString("pt-BR")}.`,
          link: "/folgas",
          read: false,
        },
      });
    } else if (status === "REJECTED" || status === "CANCELLED") {
      // Remove escala específica se existir
      await prisma.workSchedule.deleteMany({
        where: {
          userId: updatedDayOff.userId,
          description: `Folga Aprovada (ID: ${id})`,
        },
      });

      // Cria a notificação de recusa/cancelamento
      if (status === "REJECTED") {
        await prisma.notification.create({
          data: {
            userId: updatedDayOff.userId,
            title: "Sua solicitação de folga foi recusada.",
            description: comment ? `Motivo: ${comment}` : `Sua solicitação de folga foi analisada e recusada pelo RH.`,
            link: "/folgas",
            read: false,
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: updatedDayOff });
  } catch (error: any) {
    console.error(`Erro na rota PATCH /api/folgas/[id]:`, error);
    return NextResponse.json({ success: false, message: error?.message || "Erro interno no servidor" }, { status: 500 });
  }
}

// DELETE: Cancela/Exclui uma solicitação de folga
export async function DELETE(
  request: Request,
  { params }: { params: Promise<any> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;

    const dayOff = await prisma.dayOff.findUnique({
      where: { id },
    });

    if (!dayOff) {
      return NextResponse.json({ success: false, message: "Solicitação de folga não encontrada" }, { status: 404 });
    }

    // Se não for admin, só pode excluir se for o proprietário e a solicitação estiver em PENDING
    if (user.role !== "ADMIN") {
      if (dayOff.userId !== user.userID) {
        return NextResponse.json({ success: false, message: "Acesso negado" }, { status: 403 });
      }
      if (dayOff.status !== "PENDING") {
        return NextResponse.json({ success: false, message: "Você só pode excluir solicitações pendentes." }, { status: 400 });
      }
    }

    // Remove escalas específicas vinculadas se existirem
    await prisma.workSchedule.deleteMany({
      where: {
        userId: dayOff.userId,
        description: `Folga Aprovada (ID: ${id})`,
      },
    });

    // Exclui o registro de folga
    await prisma.dayOff.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Solicitação de folga excluída com sucesso" });
  } catch (error) {
    console.error(`Erro na rota DELETE /api/folgas/[id]:`, error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
