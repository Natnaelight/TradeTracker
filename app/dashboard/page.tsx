"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useTradeStore } from "@/lib/store";
import { useTelegramWebApp } from "@/hooks/use-telegram-webapp";
import { Loader2, DollarSign, TrendingUp, Calendar, LineChart } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import DashboardChart from "@/components/dashboard/dashboard-chart";
import RecentTrades from "@/components/dashboard/recent-trades";

export default function Dashboard() {
  const { isReady, user: telegramUser } = useTelegramWebApp();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  // Fetch dashboard data
  useEffect(() => {
    if (isReady && telegramUser) {
      fetch("/api/dashboard", {
        headers: {
          "X-Telegram-Init-Data": window.Telegram.WebApp.initData
        }
      })
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch dashboard data");
          return res.json();
        })
        .then(data => {
          setDashboardData(data);
          setIsLoading(false);
        })
        .catch(err => {
          toast({
            title: "Error",
            description: err.message,
            variant: "destructive"
          });
          setIsLoading(false);
        });
    }
  }, [isReady, telegramUser, toast]);

  // Loading state
  if (!isReady || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span className="text-sm text-muted-foreground">
          {format(new Date(), "MMMM yyyy")}
        </span>
      </header>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <DollarSign className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Capital (USD)</p>
                    <p className="text-2xl font-bold">
                      {dashboardData?.capital ? `$${dashboardData.capital.amountUsd.toFixed(2)}` : "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <TrendingUp className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Monthly P/L</p>
                    <p className={`text-2xl font-bold ${dashboardData?.mtdProfit >= 0 ? "text-chart-2" : "text-destructive"}`}>
                      {dashboardData?.mtdProfit !== undefined ? `$${dashboardData.mtdProfit.toFixed(2)}` : "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardChart data={dashboardData?.recentTrades || []} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-muted-foreground">Win Rate</dt>
                    <dd className="text-xl font-medium">{dashboardData?.winRate.toFixed(1)}%</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Total Trades</dt>
                    <dd className="text-xl font-medium">{dashboardData?.tradeCount || 0}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">All-time P/L</dt>
                    <dd className={`text-xl font-medium ${dashboardData?.totalProfit >= 0 ? "text-chart-2" : "text-destructive"}`}>
                      ${dashboardData?.totalProfit.toFixed(2) || '0.00'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Exchange Rate</dt>
                    <dd className="text-xl font-medium">{dashboardData?.capital?.exchangeRate.toFixed(2) || 'N/A'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="trades" className="space-y-4">
          <RecentTrades trades={dashboardData?.recentTrades || []} />
        </TabsContent>
      </Tabs>

      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around py-3">
        <motion.a
          href="/dashboard"
          className="flex flex-col items-center"
          whileTap={{ scale: 0.95 }}
        >
          <LineChart className={`h-5 w-5 ${activeTab === "overview" ? "text-primary" : "text-muted-foreground"}`} />
          <span className="text-xs mt-1">Dashboard</span>
        </motion.a>
        
        <motion.a
          href="/add-trade"
          className="flex flex-col items-center"
          whileTap={{ scale: 0.95 }}
        >
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs mt-1">Add Trade</span>
        </motion.a>
        
        <motion.a
          href="/reports"
          className="flex flex-col items-center"
          whileTap={{ scale: 0.95 }}
        >
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs mt-1">Reports</span>
        </motion.a>
      </nav>
    </div>
  );
}