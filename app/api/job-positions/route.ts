import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const jobPositions = await prisma.jobPosition.findMany({
      include: {
        department: true,
      },
      orderBy: [
        {
          department: {
            name: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        data: jobPositions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar cargos:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno no servidor ao carregar os cargos.",
      },
      { status: 500 }
    );
  }
}
