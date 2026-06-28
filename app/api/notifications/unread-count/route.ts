import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const decoded = jwt.verify(token, secret) as { userID: string };
    return decoded.userID;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 });
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });

    return NextResponse.json({ success: true, unreadCount });
  } catch (error: any) {
    console.error("Erro ao obter quantidade de não lidas:", error);
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 });
  }
}
