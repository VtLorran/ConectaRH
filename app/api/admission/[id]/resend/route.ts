import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/mail";
import fs from "fs";
import path from "path";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const logPath = path.join(process.cwd(), "resend_error.log");
  const log = (msg: string) => {
    try {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {
      console.error("Erro ao escrever log:", e);
    }
  };

  try {
    log("Iniciando POST /api/admission/[id]/resend");
    const { id: admissionId } = await params;
    log(`admissionId resolvido: ${admissionId}`);

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      log(`Admissão não encontrada para ID: ${admissionId}`);
      return NextResponse.json(
        { success: false, message: "Admissão não encontrada." },
        { status: 404 },
      );
    }

    log(`Admissão encontrada: ${JSON.stringify(admission)}`);

    if (admission.status !== "INVITED") {
      log(`Status da admissão não é INVITED: ${admission.status}`);
      return NextResponse.json(
        { success: false, message: "Este candidato já preencheu o formulário ou o processo já foi concluído." },
        { status: 400 },
      );
    }

    const { origin } = new URL(request.url);
    const inviteLink = `${origin}/admissao/${admission.id}`;
    log(`inviteLink gerado: ${inviteLink}`);

    // Disparar e-mail de convite novamente
    log("Disparando e-mail de convite...");
    await sendInvitationEmail(
      admission.candidateEmail,
      admission.candidateName,
      inviteLink,
    );
    log("E-mail enviado com sucesso!");

    return NextResponse.json(
      {
        success: true,
        message: "Convite reenviado com sucesso!",
      },
      { status: 200 },
    );
  } catch (error: any) {
    log(`Erro no endpoint: ${error?.message || error}\nStack: ${error?.stack}`);
    console.error("Erro ao reenviar convite:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Erro interno no servidor ao reenviar convite: ${error?.message || error}` 
      },
      { status: 500 },
    );
  }
}

