import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // --- Admin User ---
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@mms.local' },
    update: {},
    create: {
      email: 'admin@mms.local',
      password: hashedPassword,
      name: 'Admin',
      role: Role.ADMIN,
    },
  });

  console.log('Seed: admin@mms.local created');

  // --- Vendors ---
  const vendorNames = [
    'Arvind Mills',
    'Raymond',
    'Bombay Dyeing',
    'Vardhman Textiles',
  ];

  const vendors = await Promise.all(
    vendorNames.map((name) =>
      prisma.vendor.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  console.log(`Seed: ${vendors.length} vendors upserted`);

  // --- Material Types ---
  const materialTypeNames = ['Cotton', 'Polyester', 'Silk', 'Linen'];

  const materialTypes = await Promise.all(
    materialTypeNames.map((name) =>
      prisma.materialType.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  console.log(`Seed: ${materialTypes.length} material types upserted`);

  // --- System Config ---
  await prisma.systemConfig.upsert({
    where: { key: 'leftover_threshold' },
    update: {},
    create: { key: 'leftover_threshold', value: '0.5' },
  });

  console.log('Seed: SystemConfig leftover_threshold set to 0.5');

  // --- Sample Rolls ---
  const sampleRolls = [
    {
      rollCode: 'ROLL-SEED-001',
      vendorId: vendors[0].id,
      materialTypeId: materialTypes[0].id,
      color: 'White',
      gsm: 180,
      initialMeters: 100,
      remainingMeters: 100,
      cost: 5000,
      purchaseDate: new Date('2024-01-15'),
    },
    {
      rollCode: 'ROLL-SEED-002',
      vendorId: vendors[1].id,
      materialTypeId: materialTypes[1].id,
      color: 'Navy Blue',
      shade: 'Dark',
      gsm: 220,
      initialMeters: 80,
      remainingMeters: 80,
      cost: 7200,
      purchaseDate: new Date('2024-02-10'),
    },
    {
      rollCode: 'ROLL-SEED-003',
      vendorId: vendors[2].id,
      materialTypeId: materialTypes[2].id,
      color: 'Red',
      gsm: 120,
      initialMeters: 50,
      remainingMeters: 50,
      cost: 12000,
      purchaseDate: new Date('2024-03-05'),
    },
  ];

  const rolls = await Promise.all(
    sampleRolls.map((roll) =>
      prisma.inventoryRoll.upsert({
        where: { rollCode: roll.rollCode },
        update: {},
        create: roll,
      }),
    ),
  );

  console.log(`Seed: ${rolls.length} sample rolls upserted`);

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
