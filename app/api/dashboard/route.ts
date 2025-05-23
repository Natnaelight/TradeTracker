import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractUserFromInitData, validateTelegramInitData } from '@/lib/telegram-auth';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Authentication middleware
async function authenticateUser(req: Request) {
  const telegramInitData = req.headers.get('X-Telegram-Init-Data');
  
  if (!telegramInitData || !BOT_TOKEN) {
    return null;
  }
  
  const isValid = validateTelegramInitData(telegramInitData, BOT_TOKEN);
  
  if (!isValid) {
    return null;
  }
  
  const telegramUser = extractUserFromInitData(telegramInitData);
  
  if (!telegramUser) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: {
      telegramId: telegramUser.id.toString(),
    },
  });
  
  return user;
}

export async function GET(req: Request) {
  try {
    const user = await authenticateUser(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the latest capital record
    const capital = await prisma.capital.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Calculate trade metrics
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Get month-to-date trades
    const mtdTrades = await prisma.trade.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });
    
    // Calculate MTD profit
    const mtdProfit = mtdTrades.reduce((sum, trade) => sum + trade.amount, 0);
    
    // Get all-time trades
    const allTrades = await prisma.trade.findMany();
    
    // Calculate all-time profit
    const totalProfit = allTrades.reduce((sum, trade) => sum + trade.amount, 0);
    
    // Get recent trades (last 5)
    const recentTrades = await prisma.trade.findMany({
      orderBy: {
        date: 'desc',
      },
      take: 5,
    });
    
    // Get trade count
    const tradeCount = allTrades.length;
    
    // Calculate win rate (positive trades / total trades)
    const winningTrades = allTrades.filter(trade => trade.amount > 0).length;
    const winRate = tradeCount > 0 ? (winningTrades / tradeCount) * 100 : 0;
    
    return NextResponse.json({
      capital,
      mtdProfit,
      totalProfit,
      recentTrades,
      tradeCount,
      winRate,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}