import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractUserFromInitData, validateTelegramInitData } from '@/lib/telegram-auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

async function authenticateUser(req: Request) {
  const telegramInitData = req.headers.get('X-Telegram-Init-Data');
  console.log('[DASHBOARD AUTH] Received init data');

  if (!telegramInitData || !BOT_TOKEN) {
    console.warn('[DASHBOARD AUTH] Missing auth data');
    return null;
  }

  const isValid = validateTelegramInitData(telegramInitData, BOT_TOKEN);
  if (!isValid) {
    console.warn('[DASHBOARD AUTH] Invalid auth');
    return null;
  }

  const telegramUser = extractUserFromInitData(telegramInitData);
  if (!telegramUser) {
    console.warn('[DASHBOARD AUTH] No user extracted');
    return null;
  }

  try {
    return await prisma.user.findUnique({
      where: { telegramId: telegramUser.id.toString() }
    });
  } catch (error) {
    console.error('[DASHBOARD AUTH] Database error:', error);
    return null;
  }
}

export async function GET(req: Request) {
  console.log('[DASHBOARD] GET request received');
  
  try {
    const user = await authenticateUser(req);
    if (!user) {
      console.warn('[DASHBOARD] Unauthorized access');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const capital = await prisma.capital.findFirst({ 
      orderBy: { createdAt: 'desc' } 
    });
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const mtdTrades = await prisma.trade.findMany({
      where: { date: { gte: startOfMonth, lte: endOfMonth } }
    });
    
    const allTrades = await prisma.trade.findMany();
    const recentTrades = await prisma.trade.findMany({ 
      orderBy: { date: 'desc' }, 
      take: 5 
    });
    
    const mtdProfit = mtdTrades.reduce((sum, trade) => sum + trade.amount, 0);
    const totalProfit = allTrades.reduce((sum, trade) => sum + trade.amount, 0);
    const winRate = allTrades.length > 0 
      ? (allTrades.filter(t => t.amount > 0).length / allTrades.length * 100) 
      : 0;

    console.log('[DASHBOARD] Data fetched successfully');
    return NextResponse.json({
      capital,
      mtdProfit,
      totalProfit,
      recentTrades,
      tradeCount: allTrades.length,
      winRate
    });

  } catch (error) {
    console.error('[DASHBOARD ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}