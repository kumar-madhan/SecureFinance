import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, CreditCard, Banknote, History } from "lucide-react";

interface QuickActionsProps {
  onTransfer: () => void;
  onPayBills: () => void;
  onDeposit: () => void;
  onViewStatements: () => void;
}

export function QuickActions({ onTransfer, onPayBills, onDeposit, onViewStatements }: QuickActionsProps) {
  return (
    <Card className="bg-white rounded-xl shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-neutral-800">Quick Actions</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="p-4 h-auto flex flex-col items-center justify-center space-y-2 border-neutral-200 hover:bg-neutral-50"
            onClick={onTransfer}
          >
            <Send className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm">Transfer Money</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="p-4 h-auto flex flex-col items-center justify-center space-y-2 border-neutral-200 hover:bg-neutral-50"
            onClick={onPayBills}
          >
            <CreditCard className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm">Pay Bills</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="p-4 h-auto flex flex-col items-center justify-center space-y-2 border-neutral-200 hover:bg-neutral-50"
            onClick={onDeposit}
          >
            <Banknote className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm">Deposit</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="p-4 h-auto flex flex-col items-center justify-center space-y-2 border-neutral-200 hover:bg-neutral-50"
            onClick={onViewStatements}
          >
            <History className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm">View Statements</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
