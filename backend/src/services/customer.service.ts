import { CustomerStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';

const createCustomerSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
});

const customerInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
  _count: { select: { catalogs: true } },
};

export async function listCustomers(filters: {
  status?: CustomerStatus;
  search?: string;
}) {
  const where: {
    status?: CustomerStatus;
    name?: { contains: string; mode: 'insensitive' };
  } = {};

  if (filters.status) where.status = filters.status;
  if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' };

  const customers = await prisma.customer.findMany({
    where,
    include: customerInclude,
    orderBy: { updatedAt: 'desc' },
  });

  return customers.map(({ _count, ...customer }) => ({
    ...customer,
    catalogCount: _count.catalogs,
  }));
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: customerInclude,
  });

  if (!customer) {
    throw new AppError(404, 'Customer not found');
  }

  const { _count, ...rest } = customer;
  return { ...rest, catalogCount: _count.catalogs };
}

export async function createCustomer(input: unknown, userId: string) {
  const data = createCustomerSchema.parse(input);

  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      description: data.description ?? '',
      status: data.status ?? CustomerStatus.ACTIVE,
      createdById: userId,
    },
    include: customerInclude,
  });

  const { _count, ...rest } = customer;
  return { ...rest, catalogCount: _count.catalogs };
}

export async function updateCustomer(id: string, input: unknown) {
  await getCustomerById(id);
  const data = updateCustomerSchema.parse(input);

  const customer = await prisma.customer.update({
    where: { id },
    data,
    include: customerInclude,
  });

  const { _count, ...rest } = customer;
  return { ...rest, catalogCount: _count.catalogs };
}

export async function deleteCustomer(id: string) {
  await getCustomerById(id);

  const catalogCount = await prisma.catalog.count({ where: { customerId: id } });
  if (catalogCount > 0) {
    throw new AppError(
      400,
      `Cannot delete customer with ${catalogCount} price list entries. Remove or reassign catalogs first.`,
    );
  }

  await prisma.customer.delete({ where: { id } });
}

/** Ensures a customer exists and is ACTIVE (for pricing / catalog create). */
export async function requireActiveCustomer(customerId: string) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new AppError(404, 'Customer not found');
  }
  if (customer.status !== CustomerStatus.ACTIVE) {
    throw new AppError(400, 'Customer is disabled');
  }
  return customer;
}
