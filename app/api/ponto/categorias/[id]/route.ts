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

// DELETE: Exclui uma categoria de pausa (Restrito a ADMIN/RH/DP)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Apenas administradores (RH/DP) podem gerenciar categorias de pausa." }, { status: 403 });
    }

    const { id } = await params;

    // Verifica se a categoria está em uso por alguma pausa registrada
    const inUse = await prisma.timeRecordPause.findFirst({
      where: { pauseCategoryId: id }
    });

    if (inUse) {
      return NextResponse.json({
        success: false,
        message: "Esta categoria não pode ser excluída pois já existem registros de ponto associados a ela."
      }, { status: 400 });
    }

    await prisma.pauseCategory.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Categoria de pausa excluída com sucesso" });
  } catch (error: any) {
    console.error("Erro na rota DELETE /api/ponto/categorias/[id]:", error);
    return NextResponse.json({ success: false, message: error?.message || "Erro interno no servidor" }, { status: 500 });
  }
}
