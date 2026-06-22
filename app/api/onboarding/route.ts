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

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get("userId");

    const whereClause: any = {};
    if (queryUserId) {
      whereClause.id = queryUserId;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
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
        documentRequests: {
          select: {
            id: true,
            requirements: true,
            answers: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    const formattedUsers = users.map((u) => ({
      ...u,
      documentRequests: u.documentRequests.map((req) => ({
        ...req,
        answers: cleanAnswers(req.answers),
      })),
    }));

    return NextResponse.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error("Erro na rota GET /api/onboarding:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, requirements } = body;

    if (!userId) {
      return NextResponse.json({ success: false, message: "O ID do colaborador é obrigatório" }, { status: 400 });
    }

    if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
      return NextResponse.json({ success: false, message: "A lista de documentos requeridos é obrigatória" }, { status: 400 });
    }

    // Initialize answers as a copy of requirements with value: null
    const answers = requirements.map((req: any) => ({
      name: req.name,
      type: req.type,
      value: null,
      status: "pending",
      feedback: null,
    }));

    const newRequest = await prisma.documentRequest.create({
      data: {
        userId,
        requirements,
        answers,
      },
    });

    return NextResponse.json({ success: true, data: newRequest });
  } catch (error) {
    console.error("Erro na rota POST /api/onboarding:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
