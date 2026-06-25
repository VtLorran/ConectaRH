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

// GET: Retorna os registros de ponto do colaborador
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get("userId");

    // Se for ADMIN e não passou userId, retorna TODOS os registros
    if (user.role === "ADMIN" && !queryUserId) {
      const timeRecords = await prisma.timeRecord.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              cpf: true,
              avatar: true,
              jobPosition: {
                select: {
                  id: true,
                  name: true,
                  department: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          pauses: {
            include: {
              pauseCategory: true
            },
            orderBy: {
              startTime: "asc"
            }
          }
        },
        orderBy: {
          date: "desc"
        }
      });

      return NextResponse.json({ success: true, data: timeRecords });
    }

    let targetUserId = queryUserId;
    if (user.role !== "ADMIN") {
      targetUserId = user.userID; // Usuários normais só veem seu próprio ponto
    }

    if (!targetUserId) {
      return NextResponse.json({ success: false, message: "O ID do colaborador é obrigatório" }, { status: 400 });
    }

    const timeRecords = await prisma.timeRecord.findMany({
      where: { userId: targetUserId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
            avatar: true,
            jobPosition: {
              select: {
                id: true,
                name: true,
                department: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        pauses: {
          include: {
            pauseCategory: true
          },
          orderBy: {
            startTime: "asc"
          }
        }
      },
      orderBy: {
        date: "desc"
      }
    });

    return NextResponse.json({ success: true, data: timeRecords });
  } catch (error: any) {
    console.error("Erro na rota GET /api/ponto:", error);
    return NextResponse.json({ success: false, message: error?.message || "Erro interno no servidor" }, { status: 500 });
  }
}

// POST: Registra ou edita um ponto diário (com entrada, saída e pausas)
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { date, entryTime, exitTime, pauses } = body;
    let { userId } = body;

    // Se não for admin, o userId é sempre o do próprio usuário logado
    if (user.role !== "ADMIN") {
      userId = user.userID;
    }

    if (!userId) {
      return NextResponse.json({ success: false, message: "O ID do colaborador é obrigatório" }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ success: false, message: "A data do ponto é obrigatória" }, { status: 400 });
    }

    // data format: 'YYYY-MM-DD'
    const [year, month, day] = date.split("-").map(Number);
    const recordDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    const combineDateAndTime = (timeStr: string) => {
      if (!timeStr) return null;
      const [hours, minutes] = timeStr.split(":").map(Number);
      return new Date(year, month - 1, day, hours, minutes, 0, 0);
    };

    const parsedEntryTime = entryTime ? combineDateAndTime(entryTime) : null;
    const parsedExitTime = exitTime ? combineDateAndTime(exitTime) : null;

    if (parsedEntryTime && parsedExitTime && parsedExitTime < parsedEntryTime) {
      return NextResponse.json({ success: false, message: "A hora de saída deve ser posterior à hora de entrada" }, { status: 400 });
    }

    // Executa em transação para garantir consistência
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verifica se já existe um registro para a data
      const existingRecord = await tx.timeRecord.findUnique({
        where: {
          userId_date: {
            userId,
            date: recordDate
          }
        }
      });

      let recordId: string;

      if (existingRecord) {
        // Atualiza os dados básicos do ponto
        const updated = await tx.timeRecord.update({
          where: { id: existingRecord.id },
          data: {
            entryTime: parsedEntryTime,
            exitTime: parsedExitTime
          }
        });
        recordId = updated.id;

        // Limpa as pausas antigas para reinserir
        await tx.timeRecordPause.deleteMany({
          where: { timeRecordId: recordId }
        });
      } else {
        // Cria novo ponto diário
        const created = await tx.timeRecord.create({
          data: {
            userId,
            date: recordDate,
            entryTime: parsedEntryTime,
            exitTime: parsedExitTime
          }
        });
        recordId = created.id;
      }

      // 2. Insere as novas pausas se existirem
      if (pauses && Array.isArray(pauses) && pauses.length > 0) {
        for (const pause of pauses) {
          const { pauseCategoryId, startTime, endTime } = pause;
          if (!pauseCategoryId || !startTime) continue;

          const pStart = combineDateAndTime(startTime);
          const pEnd = endTime ? combineDateAndTime(endTime) : null;

          if (pStart) {
            await tx.timeRecordPause.create({
              data: {
                timeRecordId: recordId,
                pauseCategoryId,
                startTime: pStart,
                endTime: pEnd
              }
            });
          }
        }
      }

      // Busca o registro completo atualizado
      return tx.timeRecord.findUnique({
        where: { id: recordId },
        include: {
          pauses: {
            include: {
              pauseCategory: true
            },
            orderBy: {
              startTime: "asc"
            }
          }
        }
      });
    });

    return NextResponse.json({ success: true, data: result, message: "Ponto registrado com sucesso" });
  } catch (error: any) {
    console.error("Erro na rota POST /api/ponto:", error);
    return NextResponse.json({ success: false, message: error?.message || "Erro interno no servidor" }, { status: 500 });
  }
}
