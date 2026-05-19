import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const templates = await prisma.admissionTemplate.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        requiredFields: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: templates,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao criar template:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno ao salvar o template." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, description, requiredFields, hrUserId } = data;

    if (!name || !requiredFields || !hrUserId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O nome do template, os campos obrigatórios e o ID do RH são necessários.",
        },
        { status: 400 },
      );
    }

    const newTemplate = await prisma.admissionTemplate.create({
      data: {
        name: name,
        description: description || null,
        requiredFields: requiredFields,
        createdById: hrUserId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Template salvo com sucesso!",
        data: newTemplate,
      },
      { status: 201 }, // 201 = Created
    );
  } catch (error) {
    console.error("Erro ao criar template:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno ao salvar o template." },
      { status: 500 },
    );
  }
}
