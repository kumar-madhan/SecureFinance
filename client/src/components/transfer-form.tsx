import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Account } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface TransferFormProps {
  accounts: Account[];
  initialFromAccount?: string | null;
  onTransferComplete?: () => void;
}

const transferSchema = z.object({
  fromAccountId: z.string().min(1, "Please select an account"),
  toAccountId: z.string().min(1, "Please select an account"),
  amount: z.string()
    .min(1, "Amount is required")
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  memo: z.string().optional(),
});

type TransferFormValues = z.infer<typeof transferSchema>;

export function TransferForm({ accounts, initialFromAccount, onTransferComplete }: TransferFormProps) {
  const { toast } = useToast();
  const [selectedFromAccountId, setSelectedFromAccountId] = useState<string>(initialFromAccount || "");
  
  // Form definition
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountId: initialFromAccount || "",
      toAccountId: "",
      amount: "",
      memo: "",
    },
  });
  
  // Set the fromAccountId in the form when initialFromAccount changes
  useEffect(() => {
    if (initialFromAccount) {
      form.setValue("fromAccountId", initialFromAccount);
      setSelectedFromAccountId(initialFromAccount);
    }
  }, [initialFromAccount, form]);
  
  // Format account number to show only last 4 digits
  const formatAccountNumber = (accountNumber: string) => {
    return `••••${accountNumber.slice(-4)}`;
  };

  // Format currency amount
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };
  
  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (data: TransferFormValues) => {
      const transferData = {
        fromAccountId: parseInt(data.fromAccountId),
        toAccountId: parseInt(data.toAccountId),
        amount: data.amount,
        memo: data.memo,
      };
      const res = await apiRequest("POST", "/api/transfers", transferData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transfer successful",
        description: "Your money has been transferred successfully",
      });
      // Invalidate queries to refresh account balances and transactions
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers"] });
      
      // Reset form
      form.reset();
      
      // Call callback if provided
      if (onTransferComplete) {
        onTransferComplete();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Transfer failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: TransferFormValues) => {
    // Validate that accounts are different
    if (data.fromAccountId === data.toAccountId) {
      toast({
        title: "Invalid transfer",
        description: "You cannot transfer money to the same account",
        variant: "destructive",
      });
      return;
    }
    
    transferMutation.mutate(data);
  };

  // Get the selected account
  const getSelectedAccount = (id: string) => {
    return accounts.find(account => account.id.toString() === id);
  };
  
  // Handle from account change
  const handleFromAccountChange = (value: string) => {
    setSelectedFromAccountId(value);
    form.setValue("fromAccountId", value);
  };
  
  // Filter the destination accounts to exclude the selected source account
  const getDestinationAccounts = () => {
    return accounts.filter(account => account.id.toString() !== selectedFromAccountId);
  };

  return (
    <Card className="bg-white rounded-xl shadow-lg">
      <CardHeader className="px-6 py-4 border-b border-neutral-200">
        <CardTitle className="text-lg font-medium text-neutral-800">Make a Transfer</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fromAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Account</FormLabel>
                    <Select 
                      onValueChange={handleFromAccountChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} ({formatAccountNumber(account.accountNumber)}) - {formatCurrency(account.balance)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="toAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Account</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedFromAccountId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedFromAccountId ? "Select account" : "First select from account"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getDestinationAccounts().map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} ({formatAccountNumber(account.accountNumber)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <div className="relative rounded-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-neutral-500 sm:text-sm">$</span>
                    </div>
                    <FormControl>
                      <Input className="pl-7" placeholder="0.00" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memo (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="What's this transfer for?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={transferMutation.isPending}
              >
                {transferMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : "Transfer Money"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
