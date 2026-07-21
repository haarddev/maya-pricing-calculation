export type CustomerStatus = 'ACTIVE' | 'DISABLED';

export type Customer = {
  id: string;
  name: string;
  description: string;
  status: CustomerStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  catalogCount: number;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
};

export type CreateCustomerInput = {
  name: string;
  description?: string;
  status?: CustomerStatus;
};

export type UpdateCustomerInput = {
  name?: string;
  description?: string;
  status?: CustomerStatus;
};
