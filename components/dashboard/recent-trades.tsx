"use client";

import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { motion } from "framer-motion";

interface Trade {
  id: string;
  amount: number;
  note?: string;
  date: string;
}

interface RecentTradesProps {
  trades: Trade[];
}

export default function RecentTrades({ trades }: RecentTradesProps) {
  if (!trades || trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>You haven't made any trades yet</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <p className="text-center text-muted-foreground">
            Start adding trades to see them here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
        <CardDescription>Your most recent trading activity</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade, index) => (
              <motion.tr
                key={trade.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border-b"
              >
                <TableCell className="py-3">
                  {format(new Date(trade.date), "MMM dd")}
                </TableCell>
                <TableCell
                  className={`font-medium ${
                    trade.amount >= 0 ? "text-chart-2" : "text-destructive"
                  }`}
                >
                  ${trade.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-muted-foreground truncate max-w-[120px]">
                  {trade.note || "-"}
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}