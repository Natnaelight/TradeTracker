import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { extractUserFromInitData, validateTelegramInitData } from '@/lib/telegram-auth';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Validation schema for new trades
const tradeSchema = z.object({
  amount: z.number(),
  note: z.string().optional(),
  date: z.string().transform(val => new Date(val)),
});

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
    
    // Get query parameters
    const url = new URL(req.url);
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');
    
    // Build date filters if month and year are provided
    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }
    
    // Get trades
    const trades = await prisma.trade.findMany({
      where: {
        userId: user.id,
        ...dateFilter,
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    return NextResponse.json({ trades });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await authenticateUser(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validatedData = tradeSchema.parse(body);
    
    // Create the trade
    const trade = await prisma.trade.create({
      data: {
        userId: user.id,
        amount: validatedData.amount,
        note: validatedData.note,
        date: validatedData.date,
      },
    });
    
    return NextResponse.json({ trade });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.format() }, { status: 400 });
    }
    
    console.error('Error creating trade:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}