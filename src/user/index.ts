import { Attributes } from 'onecore';

export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  status?: boolean;
  createdDate?: string;
}

export const userModel: Attributes = {
  id: {
    key: true,
    length: 11,
    type: 'number'
  },
  username: {
    length: 10,
    required: true
  },
  email: {
    length: 31,
    required: true
  },
  phone: {
    length: 20
  },
  status: {
    length: 5
  },
  createdDate: {
    length: 10,
    type: 'date'
  }
};
