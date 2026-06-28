import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { sendOnboardingDocumentRejectedEmail } from "@/lib/mail";

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

function cleanAnswers(answers: any) {
  if (!answers || !Array.isArray(answers)) return answers;
  return answers.map((ans: any) => {
    let cleanedValue = ans.value;
    if (typeof ans.value === "string") {
      if (ans.value.startsWith("data:application/pdf;base64,")) {
        cleanedValue = "data:application/pdf;base64,PLACEHOLDER";
      } else if (ans.value.startsWith("data:image/")) {
        const match = ans.value.match(/^(data:image\/[a-zA-Z+.-]+;base64,)/);
        if (match) {
          cleanedValue = `${match[1]}PLACEHOLDER`;
        }
      }
    }
    return {
      ...ans,
      value: cleanedValue
    };
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<any> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;

    const docRequest = await prisma.documentRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true,
          }
        }
      }
    });

    if (!docRequest) {
      return NextResponse.json({ success: false, message: "Requisição não encontrada" }, { status: 404 });
    }

    if (authUser.role !== "ADMIN" && docRequest.userId !== authUser.userID) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...docRequest,
        answers: cleanAnswers(docRequest.answers)
      }
    });
  } catch (error) {
    console.error("Erro na rota GET /api/onboarding/[id]:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<any> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { answers } = body;

    const docRequest = await prisma.documentRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    if (!docRequest) {
      return NextResponse.json({ success: false, message: "Requisição não encontrada" }, { status: 404 });
    }

    if (authUser.role !== "ADMIN" && docRequest.userId !== authUser.userID) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 403 });
    }

    const existingAnswers = (docRequest.answers as any[]) || [];
    let newlyRejectedAnswer: { name: string; feedback: string | null } | null = null;
    let userHasSentResponse = false;
    let responseType = "text";

    const mergedAnswers = answers.map((newAns: any) => {
      const oldAns = existingAnswers.find((oa: any) => oa.name === newAns.name);
      
      let resolvedValue = newAns.value;
      if (typeof newAns.value === "string" && newAns.value.endsWith("PLACEHOLDER")) {
        resolvedValue = oldAns ? oldAns.value : newAns.value;
      }

      // Security check: if not admin
      if (authUser.role !== "ADMIN") {
        // If it was already approved, do not allow modifying it
        if (oldAns && oldAns.status === "approved") {
          return oldAns;
        }
        
        // If value changed, set status to submitted and reset feedback
        const hasValueChanged = oldAns ? oldAns.value !== resolvedValue : resolvedValue !== null;
        if (hasValueChanged) {
          userHasSentResponse = true;
          if (newAns.type === "file") {
            responseType = "file";
          }
          return {
            ...newAns,
            value: resolvedValue,
            status: "submitted",
            feedback: null
          };
        } else {
          // If value didn't change, keep existing status and feedback
          return {
            ...newAns,
            value: resolvedValue,
            status: oldAns ? (oldAns.status || "pending") : "pending",
            feedback: oldAns ? oldAns.feedback : null
          };
        }
      }

      // If admin, we allow modifying value, status, and feedback
      const resolvedStatus = newAns.status || (oldAns ? oldAns.status : "pending");
      const resolvedFeedback = newAns.feedback !== undefined ? newAns.feedback : (oldAns ? oldAns.feedback : null);

      if (resolvedStatus === "rejected" && (!oldAns || oldAns.status !== "rejected" || oldAns.feedback !== resolvedFeedback)) {
        newlyRejectedAnswer = { name: newAns.name, feedback: resolvedFeedback };
      }

      return {
        ...newAns,
        value: resolvedValue,
        status: resolvedStatus,
        feedback: resolvedFeedback
      };
    });

    const updatedRequest = await prisma.documentRequest.update({
      where: { id },
      data: {
        answers: mergedAnswers,
      },
    });

    if (authUser.role !== "ADMIN" && userHasSentResponse) {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });
      const userName = docRequest.user?.name || "Um colaborador";
      const description = responseType === "file"
        ? `${userName} enviou um documento de onboarding. Clique para visualizar.`
        : `${userName} respondeu uma solicitação de onboarding. Clique para visualizar.`;

      await Promise.all(
        admins.map((admin) =>
          prisma.notification.create({
            data: {
              userId: admin.id,
              title: "Resposta de Onboarding",
              description,
              link: `/onboarding?collaboratorId=${docRequest.userId}`,
              read: false,
            },
          })
        )
      );
    }

    if (newlyRejectedAnswer && docRequest.user) {
      const rejectedAns = newlyRejectedAnswer as { name: string; feedback: string | null };
      const { origin } = new URL(request.url);
      const profileLink = `${origin}/perfil`;
      sendOnboardingDocumentRejectedEmail(
        docRequest.user.email,
        docRequest.user.name,
        rejectedAns.name,
        rejectedAns.feedback,
        profileLink
      ).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedRequest,
        answers: cleanAnswers(updatedRequest.answers)
      }
    });
  } catch (error) {
    console.error("Erro na rota PATCH /api/onboarding/[id]:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<any> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.documentRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Requisição de documentos excluída com sucesso" });
  } catch (error) {
    console.error("Erro na rota DELETE /api/onboarding/[id]:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
