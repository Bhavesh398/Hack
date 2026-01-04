import { supabase } from "@/integrations/supabase/client";

export interface EmailNotificationPayload {
  to: string;
  complaintId: string;
  status: string;
  citizenName: string;
  category: string;
  assignedOfficer?: string;
}

/**
 * Send email notification to user about complaint status update
 */
export async function sendComplaintNotification(payload: EmailNotificationPayload) {
  try {
    const { data, error } = await supabase.functions.invoke("send-email-notification", {
      body: payload,
    });

    if (error) {
      console.error("Error sending email notification:", error);
      throw error;
    }

    console.log("Email notification sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email notification:", error);
    return { success: false, error };
  }
}

/**
 * Send complaint confirmation email
 */
export async function sendComplaintConfirmation(
  email: string,
  complaintId: string,
  citizenName: string,
  category: string
) {
  return sendComplaintNotification({
    to: email,
    complaintId,
    status: "received",
    citizenName,
    category,
  });
}

/**
 * Send complaint status update email
 */
export async function sendStatusUpdateEmail(
  email: string,
  complaintId: string,
  citizenName: string,
  category: string,
  status: string,
  assignedOfficer?: string
) {
  return sendComplaintNotification({
    to: email,
    complaintId,
    status,
    citizenName,
    category,
    assignedOfficer,
  });
}
