-- Create SMS campaigns table
CREATE TABLE public.sms_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('payment_reminder', 'marketing', 'announcement', 'manual')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipient_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SMS logs table for individual messages
CREATE TABLE public.sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.sms_campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  twilio_sid TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for SMS campaigns
CREATE POLICY "SMS campaigns are viewable by everyone" 
ON public.sms_campaigns 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create SMS campaigns" 
ON public.sms_campaigns 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own SMS campaigns" 
ON public.sms_campaigns 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own SMS campaigns" 
ON public.sms_campaigns 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create policies for SMS logs
CREATE POLICY "SMS logs are viewable by everyone" 
ON public.sms_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create SMS logs" 
ON public.sms_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update SMS logs" 
ON public.sms_logs 
FOR UPDATE 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_sms_campaigns_updated_at
BEFORE UPDATE ON public.sms_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add phone_number to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'phone_number') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;
    END IF;
END $$;