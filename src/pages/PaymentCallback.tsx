import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import { chapaService } from "@/services/chapaService";
import { useToast } from "@/hooks/use-toast";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [paymentData, setPaymentData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const tx_ref = searchParams.get('tx_ref');
    const status = searchParams.get('status');

    if (tx_ref) {
      verifyPayment(tx_ref);
    } else {
      setVerificationStatus('failed');
      toast({
        title: "Invalid Payment",
        description: "No transaction reference found",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  const verifyPayment = async (tx_ref: string) => {
    try {
      const result = await chapaService.verifyPayment(tx_ref);

      if (result.success) {
        setVerificationStatus(result.status === 'success' ? 'success' : 'failed');
        setPaymentData(result.data);
        
        if (result.status === 'success') {
          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully",
          });
        } else {
          toast({
            title: "Payment Failed",
            description: "Payment was not completed successfully",
            variant: "destructive",
          });
        }
      } else {
        setVerificationStatus('failed');
        toast({
          title: "Verification Failed",
          description: result.error || "Could not verify payment status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setVerificationStatus('failed');
      toast({
        title: "Error",
        description: "An error occurred while verifying payment",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'loading':
        return <Loader2 className="w-16 h-16 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (verificationStatus) {
      case 'loading':
        return {
          title: "Verifying Payment",
          description: "Please wait while we confirm your payment with Chapa..."
        };
      case 'success':
        return {
          title: "Payment Successful!",
          description: "Your payment has been processed and confirmed."
        };
      case 'failed':
        return {
          title: "Payment Failed",
          description: "Your payment could not be processed. Please try again."
        };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl">{statusMessage.title}</CardTitle>
          <CardDescription className="text-base">
            {statusMessage.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentData && verificationStatus === 'success' && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Payment Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="font-mono">{paymentData.tx_ref}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">{chapaService.formatETB(paymentData.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {paymentData.status}
                  </Badge>
                </div>
                {paymentData.reference && (
                  <div className="flex justify-between">
                    <span>Reference:</span>
                    <span className="font-mono text-xs">{paymentData.reference}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => navigate('/payments')} 
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Payments
            </Button>
            
            {verificationStatus === 'failed' && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/payments')}
                className="w-full"
              >
                Try Again
              </Button>
            )}
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Powered by <span className="font-medium">Chapa</span> - Ethiopia's trusted payment platform
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}