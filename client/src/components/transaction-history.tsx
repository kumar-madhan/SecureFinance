import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction, Account } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface TransactionHistoryProps {
  transactions: Transaction[];
  accounts: Account[];
  onViewAll?: () => void;
}

export function TransactionHistory({ transactions, accounts, onViewAll }: TransactionHistoryProps) {
  // Function to get account name by id
  const getAccountName = (id: number) => {
    const account = accounts.find(acc => acc.id === id);
    return account ? `${account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}` : 'Unknown';
  };

  // Format currency amount
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'auto',
    }).format(Number(amount));
  };

  // Format date relative to now
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Get badge color based on transaction category
  const getCategoryBadgeColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'income':
        return "bg-green-100 text-green-800";
      case 'transfer':
        return "bg-yellow-100 text-yellow-800";
      case 'groceries':
        return "bg-blue-100 text-blue-800";
      case 'entertainment':
        return "bg-purple-100 text-purple-800";
      case 'utilities':
        return "bg-orange-100 text-orange-800";
      case 'transportation':
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get text color based on amount (positive/negative)
  const getAmountColor = (amount: string | number) => {
    const numAmount = Number(amount);
    return numAmount < 0 ? "text-error" : "text-secondary";
  };

  return (
    <Card className="bg-white rounded-xl shadow-lg overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-neutral-200">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium text-neutral-800">Recent Transactions</CardTitle>
          {onViewAll && (
            <button 
              onClick={onViewAll}
              className="text-sm text-primary hover:underline"
            >
              View all
            </button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-neutral-50">
              <TableRow>
                <TableHead className="text-xs font-medium text-neutral-500 uppercase">Date</TableHead>
                <TableHead className="text-xs font-medium text-neutral-500 uppercase">Description</TableHead>
                <TableHead className="text-xs font-medium text-neutral-500 uppercase">Category</TableHead>
                <TableHead className="text-xs font-medium text-neutral-500 uppercase">Account</TableHead>
                <TableHead className="text-xs font-medium text-neutral-500 uppercase text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id} 
                    className="hover:bg-neutral-50"
                  >
                    <TableCell className="text-sm text-neutral-600">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell className="text-sm text-neutral-800 font-medium">
                      {transaction.description}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${getCategoryBadgeColor(transaction.category)}`}
                      >
                        {transaction.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-neutral-600">
                      {getAccountName(transaction.accountId)}
                    </TableCell>
                    <TableCell className={`text-sm text-right font-mono font-medium ${getAmountColor(transaction.amount)}`}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-neutral-500">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
