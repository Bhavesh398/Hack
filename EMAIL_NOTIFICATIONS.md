# Email Notification Setup

This guide explains how to set up email notifications for complaint status updates.

## Overview

The system automatically sends email notifications to citizens when:
- A complaint is successfully submitted (confirmation email)
- Complaint status changes (received → assigned → in_progress → resolved)

## Setup Instructions

### 1. Install Resend API

We use [Resend](https://resend.com) for email delivery. Sign up for a free account at https://resend.com

### 2. Configure Supabase Secrets

Add your Resend API key to Supabase:

```bash
# Using Supabase CLI
supabase secrets set RESEND_API_KEY=re_your_api_key_here
supabase secrets set SUPABASE_URL=your_supabase_project_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Or via Supabase Dashboard:
1. Go to Project Settings → Edge Functions
2. Add the secrets in the "Secrets" section

### 3. Deploy Edge Function

Deploy the email notification edge function:

```bash
supabase functions deploy send-email-notification
```

### 4. Apply Database Migration

Run the migration to create the email trigger:

```bash
supabase db push
```

Or apply the migration manually:

```sql
-- Run the contents of:
-- supabase/migrations/20260104000000_add_email_triggers.sql
```

### 5. Configure Sender Email

Update the sender email in the edge function:

Edit `supabase/functions/send-email-notification/index.ts`:

```typescript
from: "Grievance System <noreply@your-verified-domain.com>"
```

**Note:** You need to verify your domain in Resend to send emails from a custom domain.

## Email Templates

The system includes 4 email templates:

1. **Received** - Confirmation when complaint is filed
2. **Assigned** - When complaint is assigned to an officer
3. **In Progress** - When work begins on the complaint
4. **Resolved** - When complaint is successfully resolved

Each template includes:
- Complaint ID
- Category
- Current status
- Assigned officer (if applicable)

## Testing

### Manual Test

Test the email function manually:

```bash
curl -i --location --request POST 'https://your-project.supabase.co/functions/v1/send-email-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "to": "test@example.com",
    "complaintId": "TEST-001",
    "status": "received",
    "citizenName": "Test User",
    "category": "Sanitation"
  }'
```

### Integration Test

1. File a complaint with a valid email address
2. Check your inbox for the confirmation email
3. Update the complaint status in the dashboard
4. Verify you receive status update emails

## Troubleshooting

### Email Not Received

1. Check Supabase Edge Function logs:
   ```bash
   supabase functions logs send-email-notification
   ```

2. Verify secrets are set correctly:
   ```bash
   supabase secrets list
   ```

3. Check Resend dashboard for delivery status

### Trigger Not Firing

1. Verify the trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_complaint_status_change';
   ```

2. Check function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'notify_complaint_status_change';
   ```

### Common Issues

- **Domain not verified**: Verify your sender domain in Resend
- **API key invalid**: Double-check your RESEND_API_KEY secret
- **Rate limiting**: Free tier has 100 emails/day limit
- **Email in spam**: Configure SPF, DKIM, and DMARC records

## Alternative Email Providers

You can replace Resend with other providers:

- **SendGrid**: Replace API endpoint with SendGrid's
- **Mailgun**: Update headers and body format
- **AWS SES**: Use AWS SDK in edge function
- **Postmark**: Update API integration

## Code References

- Edge Function: `supabase/functions/send-email-notification/index.ts`
- Email Helpers: `src/lib/emailNotifications.ts`
- Database Trigger: `supabase/migrations/20260104000000_add_email_triggers.sql`
- Integration: `src/hooks/useComplaints.ts`

## Security Notes

- Never expose RESEND_API_KEY in client-side code
- Use service role key only in edge functions
- Enable RLS policies for complaint access
- Validate email addresses before sending
- Implement rate limiting to prevent abuse
