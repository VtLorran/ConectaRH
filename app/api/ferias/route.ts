import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { VacationStatus } from "@prisma/client";

// Função auxiliar para autenticar o usuário a partir do cookie
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

// GET: Retorna as solicitações de férias
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get("userId");
    const queryStatus = searchParams.get("status");

    // Se o usuário não for ADMIN, ele só pode ver as suas próprias férias
    let targetUserId = queryUserId;
    if (user.role !== "ADMIN") {
      targetUserId = user.userID;
    }

    const whereClause: any = {};
    if (targetUserId) {
      whereClause.userId = targetUserId;
    }
    if (queryStatus) {
      whereClause.status = queryStatus as VacationStatus;
    }

    const vacations = await prisma.vacation.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true,
            jobPosition: {
              select: {
                name: true,
                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    console.log("GET /api/ferias - Count:", vacations.length);
    if (vacations.length > 0) {
      console.log("GET /api/ferias - First record user jobPosition:", JSON.stringify(vacations[0].user?.jobPosition, null, 2));
    }

    return NextResponse.json({ success: true, data: vacations });
  } catch (error) {
    console.error("Erro na rota GET /api/ferias:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}

// POST: Cria uma solicitação ou registro de férias
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate, comment } = body;
    let { userId, status } = body;

    // Se não for admin, o userId é sempre o do próprio usuário logado
    if (user.role !== "ADMIN") {
      userId = user.userID;
      status = "PENDING"; // Usuário comum só pode solicitar (pendente)
    } else {
      // Se for admin, o userId é obrigatório e status pode ser especificado (padrão PENDING)
      if (!userId) {
        return NextResponse.json({ success: false, message: "O ID do colaborador é obrigatório" }, { status: 400 });
      }
      if (!status) {
        status = "PENDING";
      }
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ success: false, message: "Datas de início e fim são obrigatórias" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ success: false, message: "Datas inválidas fornecidas" }, { status: 400 });
    }

    if (end < start) {
      return NextResponse.json({ success: false, message: "A data de fim deve ser posterior à data de início" }, { status: 400 });
    }

    // Verificar sobreposição de férias para este colaborador (desconsiderando solicitações rejeitadas)
    const overlappingVacations = await prisma.vacation.findFirst({
      where: {
        userId,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          {
            // Caso 1: A nova data está contida em férias existentes
            startDate: { lte: start },
            endDate: { gte: start },
          },
          {
            // Caso 2: O fim da nova data está contido em férias existentes
            startDate: { lte: end },
            endDate: { gte: end },
          },
          {
            // Caso 3: As férias existentes estão totalmente contidas nas novas datas
            startDate: { gte: start },
            endDate: { lte: end },
          },
        ],
      },
    });

    if (overlappingVacations) {
      return NextResponse.json({
        success: false,
        message: "Já existe uma solicitação ou férias ativas/agendadas nesse período para este colaborador."
      }, { status: 400 });
    }

    // Cria a férias
    const newVacation = await prisma.vacation.create({
      data: {
        userId,
        startDate: start,
        endDate: end,
        comment: comment || null,
        status: status as VacationStatus,
        approvedById: status === "APPROVED" ? user.userID : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Se o admin registrou férias já aprovadas que estão ocorrendo hoje, atualiza o status do colaborador
    if (status === "APPROVED") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkStart = new Date(start);
      checkStart.setHours(0, 0, 0, 0);
      const checkEnd = new Date(end);
      checkEnd.setHours(23, 59, 59, 999);

      if (today >= checkStart && today <= checkEnd) {
        await prisma.user.update({
          where: { id: userId },
          data: { status: "VACATION" },
        });
      }
    }

    return NextResponse.json({ success: true, data: newVacation });
  } catch (error) {
    console.error("Erro na rota POST /api/ferias:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
