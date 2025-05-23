"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, DollarSign, ArrowUpDown as ArrowsUpDown } from "lucide-react";
import { motion } from "framer-motion";
import { useTelegramWebApp } from "@/hooks/use-telegram-webapp";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  amountBirr: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount in Birr must be a positive number",
  }),
  amountUsd: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount in USD must be a positive number",
  }),
  exchangeRate: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Exchange rate must be a positive number",
  }),
});

export default function CapitalPage() {
  const router = useRouter();
  const { isReady, user: telegramUser, backButton } = useTelegramWebApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capital, setCapital] = useState<any>(null);
  
  // Configure the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amountBirr: "",
      amountUsd: "",
      exchangeRate: "",
    },
  });
  
  // Handle exchange rate calculation
  const handleBirrChange = (value: string) => {
    const birrAmount = parseFloat(value);
    const exchangeRate = parseFloat(form.getValues("exchangeRate"));
    
    if (!isNaN(birrAmount) && !isNaN(exchangeRate) && exchangeRate > 0) {
      const usdAmount = birrAmount / exchangeRate;
      form.setValue("amountUsd", usdAmount.toFixed(2));
    }
  };
  
  const handleUsdChange = (value: string) => {
    const usdAmount = parseFloat(value);
    const exchangeRate = parseFloat(form.getValues("exchangeRate"));
    
    if (!isNaN(usdAmount) && !isNaN(exchangeRate) && exchangeRate > 0) {
      const birrAmount = usdAmount * exchangeRate;
      form.setValue("amountBirr", birrAmount.toFixed(2));
    }
  };
  
  const handleExchangeRateChange = (value: string) => {
    const exchangeRate = parseFloat(value);
    const birrAmount = parseFloat(form.getValues("amountBirr"));
    
    if (!isNaN(exchangeRate) && !isNaN(birrAmount) && exchangeRate > 0) {
      const usdAmount = birrAmount / exchangeRate;
      form.setValue("amountUsd", usdAmount.toFixed(2));
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isReady || !telegramUser) {
      toast({
        title: "Error",
        description: "You must be logged in via Telegram to update capital",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Convert string values to numbers
    const numericValues = {
      amountBirr: parseFloat(values.amountBirr),
      amountUsd: parseFloat(values.amountUsd),
      exchangeRate: parseFloat(values.exchangeRate),
    };
    
    // Make the API request
    fetch("/api/capital", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": window.Telegram.WebApp.initData,
      },
      body: JSON.stringify(numericValues),
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to update capital");
        return res.json();
      })
      .then(data => {
        setCapital(data.capital);
        toast({
          title: "Capital updated",
          description: "Capital information has been successfully updated",
        });
        router.push("/dashboard");
      })
      .catch(err => {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

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
        <h1 className="text-2xl font-bold">Update Capital</h1>
      </header>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Capital Information</CardTitle>
            <CardDescription>
              Update the current trading capital and exchange rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="amountBirr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (Birr)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            ETB
                          </span>
                          <Input
                            placeholder="0.00"
                            {...field}
                            className="pl-10"
                            onChange={(e) => {
                              field.onChange(e);
                              handleBirrChange(e.target.value);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-center">
                  <div className="bg-muted rounded-full p-2">
                    <ArrowsUpDown className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="exchangeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exchange Rate (Birr per USD)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleExchangeRateChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Current exchange rate from USD to Birr
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amountUsd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (USD)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            placeholder="0.00"
                            {...field}
                            className="pl-8"
                            onChange={(e) => {
                              field.onChange(e);
                              handleUsdChange(e.target.value);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Updating...</span>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        ⟳
                      </motion.span>
                    </>
                  ) : (
                    "Update Capital"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}