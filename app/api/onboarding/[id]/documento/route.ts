import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<any> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Nome do documento não fornecido." },
        { status: 400 },
      );
    }

    const docRequest = await prisma.documentRequest.findUnique({
      where: { id },
      select: { answers: true },
    });

    if (!docRequest) {
      return NextResponse.json(
        { error: "Requisição de documentos não encontrada." },
        { status: 404 },
      );
    }

    const answers = (docRequest.answers as any[]) || [];
    const answer = answers.find((ans: any) => ans.name === name);

    if (!answer || !answer.value) {
      return NextResponse.json(
        { error: "Documento não encontrado ou ainda não enviado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ fileData: answer.value }, { status: 200 });
  } catch (error) {
    console.error("Erro ao carregar documento de onboarding:", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar documento." },
      { status: 500 },
    );
  }
}
