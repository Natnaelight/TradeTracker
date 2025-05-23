# TradeTrack - Telegram Mini App

A modern trading companion for managing capital and monitoring trades.

## Quick Start

1. Create a new Telegram bot:
   - Open Telegram and search for [@BotFather](https://t.me/BotFather)
   - Send `/newbot` and follow the instructions
   - Copy your bot token

2. Set up your environment:
   ```bash
   cp .env.example .env
   ```
   
3. Update `.env` with your bot token and database URL

4. Install dependencies:
   ```bash
   npm install
   ```

5. Initialize the database:
   ```bash
   npx prisma migrate dev
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## Connecting Your Bot

1. Go to [@BotFather](https://t.me/BotFather)
2. Send `/mybots` and select your bot
3. Click "Bot Settings" > "Menu Button" > "Configure Menu Button"
4. Set the Web App URL to your deployed application URL
5. Test your bot by opening it in Telegram

## Features

- 📊 Real-time trading dashboard
- 💰 Capital management
- 📈 Daily trade logging
- 📅 Monthly performance reports
- 🌓 Automatic dark/light mode
- 📱 Mobile-first design

## Tech Stack

- Next.js 14
- TypeScript
- Prisma ORM
- PostgreSQL
- Telegram WebApp SDK
- TailwindCSS
- Framer Motion
- Zustand

## License

MIT