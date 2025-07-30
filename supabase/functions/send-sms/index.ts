import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  campaignId?: string;
  recipients: Array<{
    id: string;
    phone: string;
    firstName: string;
    lastName: string;
  }>;
  message: string;
  type: 'payment_reminder' | 'marketing' | 'announcement' | 'manual';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error('Missing Twilio credentials');
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const { campaignId, recipients, message, type }: SMSRequest = await req.json();

    console.log(`Processing SMS request for ${recipients.length} recipients`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create authorization header for Twilio
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    let successCount = 0;
    let failedCount = 0;
    const smsLogs = [];

    // Send SMS to each recipient
    for (const recipient of recipients) {
      try {
        // Personalize message
        const personalizedMessage = message
          .replace(/\{firstName\}/g, recipient.firstName)
          .replace(/\{lastName\}/g, recipient.lastName)
          .replace(/\{fullName\}/g, `${recipient.firstName} ${recipient.lastName}`);

        // Send SMS via Twilio
        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: TWILIO_PHONE_NUMBER,
              To: recipient.phone,
              Body: personalizedMessage,
            }),
          }
        );

        const twilioData = await twilioResponse.json();

        if (twilioResponse.ok) {
          successCount++;
          smsLogs.push({
            campaign_id: campaignId,
            recipient_id: recipient.id,
            phone_number: recipient.phone,
            message: personalizedMessage,
            status: 'sent',
            twilio_sid: twilioData.sid,
            sent_at: new Date().toISOString(),
          });
        } else {
          failedCount++;
          smsLogs.push({
            campaign_id: campaignId,
            recipient_id: recipient.id,
            phone_number: recipient.phone,
            message: personalizedMessage,
            status: 'failed',
            error_message: twilioData.message || 'Unknown error',
          });
        }
      } catch (error) {
        console.error(`Failed to send SMS to ${recipient.phone}:`, error);
        failedCount++;
        smsLogs.push({
          campaign_id: campaignId,
          recipient_id: recipient.id,
          phone_number: recipient.phone,
          message: message,
          status: 'failed',
          error_message: error.message,
        });
      }
    }

    // Save SMS logs to database
    if (smsLogs.length > 0) {
      const { error: logsError } = await supabase
        .from('sms_logs')
        .insert(smsLogs);

      if (logsError) {
        console.error('Error saving SMS logs:', logsError);
      }
    }

    // Update campaign statistics if campaignId is provided
    if (campaignId) {
      const { error: campaignError } = await supabase
        .from('sms_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          recipient_count: recipients.length,
          success_count: successCount,
          failed_count: failedCount,
        })
        .eq('id', campaignId);

      if (campaignError) {
        console.error('Error updating campaign:', campaignError);
      }
    }

    console.log(`SMS sending completed: ${successCount} successful, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `SMS sent successfully to ${successCount} recipients`,
        stats: {
          total: recipients.length,
          successful: successCount,
          failed: failedCount,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in send-sms function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);