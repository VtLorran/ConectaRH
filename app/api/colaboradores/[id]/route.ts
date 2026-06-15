import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<any> },
) {
  try {
    const { id } = await params;
    
    const userData = await prisma.user.findUnique({
      where: { id },
      select: {
        name: true,
        email: true,
        cpf: true,
        avatar: true,
        role: true,
        status: true,
        jobPositionId: true,
        createdAt: true,
        jobPosition: {
          select: {
            id: true,
            name: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: "Colaborador não encontrado na base de usuários ativos." },
        { status: 404 },
      );
    }

    const admissionData = await prisma.admission.findFirst({
      where: {
        candidateCpf: userData.cpf,
      },
      select: {
        formData: true,
        formConfig: true,
        status: true,
      },
    });

    const vacations = await prisma.vacation.findMany({
      where: {
        userId: id,
        status: "APPROVED",
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hasActiveVacation = vacations.some((v) => {
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      const utcStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
      const utcEnd = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59);
      return today >= utcStart && today <= utcEnd;
    });

    let displayStatus = userData.status;
    if (hasActiveVacation && userData.status === "ACTIVE") {
      displayStatus = "VACATION";
      await prisma.user.update({
        where: { id },
        data: { status: "VACATION" },
      });
    } else if (!hasActiveVacation && userData.status === "VACATION") {
      displayStatus = "ACTIVE";
      await prisma.user.update({
        where: { id },
        data: { status: "ACTIVE" },
      });
    }

    const responseData = {
      name: userData.name,
      email: userData.email,
      cpf: userData.cpf,
      avatar: userData.avatar,
      role: userData.role,
      status: displayStatus,
      jobPositionId: userData.jobPositionId,
      jobPosition: userData.jobPosition,
      formData: admissionData?.formData || null,
      createdAt: userData.createdAt,
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Erro ao consultar dados do usuário", error);
    return NextResponse.json(
      {
        error: "Erro interno ao consultar dados do usuário",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<any> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { name, email, cpf, avatar, jobPositionId, formData } = body;

    // Busca o usuário atual antes do update para verificar se o CPF vai mudar
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { cpf: true },
    });

    const userUpdateData: any = {};
    if (name !== undefined) userUpdateData.name = name;
    if (email !== undefined) userUpdateData.email = email;
    if (cpf !== undefined) userUpdateData.cpf = cpf;
    if (avatar !== undefined) userUpdateData.avatar = avatar;

    if (jobPositionId !== undefined) {
      if (jobPositionId === null) {
        userUpdateData.jobPositionId = null;
      } else {
        const jobPosition = await prisma.jobPosition.findUnique({
          where: { id: jobPositionId },
          include: { department: true },
        });

        if (!jobPosition) {
          return NextResponse.json(
            { error: "Cargo selecionado não encontrado." },
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

        userUpdateData.jobPositionId = jobPositionId;
        userUpdateData.role = derivedRole;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: userUpdateData,
      include: {
        jobPosition: {
          include: {
            department: true,
          },
        },
      },
    });

    // Se o CPF mudou, atualiza também na tabela de admissões para não quebrar o vínculo
    if (existingUser && cpf !== undefined && cpf !== existingUser.cpf) {
      await prisma.admission.updateMany({
        where: {
          candidateCpf: existingUser.cpf,
        },
        data: {
          candidateCpf: cpf,
        },
      });
    }

    if (formData !== undefined && formData !== null) {
      await prisma.admission.updateMany({
        where: {
          candidateCpf: updatedUser.cpf,
        },
        data: {
          formData: formData,
        },
      });
    }

    const currentAdmission = await prisma.admission.findFirst({
      where: { candidateCpf: updatedUser.cpf },
      select: { formData: true },
    });

    return NextResponse.json(
      {
        ...updatedUser,
        formData: currentAdmission?.formData || null,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Erro ao atualizar dados com PATCH:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Colaborador não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Erro interno ao atualizar dados do usuário." },
      { status: 500 },
    );
  }
}
