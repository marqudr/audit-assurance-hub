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

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get caller roles and profile
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const roles = callerRoles?.map((r: any) => r.role) || [];
    const isAdmin = roles.includes("admin");
    const isGestor = roles.includes("gestor");
    const isCfo = roles.includes("cfo");

    // Get caller profile for client CFO check
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("user_type, company_id")
      .eq("user_id", caller.id)
      .single();

    const isClientCfo = isCfo && callerProfile?.user_type === "client";

    const { email, role, user_type, company_id, manager_id, display_name } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), { status: 400, headers: corsHeaders });
    }

    // Permission checks
    let finalCompanyId = company_id || null;

    if (user_type === "client") {
      if (isClientCfo) {
        // Client CFO can only invite to their own company
        finalCompanyId = callerProfile!.company_id;
        // Restrict roles to cfo or user only
        if (role && !["cfo", "user"].includes(role)) {
          return new Response(JSON.stringify({ error: "Client admins can only assign 'cfo' or 'user' roles" }), { status: 403, headers: corsHeaders });
        }
      } else if (!isAdmin && !isGestor) {
        return new Response(JSON.stringify({ error: "Only admins or managers can invite client users" }), { status: 403, headers: corsHeaders });
      }
      if (!finalCompanyId) {
        return new Response(JSON.stringify({ error: "company_id is required for client users" }), { status: 400, headers: corsHeaders });
      }
    } else {
      // Staff users: only admin can invite
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Only admins can invite staff users" }), { status: 403, headers: corsHeaders });
      }
    }

    // Try to invite; if user exists, look them up instead
    let newUserId: string;
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        display_name: display_name || email,
        user_type: user_type || "staff",
        company_id: finalCompanyId,
        manager_id: manager_id || null,
      },
    });

    if (inviteError) {
      if (inviteError.message.includes("already been registered")) {
        // User exists — find them by email
        const { data: { users: existingUsers } } = await adminClient.auth.admin.listUsers();
        const existing = existingUsers?.find((u: any) => u.email === email);
        if (!existing) {
          return new Response(JSON.stringify({ error: "User exists but could not be found" }), { status: 400, headers: corsHeaders });
        }
        newUserId = existing.id;

        // Update their profile
        const profileUpdates: any = {
          user_type: user_type || "staff",
          company_id: finalCompanyId,
          manager_id: manager_id || null,
        };
        if (display_name) profileUpdates.display_name = display_name;
        await adminClient.from("profiles").update(profileUpdates).eq("user_id", newUserId);
      } else {
        return new Response(JSON.stringify({ error: inviteError.message }), { status: 400, headers: corsHeaders });
      }
    } else {
      newUserId = inviteData.user.id;
      // Update display_name on the profile if provided (handle_new_user trigger already created it)
      if (display_name) {
        await adminClient.from("profiles").update({ display_name }).eq("user_id", newUserId);
      }
    }

    // Assign role (upsert — delete old then insert)
    if (role) {
      await adminClient.from("user_roles").delete().eq("user_id", newUserId);
      await adminClient.from("user_roles").insert({
        user_id: newUserId,
        role: role,
      });
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUserId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
