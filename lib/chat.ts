import prisma from "@/lib/prisma";

export async function cleanupExpiredMessages() {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const deleted = await prisma.message.deleteMany({
      where: {
        createdAt: {
          lt: threeDaysAgo,
        },
      },
    });

    if (deleted.count > 0) {
      console.log(`[Chat Cleanup] Deletadas ${deleted.count} mensagens expiradas.`);
    }
  } catch (error) {
    console.error("Erro ao limpar mensagens expiradas:", error);
  }
}
