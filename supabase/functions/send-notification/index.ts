import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface NotificationRequest {
  type: "assignment" | "notes" | "papers" | "schedule";
  title: string;
  details: string;
  deadline?: string;
}

const TYPE_LABELS: Record<NotificationRequest["type"], { subject: string; intro: string }> = {
  assignment: { subject: "New Assignment", intro: "A new assignment has been posted on Molekul." },
  notes: { subject: "New Lesson Notes", intro: "New lesson notes have been uploaded on Molekul." },
  papers: { subject: "New Exam Paper", intro: "A new exam paper has been published on Molekul." },
  schedule: { subject: "New Live Class Scheduled", intro: "A new live class has been scheduled on Molekul." },
};

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return { ok: false, error: "Email service not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "onboarding@resend.dev",
      to: "ashanchanukar2004@gmail.com", // IMPORTANT: Replace with the exact email address you used to register your Resend account
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend error:", res.status, text);
    return { ok: false, error: `Email send failed (${res.status})` };
  }

  return { ok: true };
}

function buildHtml(notification: NotificationRequest): string {
  const label = TYPE_LABELS[notification.type];

  let deadlineSection = "";
  if (notification.deadline) {
    const d = new Date(notification.deadline);
    const formatted = d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }) + " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    deadlineSection = `
      <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;margin:16px 0;">
        <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">
          Deadline: ${formatted}
        </p>
        <p style="margin:4px 0 0 0;color:#b45309;font-size:13px;">
          Please submit your work before this date.
        </p>
      </div>`;
  }

  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <div style="background:linear-gradient(135deg,#33bdf5,#1a7eb6);border-radius:12px 12px 0 0;padding:20px 24px;text-align:center;">
        <h1 style="color:#fff;font-size:20px;margin:0;">Molekul</h1>
        <p style="color:#d9f1ff;font-size:13px;margin:4px 0 0;">Chemistry Portal</p>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
        <h2 style="color:#0f172a;font-size:18px;margin:0 0 8px;">${label.subject}</h2>
        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 12px;">${label.intro}</p>
        <div style="background:#f8fafc;border-radius:8px;padding:14px 18px;margin:16px 0;">
          <p style="margin:0;color:#0f172a;font-size:15px;font-weight:600;">${notification.title}</p>
          <p style="margin:8px 0 0 0;color:#64748b;font-size:13px;line-height:1.5;">${notification.details}</p>
        </div>
        ${deadlineSection}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
        <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
          Molekul &middot; For educational use &middot; ${new Date().getFullYear()}
        </p>
      </div>
    </div>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "teacher") {
      return new Response(JSON.stringify({ error: "Only teachers can send notifications" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: NotificationRequest = await req.json();
    const { type, title, details, deadline } = body;

    if (!type || !title) {
      return new Response(JSON.stringify({ error: "Missing type or title" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: students } = await supabase
      .from("profiles")
      .select("email")
      .eq("role", "student");

    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No students to notify" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const label = TYPE_LABELS[type];
    const subject = `[Molekul] ${label.subject}: ${title}`;
    const html = buildHtml({ type, title, details, deadline });

    let sent = 0;
    let failed = 0;

    for (const student of students) {
      const result = await sendEmail(student.email, subject, html);
      if (result.ok) {
        sent++;
      } else {
        failed++;
      }
    }

    return new Response(JSON.stringify({ sent, failed, total: students.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Notification error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});