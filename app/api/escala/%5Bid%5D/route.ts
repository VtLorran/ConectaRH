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

    const decoded = jwt.verify(token, secret) as {
      userID: string;
      role: string;
      cpf?: string;
    };
    return decoded;
  } catch (error) {
    return null;
  }
}

// DELETE: Remove uma escala específica ou fixa
export async function DELETE(
  request: Request,
  { params }: { params: Promise<any> }, // <-- Correção feita aqui para o Vercel não travar
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Não autenticado" },
        { status: 401 },
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Apenas administradores podem remover escalas.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    const schedule = await prisma.workSchedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, message: "Escala não encontrada" },
        { status: 404 },
      );
    }

    await prisma.workSchedule.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Escala removida com sucesso",
    });
  } catch (error: any) {
    console.error("Erro na rota DELETE /api/escala/[id]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Erro interno no servidor" },
      { status: 500 },
    );
  }
}
