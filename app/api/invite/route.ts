import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { sendInvitationEmail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, cpf, candidateRole, hrUserId, formConfiguration } =
      data;

    if (!data.name || !data.email || !data.cpf || !hrUserId) {
      return NextResponse.json(
        { success: false, message: "Nome, E-mail e CPF são obrigatórios." },
        { status: 400 },
      );
    }

    // Salvando no banco de dados
    const newAdmission = await prisma.admission.create({
      data: {
        candidateName: name,
        candidateEmail: email,
        candidateCpf: cpf,
        formConfig: formConfiguration,
        candidateRole: candidateRole || "USER", // Define se será ADMIN ou USER
        status: "INVITED",
        createdById: hrUserId, // Relaciona com o RH que criou
      },
    });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/admissao/${newAdmission.id}`;

    await sendInvitationEmail(email, name, inviteLink);

    return NextResponse.json(
      {
        success: true,
        message: "Convite criado com sucesso!",
        data: newAdmission,
      },
      { status: 201 }, // 201 = Created
    );
  } catch (error) {
    console.error("Erro na API de convite:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Ocorreu algum erro interno no servidor.",
      },
      { status: 500 },
    );
  }
}
