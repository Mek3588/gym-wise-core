import { supabase } from "@/integrations/supabase/client";

export interface ChapaPaymentData {
  amount: number;
  currency?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  description?: string;
  user_id: string;
  due_date?: string;
}

export interface ChapaPaymentResponse {
  success: boolean;
  checkout_url?: string;
  tx_ref?: string;
  error?: string;
}

export interface ChapaVerificationResponse {
  success: boolean;
  status?: string;
  data?: any;
  error?: string;
}

class ChapaService {
  private baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chapa-payment`;

  private getHeaders() {
    return {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  private generateTxRef(): string {
    return `fittracker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async initializePayment(paymentData: ChapaPaymentData): Promise<ChapaPaymentResponse> {
    try {
      const tx_ref = this.generateTxRef();
      const callback_url = `${window.location.origin}/payments/callback`;
      const return_url = `${window.location.origin}/payments/success`;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          action: 'initialize',
          ...paymentData,
          tx_ref,
          callback_url,
          return_url,
          currency: paymentData.currency || 'ETB',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment initialization failed');
      }

      return result;
    } catch (error) {
      console.error('Error initializing Chapa payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initialization failed',
      };
    }
  }

  async verifyPayment(tx_ref: string): Promise<ChapaVerificationResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          action: 'verify',
          tx_ref,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment verification failed');
      }

      return result;
    } catch (error) {
      console.error('Error verifying Chapa payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment verification failed',
      };
    }
  }

  async handleWebhook(webhookData: any): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          action: 'webhook',
          ...webhookData,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error handling Chapa webhook:', error);
      return false;
    }
  }

  // Helper method to open Chapa checkout
  openCheckout(checkoutUrl: string): void {
    window.open(checkoutUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
  }

  // Helper method to format Ethiopian Birr
  formatETB(amount: number): string {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount);
  }
}

export const chapaService = new ChapaService();