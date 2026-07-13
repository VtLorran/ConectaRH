import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function GET(request: Request) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        avatar: true,
        role: true,
        status: true,
        jobPosition: {
          select: {
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allApprovedVacations = await prisma.vacation.findMany({
      where: {
        status: "APPROVED",
      },
    });

    const usersWithActiveVacation = new Set(
      allApprovedVacations
        .filter((v) => {
          const start = new Date(v.startDate);
          const end = new Date(v.endDate);
          const utcStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
          const utcEnd = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59);
          return today >= utcStart && today <= utcEnd;
        })
        .map((v) => v.userId)
    );

    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const hasActive = usersWithActiveVacation.has(user.id);
        let currentStatus = user.status;

        if (hasActive && user.status === "ACTIVE") {
          currentStatus = "VACATION";
          await prisma.user.update({
            where: { id: user.id },
            data: { status: "VACATION" },
          });
        } else if (!hasActive && user.status === "VACATION") {
          currentStatus = "ACTIVE";
          await prisma.user.update({
            where: { id: user.id },
            data: { status: "ACTIVE" },
          });
        }

        return {
          ...user,
          status: currentStatus,
        };
      })
    );

    return NextResponse.json(usersWithStatus, { status: 200 });
  } catch (error) {
    console.error(error, "Erro ao buscar usuários");
    return NextResponse.json(
      {
        error: "Erro interno ao buscar usuários",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, cpf, password, jobPositionId } = data;

    if (!name || !cpf || !password) {
      return NextResponse.json(
        { success: false, message: "Nome, CPF e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      return NextResponse.json(
        { success: false, message: "CPF inválido. Deve conter 11 dígitos." },
        { status: 400 }
      );
    }

    const formattedCpf = `${cleanCpf.slice(0, 3)}.${cleanCpf.slice(3, 6)}.${cleanCpf.slice(6, 9)}-${cleanCpf.slice(9, 11)}`;
    const email = `${cleanCpf}@conecta.rh`;

    // 1. Validar se já existe um colaborador ativo com este CPF ou E-mail no sistema
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { cpf: cleanCpf },
          { cpf: formattedCpf },
          { email: email },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Não foi possível cadastrar pois já existe um colaborador com este CPF no sistema." },
        { status: 400 }
      );
    }

    // 2. Buscar o cargo e setor para definir o perfil de acesso dinamicamente se fornecido
    let derivedRole: "ADMIN" | "USER" = "USER";
    if (jobPositionId) {
      const jobPosition = await prisma.jobPosition.findUnique({
        where: { id: jobPositionId },
        include: { department: true },
      });
      if (jobPosition) {
        const normalizedDept = jobPosition.department.name.trim().toUpperCase();
        derivedRole = (
          normalizedDept === "RH" ||
          normalizedDept === "RECURSOS HUMANOS" ||
          normalizedDept === "DP" ||
          normalizedDept === "DEPARTAMENTO PESSOAL"
        ) ? "ADMIN" : "USER";
      }
    }

    // 3. Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Criar usuário no banco
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email,
        cpf: cleanCpf,
        password: hashedPassword,
        role: derivedRole,
        status: "ACTIVE",
        jobPositionId: jobPositionId || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Usuário criado com sucesso de forma manual!",
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          cpf: newUser.cpf,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro na API de cadastro manual de colaborador:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

