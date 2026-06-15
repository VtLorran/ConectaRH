import prisma from "@/lib/prisma";

export async function getOrCreateDesocupadoPosition() {
  // 1. Get or create Department "Desocupados"
  let department = await prisma.department.findUnique({
    where: { name: "Desocupados" },
  });

  if (!department) {
    department = await prisma.department.create({
      data: {
        name: "Desocupados",
        description: "Setor temporário para colaboradores sem setor/cargo definido.",
      },
    });
  }

  // 2. Get or create JobPosition "Desocupado" inside "Desocupados"
  let position = await prisma.jobPosition.findFirst({
    where: {
      name: "Desocupado",
      departmentId: department.id,
    },
  });

  if (!position) {
    position = await prisma.jobPosition.create({
      data: {
        name: "Desocupado",
        departmentId: department.id,
      },
    });
  }

  return { department, position };
}
