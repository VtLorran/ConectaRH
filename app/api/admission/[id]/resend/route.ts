import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/mail";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: admissionId } = await params;

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      return NextResponse.json(
        { success: false, message: "Admissão não encontrada." },
        { status: 404 },
      );
    }

    if (admission.status !== "INVITED") {
      return NextResponse.json(
        { success: false, message: "Este candidato já preencheu o formulário ou o processo já foi concluído." },
        { status: 400 },
      );
    }

    const { origin } = new URL(request.url);
    const inviteLink = `${origin}/admissao/${admission.id}`;

    // Disparar e-mail de convite novamente
    await sendInvitationEmail(
      admission.candidateEmail,
      admission.candidateName,
      inviteLink,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Convite reenviado com sucesso!",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao reenviar convite:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor ao reenviar convite." },
      { status: 500 },
    );
  }
}
