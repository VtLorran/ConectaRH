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

// DELETE: Exclui um registro de ponto específico (Restrito a ADMIN/RH/DP)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<any> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Apenas administradores (RH/DP) podem remover registros de ponto." }, { status: 403 });
    }

    const { id } = await params;

    // Remove o registro de ponto (pausas serão excluídas em cascata pelo onDelete: Cascade configurado no schema)
    await prisma.timeRecord.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Registro de ponto excluído com sucesso" });
  } catch (error: any) {
    console.error("Erro na rota DELETE /api/ponto/[id]:", error);
    return NextResponse.json({ success: false, message: error?.message || "Erro interno no servidor" }, { status: 500 });
  }
}
