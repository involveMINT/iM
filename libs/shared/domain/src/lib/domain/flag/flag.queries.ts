import { createQuery } from '@orcha/common';
import { Flag } from './flag.model';

/** Unsure if this will be needed for same reason as flag.dto */
export const flagQuery = createQuery<Flag>()({
  id: true,
  dateCreated: true,
  comment: {
    id: true
  },
  user: {
    id: true,
  }
})