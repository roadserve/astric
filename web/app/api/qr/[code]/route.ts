import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return new NextResponse("QR not configured", { status: 500 })
  }

  const code = (params.code || "").trim()
  if (!code) return new NextResponse("Not found", { status: 404 })

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const { data: qr, error } = await supabase
    .from("gmb_qr_codes")
    .select("id,target_url")
    .eq("code", code)
    .maybeSingle()

  if (error || !qr) return new NextResponse("Not found", { status: 404 })

  // Track scan (best-effort)
  try {
    const ua = req.headers.get("user-agent")
    const ref = req.headers.get("referer")
    await supabase.from("gmb_qr_scans").insert({
      qr_code_id: qr.id,
      user_agent: ua,
      referrer: ref,
    })
  } catch {
    // ignore
  }

  return NextResponse.redirect(qr.target_url, { status: 302 })
}

