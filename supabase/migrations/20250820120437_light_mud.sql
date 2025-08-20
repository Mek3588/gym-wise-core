/*
  # Add Chapa payment integration fields

  1. Updates to payments table
    - Add chapa_tx_ref column for Chapa transaction reference
    - Add payment_gateway column to distinguish between payment methods
    - Add webhook_data column for storing Chapa webhook responses
    - Update payment_method to include 'chapa' option

  2. Indexes
    - Add index on chapa_tx_ref for faster lookups
    - Add index on payment_gateway for filtering

  3. Security
    - Maintain existing RLS policies
*/

-- Add new columns to payments table
DO $$
BEGIN
  -- Add chapa_tx_ref column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'chapa_tx_ref'
  ) THEN
    ALTER TABLE payments ADD COLUMN chapa_tx_ref text;
  END IF;

  -- Add payment_gateway column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'payment_gateway'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_gateway text DEFAULT 'manual';
  END IF;

  -- Add webhook_data column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'webhook_data'
  ) THEN
    ALTER TABLE payments ADD COLUMN webhook_data jsonb;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_chapa_tx_ref ON payments(chapa_tx_ref);
CREATE INDEX IF NOT EXISTS idx_payments_gateway ON payments(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_payments_status_gateway ON payments(status, payment_gateway);

-- Add constraint for payment_gateway values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payments_gateway_check'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_gateway_check 
    CHECK (payment_gateway IN ('manual', 'chapa', 'bank_transfer', 'cash', 'mobile_money'));
  END IF;
END $$;

-- Update existing records to have default gateway
UPDATE payments 
SET payment_gateway = 'manual' 
WHERE payment_gateway IS NULL;

-- Make payment_gateway NOT NULL
ALTER TABLE payments ALTER COLUMN payment_gateway SET NOT NULL;