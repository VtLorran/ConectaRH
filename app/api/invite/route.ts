import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { sendInvitationEmail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, cpf, jobPositionId, hrUserId, formConfiguration } =
      data;

    if (!name || !email || !cpf || !jobPositionId || !hrUserId) {
      return NextResponse.json(
        { success: false, message: "Nome, E-mail, CPF, Cargo e ID do RH são obrigatórios." },
        { status: 400 },
      );
    }

    const cleanCpf = cpf.replace(/\D/g, "");
    const formattedCpf = `${cleanCpf.slice(0, 3)}.${cleanCpf.slice(3, 6)}.${cleanCpf.slice(6, 9)}-${cleanCpf.slice(9, 11)}`;

    // 1. Validar se já existe um colaborador ativo com este CPF ou E-mail no sistema
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { cpf: cleanCpf },
          { cpf: formattedCpf },
          { email: email.trim().toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email.trim().toLowerCase() ? "e-mail" : "CPF";
      return NextResponse.json(
        { success: false, message: `Não foi possível criar o convite pois já existe um colaborador cadastrado com este ${field} no sistema.` },
        { status: 400 },
      );
    }

    // 2. Validar se já existe um processo de admissão em andamento para este CPF ou E-mail
    const existingAdmission = await prisma.admission.findFirst({
      where: {
        OR: [
          { candidateCpf: cleanCpf, status: { in: ["INVITED", "UNDER_REVIEW"] } },
          { candidateCpf: formattedCpf, status: { in: ["INVITED", "UNDER_REVIEW"] } },
          { candidateEmail: email.trim().toLowerCase(), status: { in: ["INVITED", "UNDER_REVIEW"] } },
        ],
      },
    });

    if (existingAdmission) {
      return NextResponse.json(
        { success: false, message: "Este candidato já possui um processo de admissão em andamento." },
        { status: 400 },
      );
    }

    // Buscar o cargo e setor para definir o perfil de acesso dinamicamente
    const jobPosition = await prisma.jobPosition.findUnique({
      where: { id: jobPositionId },
      include: { department: true },
    });

    if (!jobPosition) {
      return NextResponse.json(
        { success: false, message: "Cargo selecionado não encontrado." },
        { status: 400 },
      );
    }

    const normalizedDept = jobPosition.department.name.trim().toUpperCase();
    const derivedRole = (
      normalizedDept === "RH" ||
      normalizedDept === "RECURSOS HUMANOS" ||
      normalizedDept === "DP" ||
      normalizedDept === "DEPARTAMENTO PESSOAL"
    ) ? "ADMIN" : "USER";

    // Salvando no banco de dados
    const newAdmission = await prisma.admission.create({
      data: {
        candidateName: name,
        candidateEmail: email,
        candidateCpf: cleanCpf,
        formConfig: formConfiguration,
        candidateRole: derivedRole,
        jobPositionId: jobPositionId,
        status: "INVITED",
        createdById: hrUserId, // Relaciona com o RH que criou
      },
    });
    const { origin } = new URL(request.url);
    const inviteLink = `${origin}/admissao/${newAdmission.id}`;

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
