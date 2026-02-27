export const communicationsStatements = [
  `CREATE TABLE IF NOT EXISTS customer_communications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
    lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
    job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
    communication_type text NOT NULL,
    direction text NOT NULL,
    from_address text,
    to_address text,
    subject text,
    body text,
    transcript text,
    ai_summary text,
    ai_action_items jsonb,
    status text NOT NULL DEFAULT 'completed',
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT customer_comms_type_chk CHECK (communication_type IN ('phone_call','sms','email','web_form')),
    CONSTRAINT customer_comms_direction_chk CHECK (direction IN ('inbound','outbound')),
    CONSTRAINT customer_comms_status_chk CHECK (status IN ('pending','completed','failed'))
  );`,
];
