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

    const folder = await prisma.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      return NextResponse.json({ success: false, message: "Pasta não encontrada" }, { status: 404 });
    }

    await prisma.folder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Pasta excluída com sucesso" });
  } catch (error) {
    console.error("Erro na rota DELETE /api/folders/[id]:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
