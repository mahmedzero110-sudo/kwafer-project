-- Add subscription fields to salons table
ALTER TABLE salons 
ADD COLUMN IF NOT EXISTS subscription_start DATE,
ADD COLUMN IF NOT EXISTS subscription_end DATE,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial', -- trial, active, expired
ADD COLUMN IF NOT EXISTS bonus_days INTEGER DEFAULT 0;

-- Update existing salons with trial period (7 days from creation)
UPDATE salons 
SET 
    subscription_start = created_at::date,
    subscription_end = (created_at::date + INTERVAL '7 days')::date,
    subscription_status = 'trial'
WHERE subscription_start IS NULL;
