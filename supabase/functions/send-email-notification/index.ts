import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface EmailRequest {
  to: string;
  complaintId: string;
  status: string;
  citizenName: string;
  category: string;
  assignedOfficer?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, complaintId, status, citizenName, category, assignedOfficer }: EmailRequest = await req.json();

    if (!to || !complaintId || !status) {
      throw new Error("Missing required fields: to, complaintId, status");
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set in function environment");
    }

    // Email subject and body based on status
    const getEmailContent = () => {
      switch (status) {
        case "received":
          return {
            subject: `Complaint ${complaintId} - Received Successfully`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Complaint Received</h2>
                <p>Dear ${citizenName},</p>
                <p>Your complaint has been successfully received and registered in our system.</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Complaint ID:</strong> ${complaintId}</p>
                  <p><strong>Category:</strong> ${category}</p>
                  <p><strong>Status:</strong> Received</p>
                </div>
                <p>We will review your complaint and assign it to the appropriate department soon.</p>
                <p>You can track your complaint status using the complaint ID provided above.</p>
                <p>Thank you for your patience.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
              </div>
            `,
          };
        case "assigned":
          return {
            subject: `Complaint ${complaintId} - Assigned to Officer`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Complaint Assigned</h2>
                <p>Dear ${citizenName},</p>
                <p>Your complaint has been assigned to an officer for investigation.</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Complaint ID:</strong> ${complaintId}</p>
                  <p><strong>Category:</strong> ${category}</p>
                  <p><strong>Status:</strong> Assigned</p>
                  ${assignedOfficer ? `<p><strong>Assigned Officer:</strong> ${assignedOfficer}</p>` : ""}
                </div>
                <p>The assigned officer will review your complaint and take necessary actions.</p>
                <p>Thank you for your patience.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
              </div>
            `,
          };
        case "in_progress":
          return {
            subject: `Complaint ${complaintId} - In Progress`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f59e0b;">Complaint In Progress</h2>
                <p>Dear ${citizenName},</p>
                <p>We are currently working on resolving your complaint.</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Complaint ID:</strong> ${complaintId}</p>
                  <p><strong>Category:</strong> ${category}</p>
                  <p><strong>Status:</strong> In Progress</p>
                  ${assignedOfficer ? `<p><strong>Assigned Officer:</strong> ${assignedOfficer}</p>` : ""}
                </div>
                <p>Our team is actively investigating and taking necessary actions to resolve your complaint.</p>
                <p>We will notify you once the issue is resolved.</p>
                <p>Thank you for your patience.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
              </div>
            `,
          };
        case "resolved":
          return {
            subject: `Complaint ${complaintId} - Resolved`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">Complaint Resolved</h2>
                <p>Dear ${citizenName},</p>
                <p>Great news! Your complaint has been successfully resolved.</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Complaint ID:</strong> ${complaintId}</p>
                  <p><strong>Category:</strong> ${category}</p>
                  <p><strong>Status:</strong> Resolved</p>
                  ${assignedOfficer ? `<p><strong>Resolved By:</strong> ${assignedOfficer}</p>` : ""}
                </div>
                <p>We hope this resolution meets your expectations. If you have any further concerns, please feel free to file another complaint.</p>
                <p>Thank you for using our grievance management system.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
              </div>
            `,
          };
        default:
          return {
            subject: `Complaint ${complaintId} - Status Update`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Complaint Status Update</h2>
                <p>Dear ${citizenName},</p>
                <p>Your complaint status has been updated.</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Complaint ID:</strong> ${complaintId}</p>
                  <p><strong>Category:</strong> ${category}</p>
                  <p><strong>Status:</strong> ${status}</p>
                </div>
                <p>You can track your complaint for further updates.</p>
                <p>Thank you.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
              </div>
            `,
          };
      }
    };

    const emailContent = getEmailContent();

    // Send email using Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        // Using Resend sandbox sender to avoid domain verification during testing
        from: "Grievance System <onboarding@resend.dev>",
        to: [to],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error", response.status, response.statusText, data);
      throw new Error(`Failed to send email: status=${response.status} body=${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
