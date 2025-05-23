"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTelegramWebApp } from "@/hooks/use-telegram-webapp";
import { CheckCircle2, ArrowRight, LineChart, DollarSign, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const { isReady, user } = useTelegramWebApp();

  useEffect(() => {
    if (isReady && user) {
      router.push("/dashboard");
    }
  }, [isReady, user, router]);

  const features = [
    { icon: LineChart, text: "Track daily profits and losses" },
    { icon: DollarSign, text: "Monitor trading capital in real-time" },
    { icon: Calendar, text: "View detailed monthly reports" }
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-sm bg-card/95">
          <CardContent className="p-6 space-y-8">
            <motion.div 
              className="flex justify-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <LineChart className="h-12 w-12 text-primary" />
              </div>
            </motion.div>

            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">TradeTrack</h1>
              <p className="text-muted-foreground">
                Your personal trading companion for managing capital and monitoring performance
              </p>
            </div>

            <div className="space-y-4">
              {features.map((Feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/50"
                >
                  <Feature.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm">{Feature.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
            >
              <Button
                className="w-full"
                size="lg"
                onClick={() => router.push("/dashboard")}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}