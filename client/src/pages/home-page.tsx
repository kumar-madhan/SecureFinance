import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { AccountCard } from "@/components/account-card";
import { QuickActions } from "@/components/quick-actions";
import { TransactionHistory } from "@/components/transaction-history";
import { TransferForm } from "@/components/transfer-form";
import { Footer } from "@/components/footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Account, Transaction } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  // Fetch user accounts
  const { 
    data: accounts = [], 
    isLoading: isLoadingAccounts 
  } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  // Fetch user transactions
  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions 
  } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Handle view account details
  const handleViewAccountDetails = (accountId: number) => {
    // Could navigate to account details page
    console.log(`View details for account ${accountId}`);
  };

  // Handle transfer from specific account
  const handleTransferFromAccount = (accountId: number) => {
    setSelectedAccountId(accountId);
    setShowTransferForm(true);
    // Scroll to the transfer form
    setTimeout(() => {
      const transferForm = document.getElementById('transfer-form');
      if (transferForm) {
        transferForm.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Handle quick action buttons
  const handleTransfer = () => {
    setSelectedAccountId(null);
    setShowTransferForm(true);
    // Scroll to the transfer form
    setTimeout(() => {
      const transferForm = document.getElementById('transfer-form');
      if (transferForm) {
        transferForm.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handlePayBills = () => {
    console.log('Pay bills clicked');
  };

  const handleDeposit = () => {
    console.log('Deposit clicked');
  };

  const handleViewStatements = () => {
    console.log('View statements clicked');
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header />
      
      <main className="flex-grow px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">Welcome, {user?.firstName}!</h1>
          <p className="text-neutral-600">Here's your financial overview</p>
        </div>
        
        {/* Account Summary */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {isLoadingAccounts ? (
            // Loading state with skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Skeleton className="h-6 w-36 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <Skeleton className="h-8 w-28 mb-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))
          ) : (
            accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onViewDetails={handleViewAccountDetails}
                onTransfer={handleTransferFromAccount}
              />
            ))
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions
            onTransfer={handleTransfer}
            onPayBills={handlePayBills}
            onDeposit={handleDeposit}
            onViewStatements={handleViewStatements}
          />
        </div>
        
        {/* Transaction History */}
        <div className="mb-8">
          {isLoadingTransactions ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <Skeleton className="h-7 w-48 mb-6" />
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <TransactionHistory 
              transactions={transactions.slice(0, 5)} 
              accounts={accounts}
              onViewAll={() => console.log('View all transactions')}
            />
          )}
        </div>
        
        {/* Transfer Form - conditionally rendered */}
        {showTransferForm && (
          <div id="transfer-form" className="mb-8">
            {isLoadingAccounts ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <TransferForm 
                accounts={accounts}
                onTransferComplete={() => setShowTransferForm(false)}
              />
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
