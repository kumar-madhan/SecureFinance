import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Account } from "@shared/schema";
import { Building, CreditCard, PiggyBank } from "lucide-react";

interface AccountCardProps {
  account: Account;
  onViewDetails: (id: number) => void;
  onTransfer: (id: number) => void;
}

export function AccountCard({ account, onViewDetails, onTransfer }: AccountCardProps) {
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

  // Get appropriate icon based on account type
  const getAccountIcon = () => {
    switch (account.accountType) {
      case 'checking':
        return <Building className="h-6 w-6 text-primary" />;
      case 'savings':
        return <PiggyBank className="h-6 w-6 text-secondary" />;
      case 'credit':
        return <CreditCard className="h-6 w-6 text-accent" />;
      default:
        return <Building className="h-6 w-6 text-primary" />;
    }
  };

  // Format account type for display
  const formatAccountType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1) + ' Account';
  };

  return (
    <Card className="bg-white rounded-xl shadow hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-medium text-neutral-800">
              {formatAccountType(account.accountType)}
            </h2>
            <p className="text-xs font-mono text-neutral-500">
              {formatAccountNumber(account.accountNumber)}
            </p>
          </div>
          {getAccountIcon()}
        </div>
        
        <div className="mb-2">
          <span className="text-2xl font-bold font-mono">
            {formatCurrency(account.balance)}
          </span>
          {account.accountType === 'credit' && account.creditLimit && (
            <span className="text-xs text-neutral-500 ml-2">
              of {formatCurrency(account.creditLimit)} limit
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <Button 
            variant="link" 
            className="text-sm text-primary p-0"
            onClick={() => onViewDetails(account.id)}
          >
            View details
          </Button>
          <Button 
            size="sm" 
            onClick={() => onTransfer(account.id)}
          >
            {account.accountType === 'credit' ? 'Pay' : 'Transfer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
