"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { useTelegramWebApp } from "@/hooks/use-telegram-webapp";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { colorScheme } = useTelegramWebApp();
  
  // Set theme based on Telegram's color scheme
  React.useEffect(() => {
    if (colorScheme) {
      props.forcedTheme = colorScheme === "dark" ? "dark" : "light";
    }
  }, [colorScheme]);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}