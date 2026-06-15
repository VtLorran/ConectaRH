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

// GET: Retorna todas as categorias de pausas
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const categories = await prisma.pauseCategory.findMany({
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error("Erro na rota GET /api/ponto/categorias:", error);
    return NextResponse.json({ success: false, message: error?.message || "Erro interno no servidor" }, { status: 500 });
  }
}

// POST: Cria uma nova categoria de pausa (Restrito a ADMIN/RH/DP)
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Apenas administradores (RH/DP) podem cadastrar categorias de pausa." }, { status: 403 });
    }

    const body = await request.json();
    const { name, duration } = body;

    if (!name || !duration) {
      return NextResponse.json({ success: false, message: "Nome e duração são obrigatórios" }, { status: 400 });
    }

    const durationInt = parseInt(duration);
    if (isNaN(durationInt) || durationInt <= 0) {
      return NextResponse.json({ success: false, message: "Duração deve ser um número positivo em minutos" }, { status: 400 });
    }

    // Verifica se já existe uma com o mesmo nome (ignorando maiúsculas/minúsculas)
    const existing = await prisma.pauseCategory.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existing) {
      return NextResponse.json({ success: false, message: "Já existe uma categoria de pausa com este nome." }, { status: 400 });
    }

    const newCategory = await prisma.pauseCategory.create({
      data: {
        name: name.trim(),
        duration: durationInt
      }
    });

    return NextResponse.json({ success: true, data: newCategory, message: "Categoria de pausa criada com sucesso" });
  } catch (error: any) {
    console.error("Erro na rota POST /api/ponto/categorias:", error);
    return NextResponse.json({ success: false, message: error?.message || "Erro interno no servidor" }, { status: 500 });
  }
}
