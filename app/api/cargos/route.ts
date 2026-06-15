import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, departmentId } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "O nome do cargo é obrigatório." },
        { status: 400 }
      );
    }

    if (!departmentId || departmentId.trim() === "") {
      return NextResponse.json(
        { error: "O setor é obrigatório." },
        { status: 400 }
      );
    }

    const normalizedName = name.trim();

    // Bloquear criação manual de um cargo com o nome reservado "Desocupado"
    if (normalizedName.toLowerCase() === "desocupado") {
      return NextResponse.json(
        { error: "O nome 'Desocupado' é reservado pelo sistema." },
        { status: 400 }
      );
    }

    // Verificar se o setor existe
    const departmentExists = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!departmentExists) {
      return NextResponse.json(
        { error: "O setor informado não existe." },
        { status: 404 }
      );
    }

    // Verificar se o cargo já existe neste setor
    const existingPosition = await prisma.jobPosition.findUnique({
      where: {
        name_departmentId: {
          name: normalizedName,
          departmentId: departmentId,
        },
      },
    });

    if (existingPosition) {
      return NextResponse.json(
        { error: "Este cargo já está cadastrado neste setor." },
        { status: 400 }
      );
    }

    const newPosition = await prisma.jobPosition.create({
      data: {
        name: normalizedName,
        departmentId: departmentId,
      },
    });

    return NextResponse.json(newPosition, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cargo:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar cargo." },
      { status: 500 }
    );
  }
}
