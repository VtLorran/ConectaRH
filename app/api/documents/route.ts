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

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { name, value, folderId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: "O nome do documento é obrigatório" }, { status: 400 });
    }

    if (!value) {
      return NextResponse.json({ success: false, message: "O arquivo é obrigatório" }, { status: 400 });
    }

    if (!folderId) {
      return NextResponse.json({ success: false, message: "A pasta de destino é obrigatória" }, { status: 400 });
    }

    // Verify folder exists
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return NextResponse.json({ success: false, message: "Pasta de destino não encontrada" }, { status: 404 });
    }

    const newDocument = await prisma.document.create({
      data: {
        name: name.trim(),
        value,
        folderId,
      },
      select: {
        id: true,
        name: true,
        folderId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: newDocument });
  } catch (error) {
    console.error("Erro na rota POST /api/documents:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
