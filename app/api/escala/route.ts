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

// GET: Retorna as escalas de trabalho (Semana Fixa e Semanas Específicas)
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get("userId");

    let targetUserId = queryUserId;
    if (user.role !== "ADMIN") {
      targetUserId = user.userID; // Usuários normais só veem sua própria escala
    }

    if (!targetUserId) {
      return NextResponse.json({ success: false, message: "O ID do colaborador é obrigatório" }, { status: 400 });
    }

    const schedules = await prisma.workSchedule.findMany({
      where: { userId: targetUserId },
      orderBy: [
        { type: "asc" }, // FIXED antes de SPECIFIC
        { createdAt: "desc" }
      ]
    });

    return NextResponse.json({ success: true, data: schedules });
  } catch (error: any) {
    console.error("Erro na rota GET /api/escala:", error);
    return NextResponse.json({ success: false, message: error?.message || "Erro interno no servidor" }, { status: 500 });
  }
}

// POST: Cria ou atualiza a escala de trabalho (Semana Fixa ou Semana Específica)
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Apenas administradores podem gerenciar escalas." }, { status: 403 });
    }

    const body = await request.json();
    const { userId, type, startDate, endDate, description, scheduleData } = body;

    if (!userId) {
      return NextResponse.json({ success: false, message: "O ID do colaborador é obrigatório" }, { status: 400 });
    }

    if (!type || !["FIXED", "SPECIFIC"].includes(type)) {
      return NextResponse.json({ success: false, message: "Tipo inválido (deve ser FIXED ou SPECIFIC)" }, { status: 400 });
    }

    if (!scheduleData) {
      return NextResponse.json({ success: false, message: "Os dados da escala são obrigatórios" }, { status: 400 });
    }

    if (type === "FIXED") {
      // Verifica se já existe uma semana fixa
      const existingFixed = await prisma.workSchedule.findFirst({
        where: { userId, type: "FIXED" }
      });

      if (existingFixed) {
        // Atualiza a semana fixa existente
        const updated = await prisma.workSchedule.update({
          where: { id: existingFixed.id },
          data: {
            scheduleData,
            description: description || null
          }
        });
        return NextResponse.json({ success: true, data: updated, message: "Escala fixa atualizada com sucesso" });
      } else {
        // Cria nova semana fixa
        const created = await prisma.workSchedule.create({
          data: {
            userId,
            type: "FIXED",
            scheduleData
          }
        });
        return NextResponse.json({ success: true, data: created, message: "Escala fixa criada com sucesso" });
      }
    } else {
      // Cadastro de semana específica (temporária)
      if (!startDate || !endDate) {
        return NextResponse.json({ success: false, message: "Datas de início e fim são obrigatórias para escala específica" }, { status: 400 });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({ success: false, message: "Datas inválidas" }, { status: 400 });
      }

      if (end < start) {
        return NextResponse.json({ success: false, message: "A data de fim deve ser posterior à data de início" }, { status: 400 });
      }

      const created = await prisma.workSchedule.create({
        data: {
          userId,
          type: "SPECIFIC",
          startDate: start,
          endDate: end,
          description: description || null,
          scheduleData
        }
      });

      return NextResponse.json({ success: true, data: created, message: "Escala específica registrada com sucesso" });
    }
  } catch (error: any) {
    console.error("Erro na rota POST /api/escala:", error);
    return NextResponse.json({ success: false, message: error?.message || "Erro interno no servidor" }, { status: 500 });
  }
}
