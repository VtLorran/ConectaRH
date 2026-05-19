import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json(
      { success: true, message: "Logout realizado com sucesso" },
      { status: 200 }
    );

    // Remove o cookie contendo o token JWT
    response.cookies.delete("token");

    return response;
  } catch (error) {
    console.error("Erro ao realizar logout:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor ao fazer logout." },
      { status: 500 }
    );
  }
}
