import express from 'express';
import validateRequest from '../../middlewares/validateRequest';

import { EmailValidation } from './email.validation';
import { BrandController } from './email.controller';

const router = express.Router();

// create
router.post(
  '/create',
  // auth(
  //   ENUM_USER_ROLE.SUPER_ADMIN,
  //   ENUM_USER_ROLE.ADMIN,
  //   ENUM_USER_ROLE.DRIVER,
  //   ENUM_USER_ROLE.HELPER
  // ),
  validateRequest(EmailValidation.create),
  BrandController.create
);


export const BrandRoutes = router;
