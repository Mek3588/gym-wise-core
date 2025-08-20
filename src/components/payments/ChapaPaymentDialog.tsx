import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { chapaService, type ChapaPaymentData } from "@/services/chapaService";
import { CreditCard, Loader2, ExternalLink, Shield } from "lucide-react";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  phone_number?: string;
}

interface ChapaPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onPaymentSuccess: () => void;
}

export function ChapaPaymentDialog({ isOpen, onClose, employees, onPaymentSuccess }: ChapaPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    amount: "",
    description: "",
    due_date: "",
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      user_id: "",
      amount: "",
      description: "",
      due_date: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_id || !formData.amount) {
      toast({
        title: "Missing Information",
        description: "Please select an employee and enter an amount",
        variant: "destructive",
      });
      return;
    }

    const selectedEmployee = employees.find(emp => emp.id === formData.user_id);
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Selected employee not found",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const paymentData: ChapaPaymentData = {
        amount: parseFloat(formData.amount),
        currency: 'ETB',
        email: selectedEmployee.email,
        first_name: selectedEmployee.first_name,
        last_name: selectedEmployee.last_name,
        phone_number: selectedEmployee.phone || selectedEmployee.phone_number,
        description: formData.description || `Payment for ${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
        user_id: formData.user_id,
        due_date: formData.due_date || undefined,
      };

      const result = await chapaService.initializePayment(paymentData);

      if (result.success && result.checkout_url) {
        toast({
          title: "Payment Initialized",
          description: "Redirecting to Chapa payment page...",
        });

        // Open Chapa checkout in new window
        chapaService.openCheckout(result.checkout_url);

        // Close dialog and refresh payments
        onClose();
        resetForm();
        onPaymentSuccess();
      } else {
        throw new Error(result.error || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedEmployee = employees.find(emp => emp.id === formData.user_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Chapa Payment
          </DialogTitle>
          <DialogDescription>
            Initialize a secure payment using Chapa - Ethiopia's leading payment platform
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Select Employee</Label>
            <Select 
              value={formData.user_id} 
              onValueChange={(value) => setFormData({...formData, user_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name} - {employee.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ETB)</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0.00"
                className="pl-12"
                required
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-muted-foreground">
                ETB
              </div>
            </div>
            {formData.amount && (
              <p className="text-sm text-muted-foreground">
                Amount: {chapaService.formatETB(parseFloat(formData.amount) || 0)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Payment description (e.g., Monthly membership fee)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date (Optional)</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({...formData, due_date: e.target.value})}
            />
          </div>

          {selectedEmployee && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Payment Details</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Recipient:</span> {selectedEmployee.first_name} {selectedEmployee.last_name}</p>
                <p><span className="font-medium">Email:</span> {selectedEmployee.email}</p>
                {(selectedEmployee.phone || selectedEmployee.phone_number) && (
                  <p><span className="font-medium">Phone:</span> {selectedEmployee.phone || selectedEmployee.phone_number}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Secured by Chapa
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Initializing Payment...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Pay with Chapa
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-medium">Chapa</span> - Secure Ethiopian Payment Gateway
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}