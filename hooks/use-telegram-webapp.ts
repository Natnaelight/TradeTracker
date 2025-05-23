"use client";

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
          auth_date: number;
          hash: string;
        };
        themeParams: {
          bg_color: string;
          text_color: string;
          hint_color: string;
          link_color: string;
          button_color: string;
          button_text_color: string;
        };
        colorScheme: 'light' | 'dark';
        ready: () => void;
        expand: () => void;
        close: () => void;
        isExpanded: boolean;
        mainButton: {
          text: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive: boolean) => void;
          hideProgress: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
      };
    };
  }
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface ThemeParams {
  bg_color: string;
  text_color: string;
  hint_color: string;
  link_color: string;
  button_color: string;
  button_text_color: string;
}

export function useTelegramWebApp() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>('');
  const [themeParams, setThemeParams] = useState<ThemeParams | null>(null);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    const tgApp = window.Telegram?.WebApp;

    if (tgApp) {
      // Set ready state
      setIsReady(true);
      
      // Set user data if available
      if (tgApp.initDataUnsafe?.user) {
        setUser(tgApp.initDataUnsafe.user);
      }
      
      // Set init data
      setInitData(tgApp.initData);
      
      // Set theme params
      setThemeParams(tgApp.themeParams);
      
      // Set color scheme
      setColorScheme(tgApp.colorScheme);
      
      // Expand the WebApp
      if (!tgApp.isExpanded) {
        tgApp.expand();
      }
    }
  }, []);

  // Main button controls
  const mainButton = {
    show: (text: string, callback?: () => void) => {
      const tgApp = window.Telegram?.WebApp;
      if (tgApp?.mainButton) {
        tgApp.mainButton.setText(text);
        if (callback) {
          tgApp.mainButton.onClick(callback);
        }
        tgApp.mainButton.show();
      }
    },
    hide: () => {
      window.Telegram?.WebApp.mainButton?.hide();
    },
    showLoader: () => {
      window.Telegram?.WebApp.mainButton?.showProgress(true);
    },
    hideLoader: () => {
      window.Telegram?.WebApp.mainButton?.hideProgress();
    }
  };

  // Back button controls
  const backButton = {
    show: (callback?: () => void) => {
      const tgApp = window.Telegram?.WebApp;
      if (tgApp?.BackButton) {
        if (callback) {
          tgApp.BackButton.onClick(callback);
        }
        tgApp.BackButton.show();
      }
    },
    hide: () => {
      window.Telegram?.WebApp.BackButton?.hide();
    }
  };

  return {
    isReady,
    user,
    initData,
    themeParams,
    colorScheme,
    mainButton,
    backButton,
  };
}