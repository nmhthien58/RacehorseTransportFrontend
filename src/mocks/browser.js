import { setupWorker } from 'msw/browser';
import { authHandlers } from './handlers/authHandlers';
import { horseHandlers } from './handlers/horseHandlers';
import { bookingHandlers } from './handlers/bookingHandlers';
import { tripHandlers } from './handlers/tripHandlers';
import { dossierHandlers } from './handlers/dossierHandlers';

export const worker = setupWorker(
  ...authHandlers,
  ...horseHandlers,
  ...bookingHandlers,
  ...tripHandlers,
  ...dossierHandlers,
);
