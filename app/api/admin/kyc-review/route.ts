import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const role = user.app_metadata?.role;

  if (role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const sellerId = body.seller_id;

  if (!sellerId) {
    return NextResponse.json(
      { error: "seller_id is required" },
      { status: 400 }
    );
  }

  const { data: verification, error: verificationError } =
    await supabase
      .from("seller_verifications")
      .select("*")
      .eq("seller_id", sellerId)
      .maybeSingle();

  if (verificationError) {
    return NextResponse.json(
      { error: verificationError.message },
      { status: 500 }
    );
  }

  if (!verification) {
    return NextResponse.json(
      {
        error:
          "Seller belum memiliki data KYC untuk direview.",
      },
      { status: 400 }
    );
  }

  /*
   * KYC AGENT v1
   *
   * Prototype rule engine.
   * Nanti bagian ini diganti dengan hasil:
   * - ID verification provider
   * - OCR
   * - liveness
   * - face verification
   * - duplicate identity detection
   */

  let riskScore = 0;
  const reasons: string[] = [];

  if (!verification.legal_name) {
    riskScore += 25;
    reasons.push("Legal name belum tersedia.");
  }

  if (!verification.date_of_birth) {
    riskScore += 20;
    reasons.push("Tanggal lahir belum tersedia.");
  }

  if (!verification.address) {
    riskScore += 15;
    reasons.push("Alamat belum tersedia.");
  }

  if (!verification.id_document_path) {
    riskScore += 25;
    reasons.push("Dokumen identitas belum tersedia.");
  }

  if (!verification.selfie_document_path) {
    riskScore += 15;
    reasons.push("Selfie belum tersedia.");
  }

  if (verification.verification_status === "rejected") {
    riskScore += 30;
    reasons.push("KYC sebelumnya berstatus rejected.");
  }

  if (verification.verification_status === "verified") {
    riskScore = Math.max(0, riskScore - 30);
    reasons.push("KYC sebelumnya telah diverifikasi.");
  }

  riskScore = Math.min(100, Math.max(0, riskScore));

  let decision: "approve" | "review" | "reject";

  if (riskScore >= 70) {
    decision = "reject";
  } else if (riskScore >= 35) {
    decision = "review";
  } else {
    decision = "approve";
  }

  if (reasons.length === 0) {
    reasons.push("Tidak ditemukan red flag pada data KYC yang tersedia.");
  }

  const { data: review, error: reviewError } = await supabase
    .from("kyc_reviews")
    .insert({
      seller_id: sellerId,
      decision,
      risk_score: riskScore,
      reasons,
      agent_version: "kyc-agent-v1",
    })
    .select()
    .single();

  if (reviewError) {
    return NextResponse.json(
      { error: reviewError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    review,
  });
}
