import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { cpf, password } = data;

    //validações
    if (!cpf || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "CPF e senha são obrigatórios",
        },
        {
          status: 400,
        },
      );
    }

    // Remove qualquer caractere que não seja número do CPF para busca segura
    const cleanCpf = cpf.replace(/\D/g, "");

    //buscar o usuário pelo cpf
    const user = await prisma.user.findUnique({
      where: { cpf: cleanCpf },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Credenciais inválidas",
        },
        {
          status: 401, //unauthorized
        },
      );
    }

    //compara senha enviada com hash do banco
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Credenciais inválidas",
        },
        {
          status: 401,
        },
      );
    }

    //gerar token jwt
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET não está definido no .env");
    }

    //payload - info
    const token = jwt.sign(
      {
        userID: user.id,
        role: user.role,
      },
      secret,
      {
        expiresIn: "1d",
      },
    );

    const response = NextResponse.json(
      {
        success: true,
        message: "Login realizado com sucesso",
        token: token,
        data: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
      },
      {
        status: 200,
      },
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 dia
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor." },
      { status: 500 },
    );
  }
}
