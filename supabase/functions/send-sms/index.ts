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
    // Twilio credentials (set in Supabase Secrets)
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_FROM_NUMBER = Deno.env.get('TWILIO_FROM_NUMBER'); // optional if using Messaging Service
    const TWILIO_MESSAGING_SERVICE_SID = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID'); // optional alternative to FROM

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || (!TWILIO_FROM_NUMBER && !TWILIO_MESSAGING_SERVICE_SID)) {
      console.error('Missing Twilio credentials');
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured. Provide ACCOUNT_SID, AUTH_TOKEN and either FROM number or MESSAGING_SERVICE_SID.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { campaignId, recipients, message, type }: SMSRequest = await req.json();

    if (!recipients?.length || !message) {
      return new Response(
        JSON.stringify({ error: 'Recipients and message are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`Processing SMS request (Twilio) for ${recipients.length} recipients`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const authHeader = 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    let successCount = 0;
    let failedCount = 0;
    const smsLogs: any[] = [];

    for (const recipient of recipients) {
      try {
        // Personalize message
        const personalizedMessage = message
          .replace(/\{firstName\}/g, recipient.firstName)
          .replace(/\{lastName\}/g, recipient.lastName)
          .replace(/\{fullName\}/g, `${recipient.firstName} ${recipient.lastName}`);

        const params = new URLSearchParams();
        params.set('To', recipient.phone);
        params.set('Body', personalizedMessage);
        if (TWILIO_MESSAGING_SERVICE_SID) {
          params.set('MessagingServiceSid', TWILIO_MESSAGING_SERVICE_SID);
        } else if (TWILIO_FROM_NUMBER) {
          params.set('From', TWILIO_FROM_NUMBER);
        }

        const twilioResp = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
          body: params.toString(),
        });

        const twilioData = await twilioResp.json();

        if (twilioResp.ok && twilioData?.sid) {
          successCount++;
          smsLogs.push({
            campaign_id: campaignId,
            recipient_id: recipient.id,
            phone_number: recipient.phone,
            message: personalizedMessage,
            status: 'sent',
            twilio_sid: twilioData.sid,
            sent_at: new Date().toISOString(),
            type,
          });
        } else {
          failedCount++;
          smsLogs.push({
            campaign_id: campaignId,
            recipient_id: recipient.id,
            phone_number: recipient.phone,
            message: personalizedMessage,
            status: 'failed',
            error_message: twilioData?.message || JSON.stringify(twilioData),
            type,
          });
        }
      } catch (error: any) {
        console.error(`Failed to send SMS to ${recipient.phone}:`, error);
        failedCount++;
        smsLogs.push({
          campaign_id: campaignId,
          recipient_id: recipient.id,
          phone_number: recipient.phone,
          message,
          status: 'failed',
          error_message: error.message,
          type,
        });
      }
    }

    // Save SMS logs to database
    if (smsLogs.length > 0) {
      const { error: logsError } = await supabase.from('sms_logs').insert(smsLogs as any[]);
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

    console.log(`SMS sending completed (Twilio): ${successCount} successful, ${failedCount} failed`);

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
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('Error in send-sms (Twilio) function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
