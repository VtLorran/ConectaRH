import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Não autenticado" },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET não está definido");
    }

    const decoded = jwt.verify(token, secret) as { userID: string; role: string; cpf?: string };

    // Dispara a busca do usuário
    const userPromise = prisma.user.findUnique({
      where: { id: decoded.userID },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true,
        avatar: true,
        createdAt: true,
        status: true,
        jobPosition: {
          select: {
            id: true,
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

    // Se o CPF estiver disponível no token decodificado, dispara a busca da admissão em paralelo.
    const admissionPromise = decoded.cpf
      ? prisma.admission.findFirst({
          where: {
            candidateCpf: decoded.cpf,
            status: "ACTIVE",
          },
          select: {
            formData: true,
          },
        })
      : Promise.resolve(null);

    // Executa as queries em paralelo
    const [user, initialAdmission] = await Promise.all([
      userPromise,
      admissionPromise,
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Fallback retrocompatível para sessões antigas que não possuíam o CPF gravado no token
    let admission = initialAdmission;
    if (!decoded.cpf) {
      admission = await prisma.admission.findFirst({
        where: {
          candidateCpf: user.cpf,
          status: "ACTIVE",
        },
        select: {
          formData: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        admissionData: admission?.formData || null,
      },
    });
  } catch (error) {
    console.error("Erro na rota /api/auth/me:", error);
    return NextResponse.json(
      { success: false, message: "Sessão inválida ou expirada" },
      { status: 401 }
    );
  }
}
