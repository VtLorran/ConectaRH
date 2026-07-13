import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch database stats in parallel
    const [
      company,
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalSectors,
      sectorsDistribution,
      admissions,
      documentRequests,
      generalDocsCount,
      timeRecordsTotal,
      timeRecordsToday,
      pendingTimeRecords,
      dayOffsTotal,
      dayOffsPending,
      dayOffsApproved,
      dayOffsRejected,
      reviewList,
      invitedList,
      recentApprovals,
    ] = await Promise.all([
      // 1. Company Data
      prisma.companyData.findFirst(),

      // 2. Colaboradores
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: { not: "ACTIVE" } } }),
      prisma.department.count(),

      // 3. Distribuição por Setor
      prisma.department.findMany({
        select: {
          name: true,
          positions: {
            select: {
              _count: {
                select: {
                  users: true,
                },
              },
            },
          },
        },
      }),

      // 4. Admissões
      prisma.admission.findMany({
        select: {
          status: true,
        },
      }),

      // 5. Onboarding
      prisma.documentRequest.findMany({
        select: {
          requirements: true,
          answers: true,
        },
      }),

      // 6. Documentos Gerais
      prisma.document.count(),

      // 7. Controle de Ponto
      prisma.timeRecord.count(),
      prisma.timeRecord.count({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.timeRecord.count({
        where: {
          date: {
            lt: today,
          },
          OR: [
            { entryTime: null },
            { exitTime: null },
          ],
        },
      }),

      // 8. Folgas
      prisma.dayOff.count(),
      prisma.dayOff.count({ where: { status: "PENDING" } }),
      prisma.dayOff.count({ where: { status: "APPROVED" } }),
      prisma.dayOff.count({ where: { status: { in: ["REJECTED", "CANCELLED"] } } }),

      // 9. Admissões detalhadas para o painel de admissão
      prisma.admission.findMany({
        where: { status: "UNDER_REVIEW" },
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          candidateAvatar: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.admission.findMany({
        where: { status: "INVITED" },
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          candidateAvatar: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
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
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ]);

    // Map sectors distribution
    const sectorStats = sectorsDistribution.map((dept) => {
      let count = 0;
      dept.positions.forEach((pos) => {
        count += pos._count.users;
      });
      return {
        name: dept.name,
        value: count,
      };
    }).filter((stat) => stat.value > 0); // Only return sectors that have employees for better charting

    // If no sectors have employees, fallback to showing all sectors with 0
    const finalSectorStats = sectorStats.length > 0 
      ? sectorStats 
      : sectorsDistribution.map((d) => ({ name: d.name, value: 0 }));

    // Calculate admissions breakdown
    const admissionsTotal = admissions.length;
    const admissionsUnderReview = admissions.filter((a) => a.status === "UNDER_REVIEW").length;
    const admissionsInvited = admissions.filter((a) => a.status === "INVITED").length;
    const admissionsActive = admissions.filter((a) => a.status === "ACTIVE").length;

    // Calculate onboarding breakdown
    const activeOnboardings = documentRequests.length;
    let onboardingsCompleted = 0;
    let onboardingsInProgress = 0;
    let totalPendingRequirements = 0;
    let totalProgressSum = 0;
    let onboardingDocsCount = 0;

    documentRequests.forEach((req) => {
      const answers = (req.answers as any[]) || [];
      const totalReqs = req.requirements ? (req.requirements as any[]).length : 0;
      
      let approvedCount = 0;
      let submittedCount = 0;

      answers.forEach((ans: any) => {
        const status = ans.status || "pending";
        if (status === "approved") {
          approvedCount++;
        } else if (status === "submitted") {
          submittedCount++;
        } else {
          totalPendingRequirements++;
        }

        if (ans.type === "file" && ans.value) {
          onboardingDocsCount++;
        }
      });

      const completedCount = approvedCount + submittedCount;
      const progress = totalReqs > 0 ? (completedCount / totalReqs) * 100 : 0;
      totalProgressSum += progress;

      if (approvedCount === totalReqs && totalReqs > 0) {
        onboardingsCompleted++;
      } else {
        onboardingsInProgress++;
      }
    });

    const averageOnboardingProgress = activeOnboardings > 0 
      ? Math.round(totalProgressSum / activeOnboardings) 
      : 0;

    const totalStoredDocuments = generalDocsCount + onboardingDocsCount;

    return NextResponse.json({
      success: true,
      data: {
        company: company ? {
          nomeFantasia: company.nomeFantasia,
          razaoSocial: company.razaoSocial,
          cnpj: company.cnpj,
          segmento: company.segmento,
          dataFundacao: company.dataFundacao,
          logoPreview: company.logoPreview,
          createdAt: company.createdAt,
        } : null,
        collaborators: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          sectors: totalSectors,
          distribution: finalSectorStats,
        },
        admissions: {
          total: admissionsTotal,
          underReview: admissionsUnderReview,
          invited: admissionsInvited,
          active: admissionsActive,
        },
        onboarding: {
          active: activeOnboardings,
          completed: onboardingsCompleted,
          inProgress: onboardingsInProgress,
          pendingItems: totalPendingRequirements,
          averageProgress: averageOnboardingProgress,
        },
        documents: {
          total: totalStoredDocuments,
        },
        ponto: {
          total: timeRecordsTotal,
          today: timeRecordsToday,
          pending: pendingTimeRecords,
        },
        folgas: {
          total: dayOffsTotal,
          pending: dayOffsPending,
          approved: dayOffsApproved,
          rejected: dayOffsRejected,
        },
        // Adicionado para suportar a tela de Admissões
        cards: {
          underReview: admissionsUnderReview,
          active: admissionsActive,
          invited: admissionsInvited,
        },
        reviewList,
        invitedList,
        recentApprovals,
      }
    });
  } catch (error: any) {
    console.error("Erro ao carregar dados do dashboard do ADMIN:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor ao carregar dados do painel." },
      { status: 500 }
    );
  }
}
