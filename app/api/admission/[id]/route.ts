import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bycript from "bcrypt";
import { sendApprovalEmail, sendRefusedPermanentEmail, sendRefusedForCorrectionEmail } from "@/lib/mail";

export async function GET(
  request: Request,
  { params }: { params: Promise<any> },
) {
  try {
    const { id: admissionId } = await params;
    
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        candidateCpf: true,
        candidateRole: true,
        status: true,
        formConfig: true,
        formData: true,
        justification: true,
      },
    });

    if (!admission) {
      return NextResponse.json(
        {
          success: false,
          message: "Convite não enviado",
        },
        {
          status: 404, // not found
        },
      );
    }

    // Apenas a rota do candidato validará se o status é INVITED ou inativo. 
    // Para o RH, precisamos permitir carregar qualquer admissão para fins de avaliação e histórico.

    return NextResponse.json(
      {
        success: true,
        data: admission,
      },
      {
        status: 200, //OK
      },
    );
  } catch (error) {
    console.error("Erro ao buscar dados de admissão", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno no servidor",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<any> },
) {
  try {
    const { id: admissionId } = await params;

    const data = await request.json();
    const { formData, password } = data;

    if (!formData || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Nenhum dado foi enviado",
        },
        {
          status: 400, //BAD REQUEST
        },
      );
    }

    const hashedPassword = await bycript.hash(password, 10);

    // Tenta encontrar a foto de perfil nos dados do formulário para salvar na coluna do banco
    let candidateAvatar: string | undefined = undefined;
    if (formData && typeof formData === "object") {
      const fotoKey = Object.keys(formData).find(
        (key) => key.startsWith("foto:") || key.startsWith("foto_perfil:")
      );
      if (fotoKey) {
        candidateAvatar = formData[fotoKey];
      }
    }

    const updatedAdmission = await prisma.admission.update({
      where: { id: admissionId },
      data: {
        formData: formData,
        candidatePassword: hashedPassword,
        status: "UNDER_REVIEW",
        justification: null, // Limpa a justificativa anterior na nova submissão do candidato
        ...(candidateAvatar ? { candidateAvatar } : {}), // Atualiza o avatar se enviado!
      },
    });
    return NextResponse.json(
      {
        success: true,
        message: "Dados de admissão enviados com sucesso!",
        data: updatedAdmission,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao enviar dados de admissão:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<any> },
) {
  try {
    const { id: admissionId } = await params;
    const { status, action, justification } = await request.json();

    if (status !== "ACTIVE" && status !== "REJECTED") {
      return NextResponse.json(
        { success: false, message: "Status inválido." },
        { status: 400 },
      );
    }

    // Buscar admissão atual
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      return NextResponse.json(
        { success: false, message: "Admissão não encontrada." },
        { status: 404 },
      );
    }

    const { origin } = new URL(request.url);

    if (status === "ACTIVE") {
      // Validar CPF ou Email duplicado antes de criar o usuário
      const cleanCpf = admission.candidateCpf.replace(/\D/g, "");
      const formattedCpf = `${cleanCpf.slice(0, 3)}.${cleanCpf.slice(3, 6)}.${cleanCpf.slice(6, 9)}-${cleanCpf.slice(9, 11)}`;

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { cpf: cleanCpf },
            { cpf: formattedCpf },
            { email: admission.candidateEmail.trim().toLowerCase() },
          ],
        },
      });

      if (existingUser) {
        const field = existingUser.email === admission.candidateEmail.trim().toLowerCase() ? "e-mail" : "CPF";
        return NextResponse.json(
          { 
            success: false, 
            message: `Não foi possível aprovar a admissão pois já existe um usuário cadastrado com este ${field} no sistema.` 
          },
          { status: 400 },
        );
      }

      // 1. Cria o usuário ativo primeiro
      try {
        await prisma.user.create({
          data: {
            name: admission.candidateName,
            email: admission.candidateEmail,
            cpf: admission.candidateCpf,
            password: admission.candidatePassword,
            role: admission.candidateRole,
            avatar: admission.candidateAvatar,
            jobPositionId: admission.jobPositionId,
          },
        });
      } catch (err: any) {
        console.error("Erro ao cadastrar usuário na aprovação de admissão:", err);
        // Trata erro de restrição única (P2002) - Ex: CPF ou Email duplicado
        if (err.code === "P2002") {
          const target = err.meta?.target || [];
          const fieldName = target.includes("email") ? "e-mail" : "CPF";
          return NextResponse.json(
            { 
              success: false, 
              message: `Não foi possível aprovar a admissão pois já existe um usuário cadastrado com este ${fieldName} no sistema.` 
            },
            { status: 400 },
          );
        }
        throw err;
      }

      // 2. Atualiza a admissão para ACTIVE após a criação segura do usuário
      await prisma.admission.update({
        where: { id: admissionId },
        data: { status: "ACTIVE" },
      });

      // 2. Dispara e-mail de congratulação e login
      const loginLink = `${origin}/login`;
      await sendApprovalEmail(
        admission.candidateEmail,
        admission.candidateName,
        loginLink,
      );

      return NextResponse.json(
        {
          success: true,
          message: "Admissão aprovada com sucesso! E-mail de congratulações enviado.",
        },
        { status: 200 },
      );
    }

    if (status === "REJECTED") {
      if (action === "PERMANENT") {
        // 1. Exclui a admissão do banco de dados definitivamente
        await prisma.admission.delete({
          where: { id: admissionId },
        });

        // 2. Dispara e-mail de recusa permanente lamentando
        await sendRefusedPermanentEmail(
          admission.candidateEmail,
          admission.candidateName,
        );

        return NextResponse.json(
          {
            success: true,
            message: "Processo cancelado. Admissão excluída permanentemente e e-mail de aviso enviado.",
          },
          { status: 200 },
        );
      } else if (action === "CORRECTION") {
        if (!justification || !justification.trim()) {
          return NextResponse.json(
            { success: false, message: "A justificativa é obrigatória para correções." },
            { status: 400 },
          );
        }

        // 1. Retorna para o status INVITED e salva a justificativa
        await prisma.admission.update({
          where: { id: admissionId },
          data: {
            status: "INVITED",
            justification: justification.trim(),
          },
        });

        // 2. Envia e-mail de correção com link do formulário e justificativa
        const correctionLink = `${origin}/admissao/${admissionId}`;
        await sendRefusedForCorrectionEmail(
          admission.candidateEmail,
          admission.candidateName,
          justification.trim(),
          correctionLink,
        );

        return NextResponse.json(
          {
            success: true,
            message: "Admissão retornada para correção. Candidato foi notificado por e-mail.",
          },
          { status: 200 },
        );
      } else {
        return NextResponse.json(
          { success: false, message: "Ação de recusa inválida." },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { success: false, message: "Operação desconhecida." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Erro ao avaliar admissão:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor." },
      { status: 500 },
    );
  }
}
