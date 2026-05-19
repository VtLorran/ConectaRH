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

    const decoded = jwt.verify(token, secret) as { userID: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userID },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true,
        avatar: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Busca os dados admissionais aprovados associados ao CPF do colaborador
    const admission = await prisma.admission.findFirst({
      where: {
        candidateCpf: user.cpf,
        status: "ACTIVE",
      },
      select: {
        formData: true,
      },
    });

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
