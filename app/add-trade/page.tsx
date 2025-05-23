"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useTelegramWebApp } from "@/hooks/use-telegram-webapp";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  amount: z.string().refine(val => !isNaN(parseFloat(val)), {
    message: "Amount must be a valid number",
  }),
  date: z.date({
    required_error: "Please select a date",
  }),
  note: z.string().optional(),
});

export default function AddTrade() {
  const router = useRouter();
  const { isReady, user: telegramUser, backButton } = useTelegramWebApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Configure the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      date: new Date(),
      note: "",
    },
  });
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isReady || !telegramUser) {
      toast({
        title: "Error",
        description: "You must be logged in via Telegram to add a trade",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Convert amount to number
    const numericAmount = parseFloat(values.amount);
    
    // Make the API request
    fetch("/api/trades", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
"X-Telegram-Init-Data": typeof window !== "undefined" ? window.Telegram?.WebApp?.initData || "" : "",

      },
      body: JSON.stringify({
        amount: numericAmount,
        date: values.date.toISOString(),
        note: values.note,
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to add trade");
        return res.json();
      })
      .then(data => {
        toast({
          title: "Trade added",
          description: "Your trade has been successfully recorded",
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
        <h1 className="text-2xl font-bold">Add Trade</h1>
      </header>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>New Trade Entry</CardTitle>
            <CardDescription>
              Record your daily trading profit or loss
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="amount"
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
                            type="number"
                            step="0.01"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter a positive value for profit or negative for loss
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("2000-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add details about this trade..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Saving...</span>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        ⟳
                      </motion.span>
                    </>
                  ) : (
                    "Save Trade"
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