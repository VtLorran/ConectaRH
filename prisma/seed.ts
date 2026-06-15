import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando semeadura do banco de dados...");

  // 1. Limpar dados existentes (opcional, para garantir um recomeço limpo)
  await prisma.timeRecordPause.deleteMany({});
  await prisma.timeRecord.deleteMany({});
  await prisma.pauseCategory.deleteMany({});
  await prisma.admission.deleteMany({});
  await prisma.admissionTemplate.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.jobPosition.deleteMany({});
  await prisma.department.deleteMany({});

  console.log("Limpeza concluída.");

  // 2. Criar setores (Departments)
  const rhDepartment = await prisma.department.create({
    data: {
      name: "Recursos Humanos",
      description: "Setor responsável pela gestão de pessoas, contratações e benefícios.",
    },
  });

  const dpDepartment = await prisma.department.create({
    data: {
      name: "Departamento Pessoal",
      description: "Setor responsável pela folha de pagamento, férias e rescisões.",
    },
  });

  const techDepartment = await prisma.department.create({
    data: {
      name: "Tecnologia",
      description: "Setor responsável pelo desenvolvimento e infraestrutura de TI.",
    },
  });

  const salesDepartment = await prisma.department.create({
    data: {
      name: "Vendas",
      description: "Setor responsável pelo comercial, novos clientes e pós-vendas.",
    },
  });

  console.log("Setores criados com sucesso.");

  // 3. Criar cargos (JobPositions)
  const rhAnalyst = await prisma.jobPosition.create({
    data: {
      name: "Analista de RH",
      departmentId: rhDepartment.id,
    },
  });

  const dpAnalyst = await prisma.jobPosition.create({
    data: {
      name: "Analista de DP",
      departmentId: dpDepartment.id,
    },
  });

  const devFullStack = await prisma.jobPosition.create({
    data: {
      name: "Desenvolvedor Full Stack",
      departmentId: techDepartment.id,
    },
  });

  const salesAnalyst = await prisma.jobPosition.create({
    data: {
      name: "Analista Comercial",
      departmentId: salesDepartment.id,
    },
  });

  console.log("Cargos criados com sucesso.");

  // 4. Criar o Usuário Administrador padrão
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash("admin123", saltRounds);

  const adminUser = await prisma.user.create({
    data: {
      name: "Administrador ConectaRH",
      email: "admin@conectarh.com",
      cpf: "12345678900", // CPF limpo usado para login
      password: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
      jobPositionId: rhAnalyst.id,
    },
  });

  console.log("Usuário administrador criado:");
  console.log(`- Nome: ${adminUser.name}`);
  console.log(`- CPF para login: ${adminUser.cpf}`);
  console.log(`- Senha padrão: admin123`);
  console.log(`- E-mail: ${adminUser.email}`);

  // 5. Criar categorias de pausa padrões
  const almocoCategory = await prisma.pauseCategory.create({
    data: {
      name: "Almoço",
      duration: 60,
    },
  });

  const cafeCategory = await prisma.pauseCategory.create({
    data: {
      name: "Café da Tarde",
      duration: 15,
    },
  });

  console.log("Categorias de pausa criadas.");

  // 6. Criar registros de ponto de teste para o Administrador
  // Vamos criar pontos para os últimos 4 dias úteis
  const today = new Date();
  const createTestPoint = async (offsetDays: number, entryHour: number, exitHour: number, hasPauses = true) => {
    const date = new Date();
    date.setDate(today.getDate() - offsetDays);
    date.setHours(0, 0, 0, 0);

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return; // pular fins de semana

    const entryTime = new Date(date);
    entryTime.setHours(entryHour, 0, 0, 0);

    const exitTime = new Date(date);
    exitTime.setHours(exitHour, 0, 0, 0);

    const record = await prisma.timeRecord.create({
      data: {
        userId: adminUser.id,
        date,
        entryTime,
        exitTime,
      },
    });

    if (hasPauses) {
      const startAlmoco = new Date(date);
      startAlmoco.setHours(12, 0, 0, 0);
      const endAlmoco = new Date(date);
      endAlmoco.setHours(13, 0, 0, 0);

      await prisma.timeRecordPause.create({
        data: {
          timeRecordId: record.id,
          pauseCategoryId: almocoCategory.id,
          startTime: startAlmoco,
          endTime: endAlmoco,
        },
      });

      const startCafe = new Date(date);
      startCafe.setHours(15, 30, 0, 0);
      const endCafe = new Date(date);
      endCafe.setHours(15, 45, 0, 0);

      await prisma.timeRecordPause.create({
        data: {
          timeRecordId: record.id,
          pauseCategoryId: cafeCategory.id,
          startTime: startCafe,
          endTime: endCafe,
        },
      });
    }
  };

  await createTestPoint(1, 8, 17);
  await createTestPoint(2, 9, 18);
  await createTestPoint(3, 8, 16, false);
  await createTestPoint(4, 8, 17);

  console.log("Registros de ponto de teste criados.");

  console.log("Semeadura concluída com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro durante a semeadura:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
