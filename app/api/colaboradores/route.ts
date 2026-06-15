import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        avatar: true,
        role: true,
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
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allApprovedVacations = await prisma.vacation.findMany({
      where: {
        status: "APPROVED",
      },
    });

    const usersWithActiveVacation = new Set(
      allApprovedVacations
        .filter((v) => {
          const start = new Date(v.startDate);
          const end = new Date(v.endDate);
          const utcStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
          const utcEnd = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59);
          return today >= utcStart && today <= utcEnd;
        })
        .map((v) => v.userId)
    );

    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const hasActive = usersWithActiveVacation.has(user.id);
        let currentStatus = user.status;

        if (hasActive && user.status === "ACTIVE") {
          currentStatus = "VACATION";
          await prisma.user.update({
            where: { id: user.id },
            data: { status: "VACATION" },
          });
        } else if (!hasActive && user.status === "VACATION") {
          currentStatus = "ACTIVE";
          await prisma.user.update({
            where: { id: user.id },
            data: { status: "ACTIVE" },
          });
        }

        return {
          ...user,
          status: currentStatus,
        };
      })
    );

    return NextResponse.json(usersWithStatus, { status: 200 });
  } catch (error) {
    console.error(error, "Erro ao buscar usuários");
    return NextResponse.json(
      {
        error: "Erro interno ao buscar usuários",
      },
      {
        status: 500,
      },
    );
  }
}
