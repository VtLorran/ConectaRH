import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { VacationStatus } from "@prisma/client";

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

// PATCH: Atualiza o status de uma solicitação de férias (Aprovar/Recusar/Editar)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, comment, startDate, endDate } = body;

    // Apenas ADMIN pode aprovar/recusar/cancelar solicitações ou alterar as férias de outros colaboradores
    if (user.role !== "ADMIN" && (status === "APPROVED" || status === "REJECTED" || status === "CANCELLED")) {
      return NextResponse.json({ success: false, message: "Apenas administradores podem aprovar, recusar ou cancelar solicitações." }, { status: 403 });
    }

    // Busca a férias atual para validar a existência e obter o userId
    const currentVacation = await prisma.vacation.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!currentVacation) {
      return NextResponse.json({ success: false, message: "Solicitação de férias não encontrada" }, { status: 404 });
    }

    // Se o usuário comum tentar editar suas férias, ele só pode fazer isso se estiver em PENDING
    if (user.role !== "ADMIN" && currentVacation.userId !== user.userID) {
      return NextResponse.json({ success: false, message: "Acesso negado" }, { status: 403 });
    }

    if (user.role !== "ADMIN" && currentVacation.status !== "PENDING") {
      return NextResponse.json({ success: false, message: "Não é possível alterar solicitações que já foram analisadas." }, { status: 400 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status as VacationStatus;
      if (status === "APPROVED" || status === "REJECTED") {
        updateData.approvedById = user.userID;
      }
    }
    if (comment !== undefined) {
      updateData.comment = comment;
    }

    // Se as datas forem alteradas, valida
    let finalStart = currentVacation.startDate;
    let finalEnd = currentVacation.endDate;

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

    // Se as datas foram alteradas, verifica novamente se há sobreposição com outras férias (excluindo a própria)
    if (startDate || endDate) {
      const overlappingVacations = await prisma.vacation.findFirst({
        where: {
          userId: currentVacation.userId,
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

      if (overlappingVacations) {
        return NextResponse.json({
          success: false,
          message: "A alteração de datas resulta em sobreposição com outro período de férias já cadastrado."
        }, { status: 400 });
      }
    }

    // Executa a atualização das férias
    const updatedVacation = await prisma.vacation.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        approvedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    // Atualiza status do colaborador caso as férias passem a estar em andamento
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkStart = new Date(updatedVacation.startDate);
    checkStart.setHours(0, 0, 0, 0);
    const checkEnd = new Date(updatedVacation.endDate);
    checkEnd.setHours(23, 59, 59, 999);

    if (updatedVacation.status === "APPROVED") {
      if (today >= checkStart && today <= checkEnd) {
        // Se as férias são ativas hoje, põe o colaborador em férias
        await prisma.user.update({
          where: { id: updatedVacation.userId },
          data: { status: "VACATION" },
        });
      }
    } else if (updatedVacation.status === "REJECTED" || updatedVacation.status === "CANCELLED") {
      // Se era aprovado e foi rejeitado/cancelado (ou revertido), e o colaborador estava de férias, devolve para ACTIVE
      if (updatedVacation.user.status === "VACATION") {
        await prisma.user.update({
          where: { id: updatedVacation.userId },
          data: { status: "ACTIVE" },
        });
      }
    }

    return NextResponse.json({ success: true, data: updatedVacation });
  } catch (error: any) {
    console.error(`Erro na rota PATCH /api/ferias/[id]:`, error);
    return NextResponse.json({ success: false, message: error?.message || "Erro interno no servidor" }, { status: 500 });
  }
}

// DELETE: Cancela/Exclui uma solicitação de férias
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;

    const vacation = await prisma.vacation.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!vacation) {
      return NextResponse.json({ success: false, message: "Solicitação de férias não encontrada" }, { status: 404 });
    }

    // Se não for admin, só pode excluir suas próprias férias se estiverem PENDING (ainda não aprovadas)
    if (user.role !== "ADMIN") {
      if (vacation.userId !== user.userID) {
        return NextResponse.json({ success: false, message: "Acesso negado" }, { status: 403 });
      }
      if (vacation.status !== "PENDING") {
        return NextResponse.json({ success: false, message: "Você só pode excluir solicitações pendentes." }, { status: 400 });
      }
    }

    // Exclui a férias
    await prisma.vacation.delete({
      where: { id },
    });

    // Se o colaborador estava com status VACATION por causa dessas férias, retorna para ACTIVE
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkStart = new Date(vacation.startDate);
    checkStart.setHours(0, 0, 0, 0);
    const checkEnd = new Date(vacation.endDate);
    checkEnd.setHours(23, 59, 59, 999);

    if (vacation.status === "APPROVED" && today >= checkStart && today <= checkEnd) {
      if (vacation.user.status === "VACATION") {
        await prisma.user.update({
          where: { id: vacation.userId },
          data: { status: "ACTIVE" },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Solicitação de férias excluída com sucesso" });
  } catch (error) {
    console.error(`Erro na rota DELETE /api/ferias/[id]:`, error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
