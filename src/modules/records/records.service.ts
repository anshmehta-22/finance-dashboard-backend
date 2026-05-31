import { Prisma, PrismaClient } from "@prisma/client";
import { AppError } from "../../middleware/error.middleware";
import {
  CreateRecordInput,
  FilterInput,
  UpdateRecordInput,
} from "./records.schema";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export class RecordsService {
  async getRecords(filters: FilterInput) {
    const where: Prisma.FinancialRecordWhereInput = {
      deletedAt: null,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [
        { category: { contains: filters.search } },
        { notes: { contains: filters.search } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};

      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }

      if (filters.endDate) {
        where.date.lte = filters.endDate;
      }
    }

    const skip = (filters.page - 1) * filters.limit;

    const [data, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        orderBy: {
          date: "desc",
        },
        skip,
        take: filters.limit,
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.financialRecord.count({ where }),
    ]);

    return {
      data,
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getRecordById(id: string) {
    const record = await prisma.financialRecord.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!record) {
      throw new AppError("Record not found", 404);
    }

    return record;
  }

  async createRecord(data: CreateRecordInput, userId: string) {
    return prisma.financialRecord.create({
      data: {
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: data.date,
        notes: data.notes,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async updateRecord(id: string, data: UpdateRecordInput) {
    const record = await prisma.financialRecord.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!record) {
      throw new AppError("Record not found", 404);
    }

    return prisma.financialRecord.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async deleteRecord(id: string) {
    const record = await prisma.financialRecord.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!record) {
      throw new AppError("Record not found", 404);
    }

    await prisma.financialRecord.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: "Record deleted successfully" };
  }

  async getDeletedRecords() {
    return prisma.financialRecord.findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      orderBy: {
        date: "desc",
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async restoreRecord(id: string) {
    const record = await prisma.financialRecord.findFirst({
      where: {
        id,
        deletedAt: {
          not: null,
        },
      },
    });

    if (!record) {
      throw new AppError("Record not found", 404);
    }

    return prisma.financialRecord.update({
      where: { id },
      data: {
        deletedAt: null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}
