import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

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
    // 1. Obter o usuário logado pela sessão cookie
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Não autorizado. Apenas administradores podem realizar esta operação." },
        { status: 403 }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, message: "A senha é obrigatória" },
        { status: 400 }
      );
    }

    // 2. Buscar a senha do usuário logado no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: authUser.userID },
    });

    if (!user || user.role !== "ADMIN" || !user.password) {
      return NextResponse.json(
        { success: false, message: "Usuário administrador não encontrado ou sem senha cadastrada" },
        { status: 401 }
      );
    }

    // 3. Comparar a senha informada com o hash salvo no banco
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Senha incorreta" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Senha verificada com sucesso"
    });
  } catch (error: any) {
    console.error("Erro na verificação do admin:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
