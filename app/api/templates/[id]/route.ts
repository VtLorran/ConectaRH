import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    const data = await request.json();
    const { name, description, requiredFields } = data;

    if (!name || !requiredFields) {
      return NextResponse.json(
        { success: false, message: "Nome e campos obrigatórios são necessários." },
        { status: 400 }
      );
    }

    const updatedTemplate = await prisma.admissionTemplate.update({
      where: { id: templateId },
      data: {
        name,
        description: description || null,
        requiredFields,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Template atualizado com sucesso!",
        data: updatedTemplate,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao atualizar template:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno ao atualizar o template." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;

    await prisma.admissionTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Template excluído com sucesso!",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao excluir template:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno ao excluir o template." },
      { status: 500 }
    );
  }
}
