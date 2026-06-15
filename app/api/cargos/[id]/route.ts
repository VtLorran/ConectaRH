import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrCreateDesocupadoPosition } from "@/lib/setores";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { position: desocupadosPos } = await getOrCreateDesocupadoPosition();

    // Impedir alteração do cargo de desocupado
    if (id === desocupadosPos.id) {
      return NextResponse.json(
        { error: "O cargo 'Desocupado' é reservado do sistema e não pode ser editado." },
        { status: 400 }
      );
    }

    const normalizedName = name.trim();

    if (normalizedName.toLowerCase() === "desocupado") {
      return NextResponse.json(
        { error: "O nome 'Desocupado' é reservado pelo sistema." },
        { status: 400 }
      );
    }

    // Verificar se já existe outro cargo com este nome no mesmo setor
    const existingPosition = await prisma.jobPosition.findFirst({
      where: {
        name: normalizedName,
        departmentId: departmentId,
        id: { not: id },
      },
    });

    if (existingPosition) {
      return NextResponse.json(
        { error: "Este cargo já está cadastrado neste setor." },
        { status: 400 }
      );
    }

    const updatedPos = await prisma.jobPosition.update({
      where: { id },
      data: {
        name: normalizedName,
        departmentId: departmentId,
      },
    });

    return NextResponse.json(updatedPos, { status: 200 });
  } catch (error) {
    console.error("Erro ao editar cargo:", error);
    return NextResponse.json(
      { error: "Erro interno ao editar cargo." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { position: desocupadosPos } = await getOrCreateDesocupadoPosition();

    // Impedir exclusão do cargo de desocupados
    if (id === desocupadosPos.id) {
      return NextResponse.json(
        { error: "O cargo 'Desocupado' é reservado do sistema e não pode ser excluído." },
        { status: 400 }
      );
    }

    // Mover colaboradores para "Desocupado"
    await prisma.user.updateMany({
      where: {
        jobPositionId: id,
      },
      data: {
        jobPositionId: desocupadosPos.id,
      },
    });

    // Excluir o cargo
    await prisma.jobPosition.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Cargo excluído e colaboradores movidos para desocupados com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao excluir cargo:", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir cargo." },
      { status: 500 }
    );
  }
}
