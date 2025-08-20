import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ChapaPaymentRequest {
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  description?: string;
  customization?: {
    title?: string;
    description?: string;
  };
}

interface ChapaResponse {
  message: string;
  status: string;
  data?: {
    checkout_url: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CHAPA_SECRET_KEY = Deno.env.get('CHAPA_SECRET_KEY');
    
    if (!CHAPA_SECRET_KEY) {
      console.error('Missing Chapa secret key');
      return new Response(
        JSON.stringify({ error: 'Chapa credentials not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const body = await req.json();
    const { action, ...paymentData } = body;

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (action === 'initialize') {
      // Initialize payment with Chapa
      const chapaPayload: ChapaPaymentRequest = {
        amount: paymentData.amount,
        currency: paymentData.currency || 'ETB',
        email: paymentData.email,
        first_name: paymentData.first_name,
        last_name: paymentData.last_name,
        phone_number: paymentData.phone_number,
        tx_ref: paymentData.tx_ref,
        callback_url: paymentData.callback_url,
        return_url: paymentData.return_url,
        description: paymentData.description,
        customization: {
          title: 'FitTracker Payment',
          description: paymentData.description || 'Gym membership payment',
        },
      };

      const chapaResponse = await fetch('https://api.chapa.co/v1/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chapaPayload),
      });

      const chapaData: ChapaResponse = await chapaResponse.json();

      if (chapaResponse.ok && chapaData.status === 'success') {
        // Create payment record in database
        const { error: dbError } = await supabase
          .from('payments')
          .insert({
            user_id: paymentData.user_id,
            amount: paymentData.amount,
            payment_method: 'chapa',
            transaction_id: paymentData.tx_ref,
            status: 'pending',
            description: paymentData.description,
            due_date: paymentData.due_date,
          });

        if (dbError) {
          console.error('Error creating payment record:', dbError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            checkout_url: chapaData.data?.checkout_url,
            tx_ref: paymentData.tx_ref,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: chapaData.message || 'Payment initialization failed' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    } else if (action === 'verify') {
      // Verify payment with Chapa
      const { tx_ref } = paymentData;

      const verifyResponse = await fetch(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
        },
      });

      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok && verifyData.status === 'success') {
        const paymentStatus = verifyData.data?.status;
        
        // Update payment record in database
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: paymentStatus === 'success' ? 'completed' : 'failed',
            payment_date: paymentStatus === 'success' ? new Date().toISOString() : null,
          })
          .eq('transaction_id', tx_ref);

        if (updateError) {
          console.error('Error updating payment record:', updateError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            status: paymentStatus,
            data: verifyData.data,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: 'Payment verification failed' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    } else if (action === 'webhook') {
      // Handle Chapa webhook
      const webhookData = paymentData;
      
      if (webhookData.event === 'charge.success') {
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            payment_date: new Date().toISOString(),
          })
          .eq('transaction_id', webhookData.data.tx_ref);

        if (updateError) {
          console.error('Error updating payment from webhook:', updateError);
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in chapa-payment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);