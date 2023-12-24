import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';
import { TripService } from './trip.service';
import { Trip } from '@prisma/client';
import pick from '../../../shared/pick';
import { tripFilterableFields } from './trip.constant';
import { paginationFields } from '../../../constants/pagination';

// create
const create = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;

  const result = await TripService.create(data);

  sendResponse<Trip>(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Trip Created Successfully',
    data: result,
  });
});

// get all
const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, tripFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const result = await TripService.getAll(filters, paginationOptions);

  sendResponse<Trip[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Trips retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

// get single
const getSingle = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const result = await TripService.getSingle(id);

  sendResponse<Trip>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Trip retrieved successfully',
    data: result,
  });
});

// update single
const updateSingle = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const data = req.body;

  const result = await TripService.updateSingle(id, data);

  sendResponse<Trip>(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Trip Updated Successfully',
    data: result,
  });
});

// delete single
const deleteSingle = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const result = await TripService.deleteSingle(id);

  sendResponse<Trip>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Trip Deleted successfully',
    data: result,
  });
});

export const TripController = {
  create,
  getAll,
  getSingle,
  updateSingle,
  deleteSingle,
};
