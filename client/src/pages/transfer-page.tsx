import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { TransferForm } from "@/components/transfer-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Account } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TransferPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Parse query parameters to get the from account id
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const fromAccountId = searchParams.get('fromAccount');

  // Fetch user accounts
  const { 
    data: accounts = [], 
    isLoading: isLoadingAccounts 
  } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header />
      
      <main className="flex-grow px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-neutral-800">Transfer Money</h1>
          <p className="text-neutral-600">Move money between your accounts or send to someone else</p>
        </div>
        
        <div className="mb-8">
          {isLoadingAccounts ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No accounts found</h3>
              <p className="text-neutral-600 mb-4">You need at least one account to make transfers.</p>
            </div>
          ) : (
            <TransferForm 
              accounts={accounts}
              initialFromAccount={fromAccountId}
              onTransferComplete={() => {
                // No need to hide the form on the dedicated transfer page
              }}
            />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}