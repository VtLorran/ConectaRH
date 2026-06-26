import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET não está definido");
    }

    const decoded = jwt.verify(token, secret) as { userID: string; role: string; cpf?: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userID },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        status: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error);
    return null;
  }
}
