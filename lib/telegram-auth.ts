import { createHmac } from 'crypto';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
}

interface InitData {
  user?: TelegramUser;
  auth_date: number;
  hash: string;
  [key: string]: any;
}

/**
 * Validates Telegram WebApp initData to ensure it hasn't been tampered with
 */
export function validateTelegramInitData(initDataString: string, botToken: string): boolean {
  try {
    // Parse the initData query string into an object
    const searchParams = new URLSearchParams(initDataString);
    const initData: InitData = Object.fromEntries(searchParams.entries()) as any;
    
    if (!initData.hash) {
      throw new Error('Hash is missing from initData');
    }
    
    const hash = initData.hash;
    delete (initData as any).hash;

    
    // Sort the object by keys and create a data string
    const dataCheckString = Object.keys(initData)
      .sort()
      .map(key => `${key}=${initData[key]}`)
      .join('\n');
    
    // Create a secret key by hashing the bot token with SHA-256
    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
    
    // Calculate the expected hash
    const calculatedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    // Compare the calculated hash with the received hash
    return calculatedHash === hash;
  } catch (error) {
    console.error('Error validating Telegram initData:', error);
    return false;
  }
}

/**
 * Extracts user information from Telegram WebApp initData
 */
export function extractUserFromInitData(initDataString: string): TelegramUser | null {
  try {
    // Parse the initData query string into an object
    const searchParams = new URLSearchParams(initDataString);
    const initData = Object.fromEntries(searchParams.entries()) as any;
    
    if (!initData.user) {
      return null;
    }
    
    // Parse the user JSON string
    const user = JSON.parse(initData.user) as TelegramUser;
    return user;
  } catch (error) {
    console.error('Error extracting user from Telegram initData:', error);
    return null;
  }
}