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

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const folders = await prisma.folder.findMany({
      include: {
        documents: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: folders });
  } catch (error) {
    console.error("Erro na rota GET /api/folders:", error);
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
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: "O nome da pasta é obrigatório" }, { status: 400 });
    }

    // Check if folder name already exists
    const existing = await prisma.folder.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json({ success: false, message: "Já existe uma pasta com este nome" }, { status: 400 });
    }

    const newFolder = await prisma.folder.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json({ success: true, data: newFolder });
  } catch (error) {
    console.error("Erro na rota POST /api/folders:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
