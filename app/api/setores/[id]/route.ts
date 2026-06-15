import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrCreateDesocupadoPosition } from "@/lib/setores";

export async function PUT(
  request: Request,
  { params }: { params: Promise<any> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "O nome do setor é obrigatório." },
        { status: 400 }
      );
    }

    const { department: desocupadosDept } = await getOrCreateDesocupadoPosition();

    // Impedir alteração do setor de desocupados
    if (id === desocupadosDept.id) {
      return NextResponse.json(
        { error: "O setor de 'Desocupados' é reservado do sistema e não pode ser editado." },
        { status: 400 }
      );
    }

    const normalizedName = name.trim();

    if (normalizedName.toLowerCase() === "desocupados") {
      return NextResponse.json(
        { error: "O nome 'Desocupados' é reservado pelo sistema." },
        { status: 400 }
      );
    }

    // Verificar se já existe outro setor com este nome (que não seja o atual)
    const existingDept = await prisma.department.findFirst({
      where: {
        name: normalizedName,
        id: { not: id },
      },
    });

    if (existingDept) {
      return NextResponse.json(
        { error: "Já existe outro setor cadastrado com este nome." },
        { status: 400 }
      );
    }

    const updatedDept = await prisma.department.update({
      where: { id },
      data: {
        name: normalizedName,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(updatedDept, { status: 200 });
  } catch (error) {
    console.error("Erro ao editar setor:", error);
    return NextResponse.json(
      { error: "Erro interno ao editar setor." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<any> }
) {
  try {
    const { id } = await params;
    const { department: desocupadosDept, position: desocupadosPos } = await getOrCreateDesocupadoPosition();

    // Impedir exclusão do setor de desocupados
    if (id === desocupadosDept.id) {
      return NextResponse.json(
        { error: "O setor de 'Desocupados' é reservado do sistema e não pode ser excluído." },
        { status: 400 }
      );
    }

    // Buscar cargos vinculados ao setor sendo excluído
    const positions = await prisma.jobPosition.findMany({
      where: { departmentId: id },
      select: { id: true },
    });

    const positionIds = positions.map((p) => p.id);

    // Se houver cargos, mover os colaboradores para "Desocupado"
    if (positionIds.length > 0) {
      await prisma.user.updateMany({
        where: {
          jobPositionId: { in: positionIds },
        },
        data: {
          jobPositionId: desocupadosPos.id,
        },
      });
    }

    // Excluir o setor (cargos serão excluídos por cascade)
    await prisma.department.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Setor e cargos vinculados excluídos. Colaboradores movidos para desocupados com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao excluir setor:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir setor." },
      { status: 500 }
    );
  }
}
