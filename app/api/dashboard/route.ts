import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const [
      underReviewCount,
      activeCount,
      invitedCount,
      candidatesUnderReview,
      recentApprovals
    ] = await Promise.all([
      prisma.admission.count({
        where: { status: "UNDER_REVIEW" },
      }),

      prisma.admission.count({
        where: { status: "ACTIVE" },
      }),

      prisma.admission.count({
        where: { status: "INVITED" },
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

    return NextResponse.json(
      {
        success: true,
        data: {
          cards: {
            underReview: underReviewCount,
            active: activeCount,
            invited: invitedCount,
          },
          reviewList: candidatesUnderReview,
          recentApprovals: recentApprovals,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor ao carregar dashboard." },
      { status: 500 }
    );
  }
}