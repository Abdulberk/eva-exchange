// prisma/seed.ts

import { PrismaClient, TradeType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const sharesData = [
    { symbol: 'APL', price: 150.0 },
    { symbol: 'GOL', price: 2800.0 },
    { symbol: 'AMZ', price: 3400.0 },
    { symbol: 'MSF', price: 300.0 },
    { symbol: 'TSL', price: 700.0 },
  ];

  await prisma.share.createMany({
    data: sharesData,
    skipDuplicates: true,
  });

  console.log('Shares initialized.');

  const usersData = [
    { email: 'alice@example.com', name: 'Alice' },
    { email: 'bob@example.com', name: 'Bob' },
    { email: 'charlie@example.com', name: 'Charlie' },
    { email: 'david@example.com', name: 'David' },
    { email: 'eve@example.com', name: 'Eve' },
  ];

  for (const userData of usersData) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const newUser = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          portfolio: {
            create: {},
          },
        },
      });

      console.log(`Created user: ${newUser.email}`);
    } else {
      console.log(`User already exists: ${existingUser.email}`);
    }
  }

  const users = await prisma.user.findMany({
    include: { portfolio: { include: { portfolioShares: true } } },
  });

  for (const user of users) {
    if (!user.portfolio) {
      console.warn(
        `User ${user.email} does not have a portfolio. Skipping trades.`,
      );
      continue;
    }

    const portfolioShares = await prisma.portfolioShare.findMany({
      where: { portfolioId: user.portfolio.id },
      include: { share: true },
    });

    if (portfolioShares.length === 0) {
      const shares = await prisma.share.findMany();
      const portfolioSharesData = shares.map((share) => ({
        portfolioId: user.portfolio.id,
        shareId: share.id,
        quantity: 10.0,
      }));

      await prisma.portfolioShare.createMany({
        data: portfolioSharesData,
        skipDuplicates: true,
      });

      console.log(`Initialized portfolio shares for user: ${user.email}`);
    }

    const tradesData = [
      {
        portfolioId: user.portfolio.id,
        shareId: sharesData[0].symbol,
        quantity: 5,
        price: sharesData[0].price,
        type: TradeType.BUY,
      },
      {
        portfolioId: user.portfolio.id,
        shareId: sharesData[1].symbol,
        quantity: 2,
        price: sharesData[1].price,
        type: TradeType.SELL,
      },
      {
        portfolioId: user.portfolio.id,
        shareId: sharesData[2].symbol,
        quantity: 3,
        price: sharesData[2].price,
        type: TradeType.BUY,
      },
      {
        portfolioId: user.portfolio.id,
        shareId: sharesData[3].symbol,
        quantity: 4,
        price: sharesData[3].price,
        type: TradeType.SELL,
      },
    ];

    for (const tradeData of tradesData) {
      const share = await prisma.share.findUnique({
        where: { symbol: tradeData.shareId },
      });

      if (!share) {
        console.warn(
          `Share with symbol ${tradeData.shareId} not found. Skipping trade.`,
        );
        continue;
      }

      await prisma.trade.create({
        data: {
          portfolioId: tradeData.portfolioId,
          shareId: share.id,
          quantity: tradeData.quantity,
          price: tradeData.price,
          type: tradeData.type,
        },
      });

      console.log(
        `Created ${tradeData.type} trade for user ${user.email}: ${tradeData.quantity} ${tradeData.shareId} at $${tradeData.price}`,
      );
    }
  }

  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
