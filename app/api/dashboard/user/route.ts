import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

async function getAuthUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const decoded = jwt.verify(token, secret) as { userID: string; role: string };
    return decoded;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const userId = authUser.userID;

    // Buscar dados em paralelo
    const [user, nextDayOff, lastTimeRecord, company] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          status: true,
          createdAt: true,
          jobPosition: {
            select: {
              name: true,
              department: {
                select: {
                  name: true,
                },
              },
            },
          },
          documentRequests: {
            select: {
              id: true,
              answers: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      }),

      // Próxima folga aprovada (data >= hoje)
      prisma.dayOff.findFirst({
        where: {
          userId,
          status: "APPROVED",
          startDate: { gte: new Date() },
        },
        orderBy: { startDate: "asc" },
        select: {
          startDate: true,
          endDate: true,
        },
      }),

      // Último registro de ponto
      prisma.timeRecord.findFirst({
        where: { userId },
        orderBy: { date: "desc" },
        select: {
          date: true,
          entryTime: true,
          exitTime: true,
        },
      }),

      // Dados da empresa (apenas nome)
      prisma.companyData.findFirst({
        select: {
          nomeFantasia: true,
          logoPreview: true,
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ success: false, message: "Usuário não encontrado" }, { status: 404 });
    }

    // Calcular pendências de onboarding
    let totalOnboardingItems = 0;
    let pendingOnboardingItems = 0;
    let submittedOnboardingItems = 0;
    let approvedOnboardingItems = 0;

    user.documentRequests.forEach((req) => {
      const answers = (req.answers as any[]) || [];
      answers.forEach((ans: any) => {
        totalOnboardingItems++;
        const status = ans.status || "pending";
        if (status === "pending" || status === "rejected") {
          pendingOnboardingItems++;
        } else if (status === "submitted") {
          submittedOnboardingItems++;
        } else if (status === "approved") {
          approvedOnboardingItems++;
        }
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          status: user.status,
          createdAt: user.createdAt,
          jobPosition: user.jobPosition?.name || null,
          department: user.jobPosition?.department?.name || null,
        },
        company: {
          name: company?.nomeFantasia || "Empresa",
          logo: company?.logoPreview || null,
        },
        onboarding: {
          total: totalOnboardingItems,
          pending: pendingOnboardingItems,
          submitted: submittedOnboardingItems,
          approved: approvedOnboardingItems,
        },
        nextDayOff: nextDayOff
          ? { startDate: nextDayOff.startDate, endDate: nextDayOff.endDate }
          : null,
        lastTimeRecord: lastTimeRecord
          ? {
              date: lastTimeRecord.date,
              entryTime: lastTimeRecord.entryTime,
              exitTime: lastTimeRecord.exitTime,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Erro na rota GET /api/dashboard/user:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
