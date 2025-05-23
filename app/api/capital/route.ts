import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { extractUserFromInitData, validateTelegramInitData } from '@/lib/telegram-auth';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Validation schema for capital
const capitalSchema = z.object({
  amountBirr: z.number().positive(),
  amountUsd: z.number().positive(),
  exchangeRate: z.number().positive(),
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
    
    // Get the latest capital record
    const capital = await prisma.capital.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json({ capital });
  } catch (error) {
    console.error('Error fetching capital:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await authenticateUser(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has proper role (only partner can update capital)
    if (user.role !== 'partner') {
      return NextResponse.json({ error: 'Forbidden: Only partners can update capital' }, { status: 403 });
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validatedData = capitalSchema.parse(body);
    
    // Create the capital record
    const capital = await prisma.capital.create({
      data: {
        amountBirr: validatedData.amountBirr,
        amountUsd: validatedData.amountUsd,
        exchangeRate: validatedData.exchangeRate,
      },
    });
    
    return NextResponse.json({ capital });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.format() }, { status: 400 });
    }
    
    console.error('Error updating capital:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}