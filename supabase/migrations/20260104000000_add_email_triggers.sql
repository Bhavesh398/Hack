-- Create function to send email notification on status update
CREATE OR REPLACE FUNCTION notify_complaint_status_change()
RETURNS TRIGGER AS $$
DECLARE
  email_payload jsonb;
BEGIN
  -- Only send notification if status has changed and citizen_email exists
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.citizen_email IS NOT NULL) THEN
    -- Prepare payload for edge function
    email_payload := jsonb_build_object(
      'to', NEW.citizen_email,
      'complaintId', NEW.complaint_id,
      'status', NEW.status,
      'citizenName', NEW.citizen_name,
      'category', NEW.category,
      'assignedOfficer', NEW.assigned_officer
    );
    
    -- Invoke edge function to send email
    PERFORM
      net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/send-email-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
        ),
        body := email_payload
      );
  END IF;
  
  -- For new complaints, send confirmation email
  IF (TG_OP = 'INSERT' AND NEW.citizen_email IS NOT NULL) THEN
    email_payload := jsonb_build_object(
      'to', NEW.citizen_email,
      'complaintId', NEW.complaint_id,
      'status', NEW.status,
      'citizenName', NEW.citizen_name,
      'category', NEW.category
    );
    
    PERFORM
      net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/send-email-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
        ),
        body := email_payload
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for complaint status updates
DROP TRIGGER IF EXISTS on_complaint_status_change ON public.complaints;
CREATE TRIGGER on_complaint_status_change
  AFTER INSERT OR UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION notify_complaint_status_change();

-- Add comment
COMMENT ON FUNCTION notify_complaint_status_change() IS 'Sends email notification to citizen when complaint status changes';
