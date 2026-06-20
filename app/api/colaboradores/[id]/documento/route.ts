import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Chave do documento não fornecida." },
        { status: 400 },
      );
    }

    const userData = await prisma.user.findUnique({
      where: { id },
      select: { cpf: true },
    });

    if (!userData) {
      return NextResponse.json(
        { error: "Colaborador não encontrado na base de usuários ativos." },
        { status: 404 },
      );
    }

    const admission = await prisma.admission.findFirst({
      where: { candidateCpf: userData.cpf },
      select: { formData: true },
    });

    if (!admission || !admission.formData) {
      return NextResponse.json(
        { error: "Dados de admissão não encontrados." },
        { status: 404 },
      );
    }

    const formData = admission.formData as Record<string, any>;
    const fileData = formData[key];

    if (!fileData) {
      return NextResponse.json(
        { error: "Documento não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ fileData }, { status: 200 });
  } catch (error) {
    console.error("Erro ao carregar documento:", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar documento." },
      { status: 500 },
    );
  }
}
