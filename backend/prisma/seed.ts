import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';
import {
  KIVUNIM_CUSTOMER_NAME,
  MOD_CUSTOMER_NAME,
} from '../src/constants/customers.js';
import { ensureSettings } from '../src/services/settings.service.js';
import { seedClientTemplates } from './seed-client-templates.js';
import { seedPriceList } from './seed-price-list.js';

const prisma = new PrismaClient();

async function ensureCustomer(
  name: string,
  description: string,
  adminId: string,
) {
  const existing = await prisma.customer.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.customer.create({
    data: {
      name,
      description,
      status: 'ACTIVE',
      createdById: adminId,
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@maya.local' },
    update: { role: UserRole.ADMIN, status: 'ACTIVE' },
    create: {
      email: 'admin@maya.local',
      passwordHash,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });

  await ensureSettings();

  const kivunimCustomer = await ensureCustomer(
    KIVUNIM_CUSTOMER_NAME,
    'Real client price lists from the Kivunim Excel (dedicated trips + hops).',
    admin.id,
  );
  const modCustomer = await ensureCustomer(
    MOD_CUSTOMER_NAME,
    'Ministry of Defense (Maya) — Masha line prices + km/hour rates from client 2026 price list.',
    admin.id,
  );
  console.log(`Customers ready: "${kivunimCustomer.name}", "${modCustomer.name}"`);

  const clientTemplatesCreated = await seedClientTemplates(prisma, admin.id);
  if (clientTemplatesCreated > 0) {
    console.log(`Created ${clientTemplatesCreated} client templates`);
  }

  const priceListCatalogsCreated = await seedPriceList(
    prisma,
    admin.id,
    kivunimCustomer.id,
  );
  if (priceListCatalogsCreated > 0) {
    console.log(`Created ${priceListCatalogsCreated} Kivunim price list catalogs`);
  }

  console.log('Seed completed (real clients only — run npm run import:mod-pricelist for MoD catalogs)');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
