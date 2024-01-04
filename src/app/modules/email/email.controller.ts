import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import httpStatus from 'http-status';

import { Brand } from '@prisma/client';


// create
const create = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;

  const result = null

  sendResponse<Brand>(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Brand Added Successfully',
    data: result,
  });
});



export const BrandController = {
  create,
 
};
