let PrismaClient: any = null;
let prismaInstance: any = null;

try {

  const pkg = require('@prisma/client');
  PrismaClient = pkg?.PrismaClient ?? pkg?.default?.PrismaClient ?? pkg?.default;
} catch (err) {
  PrismaClient = null;
}

declare global {
  var prisma: any | undefined;
}

if (PrismaClient) {
  prismaInstance = global.prisma || new PrismaClient();
  if (process.env.NODE_ENV === 'development') global.prisma = prismaInstance;
} else {
  prismaInstance = {
    user: {
      upsert: async () => {
        return null;
      },
      findMany: async () => {
        return [];
      },
    },
  };
}

export default prismaInstance;
