import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOrCreateDesocupadoPosition } from "@/lib/setores";

export async function GET() {
  try {
    // Garantir que o setor e cargo de "Desocupados" existem no banco
    const { department: desocupadosDept, position: desocupadosPos } = await getOrCreateDesocupadoPosition();

    // Buscar todos os setores, seus cargos e os colaboradores vinculados
    const departments = await prisma.department.findMany({
      include: {
        positions: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                cpf: true,
                avatar: true,
                role: true,
                status: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Buscar colaboradores que estão sem cargo (jobPositionId === null)
    const unassignedUsers = await prisma.user.findMany({
      where: {
        jobPositionId: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        avatar: true,
        role: true,
        status: true,
      },
    });

    // Mapear os setores e acoplar os colaboradores sem cargo ao cargo "Desocupado" do setor "Desocupados"
    const formattedDepartments = departments.map((dept) => {
      if (dept.id === desocupadosDept.id) {
        // Encontrar a posição "Desocupado" neste setor e adicionar os colaboradores sem cargo
        const updatedPositions = dept.positions.map((pos) => {
          if (pos.id === desocupadosPos.id) {
            // Unir os usuários já vinculados à posição com os que têm jobPositionId null
            const mergedUsers = [...pos.users];
            
            for (const user of unassignedUsers) {
              if (!mergedUsers.some((u) => u.id === user.id)) {
                mergedUsers.push(user);
              }
            }

            return {
              ...pos,
              users: mergedUsers,
            };
          }
          return pos;
        });

        // Caso a posição "Desocupado" não esteja listada (raro se acabamos de criar/recuperar), garantimos ela aqui
        const hasDesocupadoPos = updatedPositions.some((pos) => pos.id === desocupadosPos.id);
        if (!hasDesocupadoPos) {
          updatedPositions.push({
            id: desocupadosPos.id,
            name: desocupadosPos.name,
            departmentId: desocupadosDept.id,
            createdAt: desocupadosPos.createdAt,
            updatedAt: desocupadosPos.updatedAt,
            users: unassignedUsers,
          });
        }

        return {
          ...dept,
          positions: updatedPositions,
        };
      }

      return dept;
    });

    return NextResponse.json(formattedDepartments, { status: 200 });
  } catch (error) {
    console.error("Erro ao carregar setores:", error);
    return NextResponse.json(
      { error: "Erro interno ao carregar setores" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "O nome do setor é obrigatório." },
        { status: 400 }
      );
    }

    const normalizedName = name.trim();

    // Bloquear criação manual de um setor com o nome reservado "Desocupados"
    if (normalizedName.toLowerCase() === "desocupados") {
      return NextResponse.json(
        { error: "O nome 'Desocupados' é reservado pelo sistema." },
        { status: 400 }
      );
    }

    // Verificar se já existe um setor com este nome
    const existingDept = await prisma.department.findUnique({
      where: { name: normalizedName },
    });

    if (existingDept) {
      return NextResponse.json(
        { error: "Já existe um setor cadastrado com este nome." },
        { status: 400 }
      );
    }

    const newDept = await prisma.department.create({
      data: {
        name: normalizedName,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(newDept, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar setor:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar setor." },
      { status: 500 }
    );
  }
}
