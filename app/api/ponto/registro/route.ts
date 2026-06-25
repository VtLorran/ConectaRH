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
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { qrToken, type, pauseCategoryId } = body;

    // 1. Validar Token do QR Code
    if (!qrToken) {
      return NextResponse.json({ success: false, message: "QR Code não fornecido" }, { status: 400 });
    }

    try {
      const parsedToken = JSON.parse(qrToken);
      if (parsedToken.type !== "kiosk-ponto" || parsedToken.company !== "ConectaRH") {
        return NextResponse.json({ success: false, message: "QR Code inválido ou de outra empresa" }, { status: 400 });
      }

      // Validação de expiração do Token (máximo 60 segundos)
      const tokenAgeMs = Date.now() - parsedToken.timestamp;
      if (tokenAgeMs < -5000 || tokenAgeMs > 60000) {
        return NextResponse.json({ 
          success: false, 
          message: "QR Code expirado. Aponte para o relógio atualizado no totem." 
        }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({ success: false, message: "QR Code inválido" }, { status: 400 });
    }

    // 2. Definir data de hoje (sem horas)
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3. Executar o registro em transação
    const result = await prisma.$transaction(async (tx) => {
      // Buscar ou criar o registro de ponto de hoje para o usuário
      let record = await tx.timeRecord.findUnique({
        where: {
          userId_date: {
            userId: user.userID,
            date: today,
          },
        },
      });

      if (!record) {
        record = await tx.timeRecord.create({
          data: {
            userId: user.userID,
            date: today,
          },
        });
      }

      if (type === "entry") {
        if (record.entryTime) {
          return { error: "Entrada já registrada para o dia de hoje." };
        }
        await tx.timeRecord.update({
          where: { id: record.id },
          data: { entryTime: now },
        });
        return { success: true, action: "entrada" };
      } 
      
      if (type === "exit") {
        if (!record.entryTime) {
          return { error: "Você precisa registrar a entrada antes de registrar a saída." };
        }
        if (record.exitTime) {
          return { error: "Saída já registrada para o dia de hoje." };
        }
        await tx.timeRecord.update({
          where: { id: record.id },
          data: { exitTime: now },
        });
        return { success: true, action: "saída" };
      } 
      
      if (type === "pause") {
        if (!record.entryTime) {
          return { error: "Você precisa registrar a entrada antes de iniciar uma pausa." };
        }
        if (record.exitTime) {
          return { error: "Não é possível registrar pausas após registrar a saída." };
        }
        if (!pauseCategoryId) {
          return { error: "Categoria de pausa não selecionada." };
        }

        // Buscar se há uma pausa aberta desta categoria hoje
        const activePause = await tx.timeRecordPause.findFirst({
          where: {
            timeRecordId: record.id,
            pauseCategoryId,
            endTime: null,
          },
        });

        if (activePause) {
          // Fechar pausa existente
          await tx.timeRecordPause.update({
            where: { id: activePause.id },
            data: { endTime: now },
          });
          return { success: true, action: "fim_pausa" };
        } else {
          // Iniciar nova pausa
          await tx.timeRecordPause.create({
            data: {
              timeRecordId: record.id,
              pauseCategoryId,
              startTime: now,
            },
          });
          return { success: true, action: "inicio_pausa" };
        }
      }

      return { error: "Tipo de registro inválido." };
    });

    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Ponto registrado (${result.action}) com sucesso!`,
      data: result,
    });
  } catch (error: any) {
    console.error("Erro no registro de ponto:", error);
    return NextResponse.json({ success: false, message: "Erro interno no servidor." }, { status: 500 });
  }
}
