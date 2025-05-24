import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { extractUserFromInitData, validateTelegramInitData } from '@/lib/telegram-auth';
export const dynamic = 'force-dynamic';

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
  console.log('[AUTH] X-Telegram-Init-Data:', telegramInitData);

  if (!telegramInitData || !BOT_TOKEN) {
    console.warn('[AUTH] Missing init data or bot token.');
    return null;
  }

  const isValid = validateTelegramInitData(telegramInitData, BOT_TOKEN);
  if (!isValid) {
    console.warn('[AUTH] Invalid Telegram init data.');
    return null;
  }

  const telegramUser = extractUserFromInitData(telegramInitData);
  if (!telegramUser) {
    console.warn('[AUTH] Could not extract user from init data.');
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      telegramId: telegramUser.id.toString(),
    },
  });

  if (!user) {
    console.warn('[AUTH] No matching user in database.');
  }

  return user;
}

export async function GET(req: Request) {
  console.log('---- Incoming GET /api/trades ----');
  try {
    const user = await authenticateUser(req);
    if (!user) {
      console.warn('[GET] Unauthorized access.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This is the correct way to get the URL
    const url = new URL(req.url);
    
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');
    console.log('[GET] Query params:', { month, year });

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
      console.log('[GET] Date filter:', dateFilter);
    }

    const trades = await prisma.trade.findMany({
      where: {
        userId: user.id,
        ...dateFilter,
      },
      orderBy: {
        date: 'desc',
      },
    });

    console.log('[GET] Retrieved trades:', trades.length);
    return NextResponse.json({ trades });
  } catch (error) {
    console.error('[GET] Error fetching trades:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  console.log('---- Incoming POST /api/trades ----');
  try {
    const telegramInitData = req.headers.get('X-Telegram-Init-Data');
    console.log('[POST] Telegram Init Data:', telegramInitData);

    const user = await authenticateUser(req);
    if (!user) {
      console.warn('[POST] Unauthorized access.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('[POST] Raw body:', body);

    const validatedData = tradeSchema.parse(body);
    console.log('[POST] Validated data:', validatedData);

    const trade = await prisma.trade.create({
      data: {
        userId: user.id,
        amount: validatedData.amount,
        note: validatedData.note,
        date: validatedData.date,
      },
    });

    console.log('[POST] Trade created:', trade);
    return NextResponse.json({ trade });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn('[POST] Validation error:', error.format());
      return NextResponse.json({ error: 'Validation error', details: error.format() }, { status: 400 });
    }

    console.error('[POST] Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
