import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const { user_id, active } = await req.json();
    if (!user_id || typeof active !== "boolean") throw new Error("user_id and active (boolean) required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if caller is admin
    const { data: hasAdmin } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!hasAdmin) {
      // Fallback: check if caller is CFO client and target is same company
      const { data: callerProfile } = await adminClient
        .from("profiles")
        .select("user_type, company_id")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .single();

      if (!callerProfile || callerProfile.user_type !== "client") throw new Error("Forbidden");

      const { data: hasCfo } = await adminClient.rpc("has_role", {
        _user_id: user.id,
        _role: "cfo",
      });
      if (!hasCfo) throw new Error("Forbidden");

      // Verify target belongs to same company
      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("company_id")
        .eq("user_id", user_id)
        .single();

      if (!targetProfile || targetProfile.company_id !== callerProfile.company_id) {
        throw new Error("Forbidden");
      }
    }

    if (active) {
      await adminClient.auth.admin.updateUserById(user_id, { ban_duration: "none" });
      await adminClient.from("profiles").update({ is_deleted: false, deleted_at: null }).eq("user_id", user_id);
    } else {
      await adminClient.auth.admin.updateUserById(user_id, { ban_duration: "876600h" });
      await adminClient.from("profiles").update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq("user_id", user_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
