import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const userId = user.id;

    // Gather all user data
    const [profile, roles, leads, projects, conversations, messages, attachments, auditLogs] = await Promise.all([
      adminClient.from("profiles").select("*").eq("user_id", userId),
      adminClient.from("user_roles").select("*").eq("user_id", userId),
      adminClient.from("leads").select("*").eq("user_id", userId),
      adminClient.from("projects").select("*").eq("user_id", userId),
      adminClient.from("conversations").select("*").eq("user_id", userId),
      adminClient.from("messages").select("*, conversations!inner(user_id)").eq("conversations.user_id", userId),
      adminClient.from("project_attachments").select("*").eq("user_id", userId),
      adminClient.from("audit_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(500),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: { id: userId, email: user.email },
      profile: profile.data,
      roles: roles.data,
      leads: leads.data,
      projects: projects.data,
      conversations: conversations.data,
      messages: messages.data,
      attachments: attachments.data,
      audit_logs: auditLogs.data,
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
