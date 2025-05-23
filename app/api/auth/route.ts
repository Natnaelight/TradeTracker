import { NextResponse } from 'next/server';
import { validateTelegramInitData, extractUserFromInitData } from '@/lib/telegram-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function POST(req: Request) {
  try {
    const { initData } = await req.json();
    
    // Validate the initData
    if (!BOT_TOKEN) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }
    
    const isValid = validateTelegramInitData(initData, BOT_TOKEN);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid authentication data' }, { status: 401 });
    }
    
    // Extract the user from initData
    const telegramUser = extractUserFromInitData(initData);
    
    if (!telegramUser) {
      return NextResponse.json({ error: 'User data not found' }, { status: 400 });
    }
    
    // Check if user exists in the database
    let user = await prisma.user.findUnique({
      where: {
        telegramId: telegramUser.id.toString(),
      },
    });
    
    // Create the user if they don't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: telegramUser.id.toString(),
          name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
          role: 'trader', // Default role, can be changed later
        },
      });
    }
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        name: user.name,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Error in auth route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}