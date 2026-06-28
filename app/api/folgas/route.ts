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

// GET: Retorna as solicitações de folgas
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get("userId");
    const queryStatus = searchParams.get("status");

    // Se o usuário não for ADMIN, ele só pode ver as suas próprias folgas
    let targetUserId = queryUserId;
    if (user.role !== "ADMIN") {
      targetUserId = user.userID;
    }

    const whereClause: any = {};
    if (targetUserId) {
      whereClause.userId = targetUserId;
    }
    if (queryStatus) {
      whereClause.status = queryStatus as DayOffStatus;
    }

    const dayOffs = await prisma.dayOff.findMany({
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

    return NextResponse.json({ success: true, data: dayOffs });
  } catch (error) {
    console.error("Erro na rota GET /api/folgas:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}

// POST: Cria uma solicitação ou registro de folga
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
      status = "PENDING"; // Colaborador só pode solicitar (pendente)
    } else {
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

    // Verificar sobreposição de folgas para este colaborador
    const overlappingDayOffs = await prisma.dayOff.findFirst({
      where: {
        userId,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          {
            startDate: { lte: start },
            endDate: { gte: start },
          },
          {
            startDate: { lte: end },
            endDate: { gte: end },
          },
          {
            startDate: { gte: start },
            endDate: { lte: end },
          },
        ],
      },
    });

    if (overlappingDayOffs) {
      return NextResponse.json({
        success: false,
        message: "Já existe uma solicitação ou período de folga ativa/agendada nesse período para este colaborador."
      }, { status: 400 });
    }

    // Cria a folga
    const newDayOff = await prisma.dayOff.create({
      data: {
        userId,
        startDate: start,
        endDate: end,
        comment: comment || null,
        status: status as DayOffStatus,
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

    // Se o admin criou diretamente como APPROVED, cria o período de folga específico na escala de trabalho
    if (status === "APPROVED" && user.role === "ADMIN") {
      const tempDays: Record<string, { trabalha: boolean; horas: number }> = {};
      const curr = new Date(start);
      while (curr <= end) {
        const dateString = curr.toISOString().split("T")[0];
        tempDays[dateString] = { trabalha: false, horas: 0 };
        curr.setDate(curr.getDate() + 1);
      }

      await prisma.workSchedule.create({
        data: {
          userId,
          type: "SPECIFIC",
          startDate: start,
          endDate: end,
          description: `Folga Aprovada (ID: ${newDayOff.id})`,
          scheduleData: { dias: tempDays },
        },
      });
    }

    // Criar notificações
    const formatDate = (d: Date) => {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };
    const formattedStart = formatDate(start);
    const formattedEnd = formatDate(end);

    if (user.role === "ADMIN") {
      // RH cadastrou folga manualmente, notifica o USER
      await prisma.notification.create({
        data: {
          userId,
          title: "Foi adicionado um novo período de folga para você.",
          description: `Período: ${formattedStart} até ${formattedEnd}`,
          link: "/folgas",
          read: false,
        },
      });
    } else {
      // USER solicitou folga, notifica todos os ADMINs
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
      });
      await Promise.all(
        admins.map((admin) =>
          prisma.notification.create({
            data: {
              userId: admin.id,
              title: `${newDayOff.user.name} solicitou uma folga.`,
              description: `Período: ${formattedStart} até ${formattedEnd}`,
              link: `/colaboradores/${userId}?tab=folgas`,
              read: false,
            },
          })
        )
      );
    }

    return NextResponse.json({ success: true, data: newDayOff });
  } catch (error) {
    console.error("Erro na rota POST /api/folgas:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
