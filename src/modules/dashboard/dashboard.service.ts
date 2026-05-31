import prisma from '../../config/prisma';

export class DashboardService {
  async getSummary() {
    const [incomeAggregate, expenseAggregate] = await Promise.all([
      prisma.financialRecord.aggregate({
        where: { type: 'INCOME', deletedAt: null },
        _sum: { amount: true },
      }),
      prisma.financialRecord.aggregate({
        where: { type: 'EXPENSE', deletedAt: null },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = incomeAggregate._sum.amount ?? 0;
    const totalExpenses = expenseAggregate._sum.amount ?? 0;

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
    };
  }

  async getByCategory() {
    const groupedRecords = await prisma.financialRecord.groupBy({
      by: ['category', 'type'],
      where: { deletedAt: null },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      orderBy: [{ category: 'asc' }, { type: 'asc' }],
    });

    type GroupedRecordRow = (typeof groupedRecords)[number];

    const mapCategoryRows = (
      type: 'INCOME' | 'EXPENSE',
    ): Array<{ category: string; total: number; count: number }> =>
      groupedRecords
        .filter((record: GroupedRecordRow) => record.type === type)
        .map((record: GroupedRecordRow) => ({
          category: record.category,
          total: record._sum.amount ?? 0,
          count: record._count.id,
        }));

    return {
      income: mapCategoryRows('INCOME'),
      expenses: mapCategoryRows('EXPENSE'),
    };
  }

  async getTrends(period: 'monthly' | 'weekly') {
    const records = await prisma.financialRecord.findMany({
      where: { deletedAt: null },
      select: {
        amount: true,
        type: true,
        date: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    const formatMonth = (date: Date) => date.toISOString().slice(0, 7);

    const getIsoWeekParts = (date: Date) => {
      const target = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
      );
      const dayNumber = target.getUTCDay() || 7;
      target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
      const isoYear = target.getUTCFullYear();
      const yearStart = new Date(Date.UTC(isoYear, 0, 1));
      const weekNumber = Math.ceil(
        ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
      );

      return { isoYear, weekNumber };
    };

    const getPeriodKey = (date: Date) => {
      if (period === 'monthly') {
        return formatMonth(date);
      }

      const { isoYear, weekNumber } = getIsoWeekParts(date);
      return `${isoYear}-${String(weekNumber).padStart(2, '0')}`;
    };

    const grouped = new Map<string, { income: number; expenses: number }>();

    for (const record of records) {
      const key = getPeriodKey(record.date);
      const existing = grouped.get(key) ?? { income: 0, expenses: 0 };

      if (record.type === 'INCOME') {
        existing.income += record.amount;
      } else {
        existing.expenses += record.amount;
      }

      grouped.set(key, existing);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periodKey, values]) => ({
        period: periodKey,
        income: values.income,
        expenses: values.expenses,
        net: values.income - values.expenses,
      }));
  }

  async getRecentActivity() {
    const records = await prisma.financialRecord.findMany({
      where: { deletedAt: null },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            email: true,
          },
        },
      },
    });

    return { records };
  }
}
