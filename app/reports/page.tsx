"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTelegramWebApp } from "@/hooks/use-telegram-webapp";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Trade {
  id: string;
  amount: number;
  note?: string;
  date: string;
}

export default function Reports() {
  const router = useRouter();
  const { isReady, user: telegramUser, backButton } = useTelegramWebApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "MM"));
  const [selectedYear, setSelectedYear] = useState(format(new Date(), "yyyy"));
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  // Fetch trades for the selected month and year
  useEffect(() => {
    if (!isReady || !telegramUser) return;
  
    // Ensure code runs only in the browser
    if (typeof window === "undefined") return;
  
    // Ensure Telegram WebApp is initialized
    let initData;
    if (typeof window !== "undefined") {
      initData = window.Telegram?.WebApp?.initData;
    }
    if (!initData) return;
    
  
    setIsLoading(true);
  
    fetch(`/api/trades?month=${selectedMonth}&year=${selectedYear}`, {
      headers: {
        "X-Telegram-Init-Data": initData,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch trades");
        return res.json();
      })
      .then(data => {
        setTrades(data.trades);
      })
      .catch(err => {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isReady, telegramUser, selectedMonth, selectedYear, toast]);
  
  // Calculate monthly totals
  const monthlyTotal = trades.reduce((sum, trade) => sum + trade.amount, 0);
  const profitableDays = trades.filter(trade => trade.amount > 0).length;
  const lossDays = trades.filter(trade => trade.amount < 0).length;
  
  // Setup back button
  backButton.show(() => router.push("/dashboard"));

  return (
    <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
      <header className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Monthly Reports</h1>
      </header>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Select Period</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="w-1/2">
              <Select
                value={selectedMonth}
                onValueChange={setSelectedMonth}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-1/2">
              <Select
                value={selectedYear}
                onValueChange={setSelectedYear}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <BarChart2 className="h-8 w-8 animate-pulse text-muted-foreground" />
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total P/L</p>
                    <p className={`text-lg font-bold ${monthlyTotal >= 0 ? "text-chart-2" : "text-destructive"}`}>
                      ${monthlyTotal.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Profit Days</p>
                    <p className="text-lg font-bold text-chart-2">{profitableDays}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Loss Days</p>
                    <p className="text-lg font-bold text-destructive">{lossDays}</p>
                  </div>
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
              <CardHeader>
                <CardTitle>Trade Details</CardTitle>
              </CardHeader>
              <CardContent>
                {trades.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.map(trade => (
                        <TableRow key={trade.id}>
                          <TableCell>
                            {format(new Date(trade.date), "MMM dd")}
                          </TableCell>
                          <TableCell className={trade.amount >= 0 ? "text-chart-2" : "text-destructive"}>
                            ${trade.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="max-w-[120px] truncate text-muted-foreground">
                            {trade.note || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">No trades found for this period</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
      
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around py-3">
        <motion.a
          href="/dashboard"
          className="flex flex-col items-center"
          whileTap={{ scale: 0.95 }}
        >
          <BarChart2 className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs mt-1">Dashboard</span>
        </motion.a>
        
        <motion.a
          href="/add-trade"
          className="flex flex-col items-center"
          whileTap={{ scale: 0.95 }}
        >
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs mt-1">Add Trade</span>
        </motion.a>
        
        <motion.a
          href="/reports"
          className="flex flex-col items-center"
          whileTap={{ scale: 0.95 }}
        >
          <CalendarIcon className="h-5 w-5 text-primary" />
          <span className="text-xs mt-1 text-primary">Reports</span>
        </motion.a>
      </nav>
    </div>
  );
}