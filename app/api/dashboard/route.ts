import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const [
      statusCounts,

      candidatesUnderReview,

      recentApprovals,
    ] = await Promise.all([

      prisma.admission.groupBy({
        by: ["status"],
        where: { status: { in: ["UNDER_REVIEW", "ACTIVE", "INVITED"] } },
        _count: { status: true },
      }),

      prisma.admission.findMany({
        where: { status: "UNDER_REVIEW" },
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          candidateAvatar: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 10, 
      }),

      prisma.admission.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          candidateAvatar: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
      }),
    ]);

    const counts = {
      underReview:
        statusCounts.find((s) => s.status === "UNDER_REVIEW")?._count.status ||
        0,
      active:
        statusCounts.find((s) => s.status === "ACTIVE")?._count.status || 0,
      invited:
        statusCounts.find((s) => s.status === "INVITED")?._count.status || 0,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          cards: counts,
          reviewList: candidatesUnderReview,
          recentApprovals: recentApprovals,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno no servidor ao carregar dashboard.",
      },
      { status: 500 },
    );
  }
}
