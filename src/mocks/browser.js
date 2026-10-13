import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/authHandlers';
import { horseHandlers } from './handlers/horseHandlers';
import { bookingHandlers } from './handlers/bookingHandlers';
import { tripHandlers } from './handlers/tripHandlers';
import { dossierHandlers } from './handlers/dossierHandlers';
import { specialistHandlers } from './handlers/specialistHandlers';
import { driverHandlers } from './handlers/driverHandlers';

export const worker = setupWorker(
  ...driverHandlers,
  ...specialistHandlers,
  ...authHandlers,
  ...horseHandlers,
  ...bookingHandlers,
  ...tripHandlers,
  ...dossierHandlers,
);

