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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: hasAdmin } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!hasAdmin) throw new Error("Forbidden");

    const { data: authData, error: authError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (authError) throw authError;

    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (profilesError) throw profilesError;

    const { data: roles, error: rolesError } = await adminClient
      .from("user_roles")
      .select("*");
    if (rolesError) throw rolesError;

    const { data: leads } = await adminClient
      .from("leads")
      .select("id, company_name");
    const companyMap: Record<string, string> = {};
    for (const l of leads || []) {
      companyMap[l.id] = l.company_name;
    }

    const emailMap: Record<string, string> = {};
    for (const u of authData.users) {
      emailMap[u.id] = u.email || "";
    }

    const rolesMap: Record<string, string[]> = {};
    for (const r of roles || []) {
      if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
      rolesMap[r.user_id].push(r.role);
    }

    // Build manager name map from profiles
    const profileMap: Record<string, string> = {};
    for (const p of profiles || []) {
      profileMap[p.user_id] = p.display_name || emailMap[p.user_id] || "";
    }

    const result = (profiles || []).map((p: any) => ({
      ...p,
      email: emailMap[p.user_id] || "",
      company_name: p.company_id ? (companyMap[p.company_id] || null) : null,
      manager_name: p.manager_id ? (profileMap[p.manager_id] || null) : null,
      user_roles: (rolesMap[p.user_id] || []).map((role: string) => ({ role })),
    }));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
