import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cleanupExpiredMessages } from "@/lib/chat";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 });
    }

    // Executa a limpeza de mensagens expiradas em segundo plano para otimizar a resposta
    cleanupExpiredMessages().catch((err) => console.error("Erro na limpeza de mensagens:", err));

    // Busca todas as mensagens enviadas ou recebidas pelo usuário atual para montar os chats recentes
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUser.id },
          { receiverId: currentUser.id },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            jobPosition: {
              select: {
                name: true,
                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            jobPosition: {
              select: {
                name: true,
                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Agrupa para encontrar as conversas únicas com a última mensagem correspondente
    const contactsMap = new Map<string, any>();
    for (const msg of messages) {
      const isSender = msg.senderId === currentUser.id;
      const contact = isSender ? msg.receiver : msg.sender;

      // Ignora mensagens enviadas para si mesmo se houver
      if (contact.id === currentUser.id) continue;

      if (!contactsMap.has(contact.id)) {
        contactsMap.set(contact.id, {
          id: contact.id,
          name: contact.name,
          avatar: contact.avatar,
          role: contact.role,
          jobPosition: contact.jobPosition,
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            senderId: msg.senderId,
          },
        });
      }
    }

    const recentChats = Array.from(contactsMap.values());

    if (currentUser.role === "ADMIN") {
      // Admins podem pesquisar e filtrar todos os colaboradores ativos do sistema
      const allUsers = await prisma.user.findMany({
        where: {
          id: { not: currentUser.id },
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          jobPosition: {
            select: {
              name: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      // Busca os setores da empresa para o filtro
      const departments = await prisma.department.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      return NextResponse.json({
        success: true,
        recentChats,
        allUsers,
        departments,
        role: "ADMIN",
      });
    } else {
      // Colaboradores comuns só podem iniciar chats com administradores (RH e DP)
      const admins = await prisma.user.findMany({
        where: {
          id: { not: currentUser.id },
          role: "ADMIN",
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          jobPosition: {
            select: {
              name: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      return NextResponse.json({
        success: true,
        recentChats,
        admins,
        role: "USER",
      });
    }
  } catch (error) {
    console.error("Erro na rota GET /api/chat:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
