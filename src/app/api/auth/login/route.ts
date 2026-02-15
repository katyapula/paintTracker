import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const requestUrl = new URL(request.url);
  const redirectTo = `${requestUrl.origin}/api/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/?error=auth_start_failed", requestUrl.origin));
  }

  return NextResponse.redirect(data.url);
}
