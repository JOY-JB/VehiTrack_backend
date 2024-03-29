import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import prisma from '../../../shared/prisma';
import { AccountHead, Equipment, Prisma, Vehicle } from '@prisma/client';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import {
  IEquipmentFilters,
  ISummaryReportFilters,
  ITotalTripSummary,
  IYearMonthSummary,
} from './report.interface';

// balance sheet
const balanceSheet = async (): Promise<AccountHead[]> => {
  const result = await prisma.accountHead.findMany({
    where: {},
    include: {
      accountType: {
        select: { label: true },
      },
      trips: {
        select: {
          amount: true,
        },
      },
      expenses: {
        select: {
          amount: true,
          isMisc: true,
        },
      },
      vehicles: {
        select: {
          vehicleValue: true,
        },
      },
      maintenances: {
        select: {
          serviceCharge: true,
        },
      },
      equipmentUses: {
        select: {
          totalPrice: true,
        },
      },
      accidentHistories: {
        select: {
          paymentStatus: true,
          amount: true,
        },
      },
      paperWorks: {
        select: {
          totalAmount: true,
        },
      },
    },
  });

  return result;
};

// fuel status
const fuelStatus = async (): Promise<Vehicle[]> => {
  const findExpenseHead = await prisma.expenseHead.findFirst({
    where: {
      label: 'Fuel Expense',
    },
  });

  if (!findExpenseHead) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'First Setup Your Account');
  }

  const result = await prisma.vehicle.findMany({
    where: {},
    include: {
      fuels: {
        select: {
          amount: true,
        },
      },
      expenses: {
        where: { expenseHeadId: findExpenseHead.id },
        select: {
          amount: true,
        },
      },
    },
  });

  return result;
};

// stock status
const stockStatus = async (
  filters: IEquipmentFilters,
  paginationOptions: IPaginationOptions
): Promise<IGenericResponse<Equipment[]>> => {
  const { id } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const andConditions = [];

  if (id) {
    andConditions.push({
      id,
    });
  }

  const whereConditions: Prisma.EquipmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.equipment.findMany({
    where: whereConditions,
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip,
    take: limit,
    include: {
      uom: true,
      equipmentIns: {
        select: {
          quantity: true,
        },
      },
      equipmentUses: {
        where: { inHouse: true },
        select: {
          quantity: true,
        },
      },
    },
  });

  const total = await prisma.equipment.count({
    where: whereConditions,
  });
  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data: result,
  };
};

// summary report
const vehicleSummaryReport = async (
  filters: ISummaryReportFilters,
  paginationOptions: IPaginationOptions
): Promise<IGenericResponse<Vehicle[]>> => {
  const { vehicleId, startDate, endDate } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const andConditions = [];
  const tripAndConditions = [];
  const othersAndConditions = [];

  if (vehicleId) {
    andConditions.push({
      id: vehicleId,
    });
  }

  if (startDate) {
    tripAndConditions.push({
      startDate: {
        gte: new Date(`${startDate}, 00:00:00`),
      },
    });
    othersAndConditions.push({
      date: {
        gte: new Date(`${startDate}, 00:00:00`),
      },
    });
  }

  if (endDate) {
    tripAndConditions.push({
      startDate: {
        lte: new Date(`${endDate}, 23:59:59`),
      },
    });
    othersAndConditions.push({
      date: {
        lte: new Date(`${endDate}, 23:59:59`),
      },
    });
  }

  const whereConditions: Prisma.VehicleWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const tripWhereConditions: Prisma.TripWhereInput =
    tripAndConditions.length > 0 ? { AND: tripAndConditions } : {};

  const expenseWhereConditions: Prisma.ExpenseWhereInput =
    othersAndConditions.length > 0 ? { AND: othersAndConditions } : {};

  const maintenanceWhereConditions: Prisma.MaintenanceWhereInput =
    othersAndConditions.length > 0 ? { AND: othersAndConditions } : {};

  const paperWhereConditions: Prisma.PaperWorkWhereInput =
    othersAndConditions.length > 0 ? { AND: othersAndConditions } : {};

  const equipmentWhereConditions: Prisma.EquipmentUseWhereInput =
    othersAndConditions.length > 0 ? { AND: othersAndConditions } : {};

  const result = await prisma.vehicle.findMany({
    where: whereConditions,
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip,
    take: limit,
    include: {
      trips: {
        where: tripWhereConditions,
        select: {
          amount: true,
        },
      },
      expenses: {
        where: expenseWhereConditions,
        select: {
          amount: true,
          isMisc: true,
        },
      },
      maintenances: {
        where: maintenanceWhereConditions,
        select: {
          serviceCharge: true,
        },
      },
      paperWorks: {
        where: paperWhereConditions,
        select: {
          totalAmount: true,
        },
      },
      equipmentUses: {
        where: equipmentWhereConditions,
        select: {
          totalPrice: true,
        },
      },
    },
  });

  const total = await prisma.vehicle.count({
    where: whereConditions,
  });
  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data: result,
  };
};

const getTripSummary = async (): Promise<ITotalTripSummary> => {
  const trips = await prisma.trip.groupBy({
    by: ['status'],
    where: {
      status: 'Completed',
    },
    _sum: {
      amount: true,
    },
    _count: true,
  });
  const expenses = await prisma.expense.groupBy({
    by: ['isMisc'],
    where: {
      isMisc: false,
    },
    _sum: {
      amount: true,
    },
  });

  const result: ITotalTripSummary = {};

  if (trips.length) {
    result.count = trips[0]._count || 0;
    result.amount = trips[0]._sum.amount || 0;
  }

  if (expenses.length) {
    result.expense = expenses[0]._sum.amount || 0;
  }

  return result;
};

const tripSummaryGroupByMonthYear = async (): Promise<IYearMonthSummary[]> => {
  const result: IYearMonthSummary[] =
    await prisma.$queryRaw`SELECT EXTRACT(YEAR FROM "startDate") AS year, EXTRACT(MONTH FROM "startDate") AS month,  SUM(amount) AS total_amount FROM trips GROUP BY year, month ORDER BY year, month`;

  const formattedResult = result.map(row => ({
    year: row.year,
    month: row.month,
    total_amount: Number(row.total_amount),
  }));
  return formattedResult;
};

const fuelSummaryGroupByMonthYear = async (): Promise<IYearMonthSummary[]> => {
  const result: IYearMonthSummary[] =
    await prisma.$queryRaw`SELECT EXTRACT(YEAR FROM date) AS year, EXTRACT(MONTH FROM date) AS month, SUM(quantity) AS total_quantity, SUM(amount) AS total_amount FROM fuels GROUP BY year, month ORDER BY year, month`;

  const formattedResult = result.map(row => ({
    year: row.year,
    month: row.month,
    total_quantity: Number(row.total_quantity),
    total_amount: Number(row.total_amount),
  }));
  return formattedResult;
};

export const ReportService = {
  balanceSheet,
  fuelStatus,
  stockStatus,
  vehicleSummaryReport,
  getTripSummary,
  tripSummaryGroupByMonthYear,
  fuelSummaryGroupByMonthYear,
};
