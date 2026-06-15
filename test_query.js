const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  try {
    const vacations = await prisma.vacation.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
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
        },
      },
      take: 5,
    });

    console.log("VACATIONS DATA:");
    console.log(JSON.stringify(vacations, null, 2));

    const departments = await prisma.department.findMany({
      take: 5,
    });
    console.log("DEPARTMENTS DATA:");
    console.log(JSON.stringify(departments, null, 2));
  } catch (error) {
    console.error("Error running query:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
