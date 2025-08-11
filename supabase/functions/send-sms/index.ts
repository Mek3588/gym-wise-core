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
    const AFRO_API_KEY = Deno.env.get('AFROMESSAGE_API_KEY');
    const AFRO_IDENTIFIER_ID = Deno.env.get('AFROMESSAGE_IDENTIFIER_ID');
    const AFRO_SENDER_NAME = Deno.env.get('AFROMESSAGE_SENDER_NAME');
    const AFRO_BASE_URL = Deno.env.get('AFROMESSAGE_BASE_URL') || 'https://api.afromessage.com/v1/sms/send';

    if (!AFRO_API_KEY || !AFRO_IDENTIFIER_ID || !AFRO_SENDER_NAME) {
      console.error('Missing AfroMessage credentials');
      return new Response(
        JSON.stringify({ error: 'AfroMessage credentials not configured' }),
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
    const afroHeaders = {
      'Authorization': `Bearer ${AFRO_API_KEY}`,
      'Content-Type': 'application/json',
    };

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

        // Send SMS via AfroMessage
        const afroResponse = await fetch(AFRO_BASE_URL, {
          method: 'POST',
          headers: afroHeaders,
          body: JSON.stringify({
            identifier: AFRO_IDENTIFIER_ID,
            sender: AFRO_SENDER_NAME,
            to: recipient.phone,
            message: personalizedMessage,
          }),
        });

        const afroData = await afroResponse.json();

        if (afroResponse.ok && (afroData?.success === true || afroData?.status === 'success' || afroData?.code === 200)) {
          successCount++;
          smsLogs.push({
            campaign_id: campaignId,
            recipient_id: recipient.id,
            phone_number: recipient.phone,
            message: personalizedMessage,
            status: 'sent',
            twilio_sid: afroData?.id || afroData?.messageId || afroData?.data?.id || null,
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
            error_message: afroData?.message || afroData?.error || JSON.stringify(afroData),
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