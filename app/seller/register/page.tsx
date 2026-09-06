"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ChainMarketHeader from "@/components/ChainMarketHeader";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const DOCUMENT_TYPES = [
  ...IMAGE_TYPES,
  "application/pdf",
];

type SellerProfile = {
  store_name: string;
  store_description: string | null;
  seller_status: string;
  verification_status: string;
};

type SellerVerification = {
  legal_name: string;
  date_of_birth: string;
  address: string;
  verification_status: string;
  rejection_reason: string | null;
};

export default function SellerRegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const supabase = useMemo(() => createClient(), []);

  const [search, setSearch] = useState("");

  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");

  const [legalName, setLegalName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");

  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [additionalFile, setAdditionalFile] = useState<File | null>(null);

  const [agreeData, setAgreeData] = useState(false);
  const [agreeVerification, setAgreeVerification] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setInitialLoading(false);
      return;
    }

    const currentUser = user;

    async function loadExistingApplication() {
      const [profileResult, verificationResult] = await Promise.all([
        supabase
          .from("seller_profiles")
          .select(
            "store_name, store_description, seller_status, verification_status"
          )
          .eq("seller_id", currentUser.id)
          .maybeSingle(),

        supabase
          .from("seller_verifications")
          .select(
            "legal_name, date_of_birth, address, verification_status, rejection_reason"
          )
          .eq("seller_id", currentUser.id)
          .maybeSingle(),
      ]);

      if (profileResult.error) {
        setError(profileResult.error.message);
      }

      if (verificationResult.error) {
        setError(verificationResult.error.message);
      }

      const profile = profileResult.data as SellerProfile | null;
      const verification =
        verificationResult.data as SellerVerification | null;

      if (profile) {
        setStoreName(profile.store_name ?? "");
        setStoreDescription(profile.store_description ?? "");
        setExistingStatus(profile.seller_status);
      }

      if (verification) {
        setLegalName(verification.legal_name ?? "");
        setDateOfBirth(verification.date_of_birth ?? "");
        setAddress(verification.address ?? "");
        setExistingStatus(verification.verification_status);

        if (verification.rejection_reason) {
          setRejectionReason(verification.rejection_reason);
        }
      }

      setInitialLoading(false);
    }

    loadExistingApplication();
  }, [loading, user, supabase]);

  function validateFile(
    file: File | null,
    required: boolean,
    label: string,
    allowedTypes: string[]
  ) {
    if (!file) {
      if (required) {
        return `${label} wajib diupload.`;
      }

      return "";
    }

    if (!allowedTypes.includes(file.type)) {
      return `${label} harus berupa JPG, PNG, WEBP${allowedTypes.includes(
        "application/pdf"
      ) ? " atau PDF" : ""}.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `${label} maksimal 5 MB.`;
    }

    return "";
  }

  async function uploadFile(
    file: File,
    folder: string
  ): Promise<string> {
    if (!user) {
      throw new Error("User belum login.");
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "bin";

    const filePath = `${user.id}/${folder}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("seller-kyc")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    return filePath;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!user) {
      setError("Kamu harus login terlebih dahulu.");
      return;
    }

    setError("");
    setSuccess("");

    if (!storeName.trim()) {
      setError("Nama toko wajib diisi.");
      return;
    }

    if (!legalName.trim()) {
      setError("Nama lengkap sesuai KTP wajib diisi.");
      return;
    }

    if (!dateOfBirth) {
      setError("Tanggal lahir wajib diisi.");
      return;
    }

    if (!address.trim()) {
      setError("Alamat sesuai KTP wajib diisi.");
      return;
    }

    const ktpValidation = validateFile(
      ktpFile,
      true,
      "KTP",
      IMAGE_TYPES
    );

    if (ktpValidation) {
      setError(ktpValidation);
      return;
    }

    const selfieValidation = validateFile(
      selfieFile,
      true,
      "Selfie dengan KTP",
      IMAGE_TYPES
    );

    if (selfieValidation) {
      setError(selfieValidation);
      return;
    }

    const additionalValidation = validateFile(
      additionalFile,
      false,
      "Dokumen tambahan",
      DOCUMENT_TYPES
    );

    if (additionalValidation) {
      setError(additionalValidation);
      return;
    }

    if (!agreeData) {
      setError(
        "Kamu harus menyetujui bahwa data yang diberikan benar."
      );
      return;
    }

    if (!agreeVerification) {
      setError(
        "Kamu harus menyetujui proses verifikasi identitas."
      );
      return;
    }

    setSubmitting(true);

    const uploadedPaths: string[] = [];

    try {
      /*
       * Pastikan seller profile ada.
       */
      const { data: existingProfile, error: profileCheckError } =
        await supabase
          .from("seller_profiles")
          .select("seller_id")
          .eq("seller_id", user.id)
          .maybeSingle();

      if (profileCheckError) {
        throw new Error(profileCheckError.message);
      }

      if (existingProfile) {
        const { error: profileUpdateError } = await supabase
          .from("seller_profiles")
          .update({
            store_name: storeName.trim(),
            store_description: storeDescription.trim(),
            seller_status: "pending",
            verification_status: "pending",
          })
          .eq("seller_id", user.id);

        if (profileUpdateError) {
          throw new Error(profileUpdateError.message);
        }
      } else {
        const { error: profileInsertError } = await supabase
          .from("seller_profiles")
          .insert({
            seller_id: user.id,
            store_name: storeName.trim(),
            store_description: storeDescription.trim(),
            seller_status: "pending",
            verification_status: "pending",
          });

        if (profileInsertError) {
          throw new Error(profileInsertError.message);
        }
      }

      /*
       * Upload dokumen KYC ke private bucket.
       */
      const ktpPath = await uploadFile(ktpFile!, "ktp");
      uploadedPaths.push(ktpPath);

      const selfiePath = await uploadFile(
        selfieFile!,
        "selfie-ktp"
      );
      uploadedPaths.push(selfiePath);

      let additionalPath: string | null = null;

      if (additionalFile) {
        additionalPath = await uploadFile(
          additionalFile,
          "additional"
        );

        uploadedPaths.push(additionalPath);
      }

      /*
       * Simpan data KYC ke database.
       */
      const { error: verificationError } = await supabase
        .from("seller_verifications")
        .upsert(
          {
            seller_id: user.id,
            legal_name: legalName.trim(),
            date_of_birth: dateOfBirth,
            address: address.trim(),
            id_document_path: ktpPath,
            selfie_document_path: selfiePath,
            additional_document_path: additionalPath,
            verification_status: "pending",
            rejection_reason: null,
          },
          {
            onConflict: "seller_id",
          }
        );

      if (verificationError) {
        throw new Error(verificationError.message);
      }

      setExistingStatus("pending");
      setSuccess(
        "Pengajuan seller berhasil dikirim dan sedang menunggu verifikasi."
      );

      setKtpFile(null);
      setSelfieFile(null);
      setAdditionalFile(null);
      setAgreeData(false);
      setAgreeVerification(false);
      setRejectionReason("");
    } catch (submitError) {
      /*
       * Kalau proses gagal setelah file terupload,
       * hapus file yang sudah sempat masuk Storage.
       */
      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from("seller-kyc")
          .remove(uploadedPaths);
      }

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Terjadi kesalahan saat mengirim pengajuan."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const theme = darkMode
    ? {
        page: "bg-zinc-950 text-white",
        card: "border-zinc-800 bg-zinc-900",
        input:
          "border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-600",
        muted: "text-zinc-400",
        divider: "border-zinc-800",
      }
    : {
        page: "bg-zinc-50 text-zinc-950",
        card: "border-zinc-200 bg-white",
        input:
          "border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400",
        muted: "text-zinc-500",
        divider: "border-zinc-200",
      };

  if (loading || initialLoading) {
    return (
      <main
        className={`flex min-h-screen items-center justify-center ${theme.page}`}
      >
        <p className={`text-sm ${theme.muted}`}>
          Loading...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={theme.page}>
        <ChainMarketHeader
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search products..."
          mobileSearchPlaceholder="Search products..."
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
          userEmail={null}
          showCart={false}
          onLogoClick={() => {
            window.location.href = "/";
          }}
        />

        <section className="mx-auto max-w-xl px-6 py-20 text-center">
          <div
            className={`rounded-3xl border p-8 ${theme.card}`}
          >
            <div className="text-5xl">🔐</div>

            <h1 className="mt-5 text-2xl font-black">
              Login Required
            </h1>

            <p className={`mt-3 text-sm leading-6 ${theme.muted}`}>
              Kamu harus login atau register akun ChainMarket
              sebelum mendaftar sebagai seller.
            </p>

            <Link
              href="/account"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Login / Register
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${theme.page}`}>
      <ChainMarketHeader
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products..."
        mobileSearchPlaceholder="Search products..."
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        userEmail={user.email ?? null}
        showCart={false}
        onLogoClick={() => {
          window.location.href = "/";
        }}
      />

      <section className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            Seller Program
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Become a Seller
          </h1>

          <p className={`mt-3 text-sm leading-6 ${theme.muted}`}>
            Lengkapi informasi toko dan verifikasi identitas
            sebelum mengajukan diri sebagai seller ChainMarket.
          </p>
        </div>

        {existingStatus === "approved" && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <p className="font-bold text-emerald-500">
              ✅ Seller kamu sudah approved.
            </p>

            <p className={`mt-1 text-sm ${theme.muted}`}>
              Kamu sudah melewati proses verifikasi seller.
            </p>
          </div>
        )}

        {existingStatus === "pending" && !success && (
          <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
            <p className="font-bold text-yellow-500">
              🟡 Pengajuan sedang diproses
            </p>

            <p className={`mt-1 text-sm ${theme.muted}`}>
              Kamu masih bisa memperbarui data sebelum proses
              review selesai.
            </p>
          </div>
        )}

        {rejectionReason && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="font-bold text-red-500">
              ❌ Pengajuan sebelumnya ditolak
            </p>

            <p className={`mt-2 text-sm ${theme.muted}`}>
              Alasan: {rejectionReason}
            </p>

            <p className={`mt-2 text-xs ${theme.muted}`}>
              Perbaiki data atau dokumen kemudian ajukan kembali.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STORE */}
          <div className={`rounded-3xl border p-6 sm:p-8 ${theme.card}`}>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                Step 1
              </p>

              <h2 className="mt-1 text-xl font-black">
                🏪 Informasi Toko
              </h2>
            </div>

            <div>
              <label className="text-sm font-bold">
                Nama Toko <span className="text-red-500">*</span>
              </label>

              <input
                value={storeName}
                onChange={(event) =>
                  setStoreName(event.target.value)
                }
                placeholder="Contoh: Genta Store"
                maxLength={100}
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500 ${theme.input}`}
              />
            </div>

            <div className="mt-5">
              <label className="text-sm font-bold">
                Deskripsi Toko
              </label>

              <textarea
                value={storeDescription}
                onChange={(event) =>
                  setStoreDescription(event.target.value)
                }
                placeholder="Jelaskan produk yang kamu jual..."
                rows={4}
                maxLength={1000}
                className={`mt-2 w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500 ${theme.input}`}
              />
            </div>
          </div>

          {/* IDENTITY */}
          <div className={`rounded-3xl border p-6 sm:p-8 ${theme.card}`}>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                Step 2
              </p>

              <h2 className="mt-1 text-xl font-black">
                🪪 Data Identitas
              </h2>

              <p className={`mt-2 text-xs leading-5 ${theme.muted}`}>
                Gunakan data yang sama dengan dokumen identitas
                yang akan kamu upload.
              </p>
            </div>

            <div>
              <label className="text-sm font-bold">
                Nama Lengkap sesuai KTP{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                value={legalName}
                onChange={(event) =>
                  setLegalName(event.target.value)
                }
                placeholder="Nama lengkap sesuai KTP"
                maxLength={150}
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500 ${theme.input}`}
              />
            </div>

            <div className="mt-5">
              <label className="text-sm font-bold">
                Tanggal Lahir{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="date"
                value={dateOfBirth}
                onChange={(event) =>
                  setDateOfBirth(event.target.value)
                }
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500 ${theme.input}`}
              />
            </div>

            <div className="mt-5">
              <label className="text-sm font-bold">
                Alamat sesuai KTP{" "}
                <span className="text-red-500">*</span>
              </label>

              <textarea
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                placeholder="Alamat lengkap sesuai KTP"
                rows={5}
                maxLength={1000}
                className={`mt-2 w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500 ${theme.input}`}
              />
            </div>
          </div>

          {/* DOCUMENTS */}
          <div className={`rounded-3xl border p-6 sm:p-8 ${theme.card}`}>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                Step 3
              </p>

              <h2 className="mt-1 text-xl font-black">
                📄 Dokumen Verifikasi
              </h2>

              <p className={`mt-2 text-xs leading-5 ${theme.muted}`}>
                File maksimal 5 MB. KTP dan selfie dengan KTP
                wajib diupload.
              </p>
            </div>

            <div>
              <label className="text-sm font-bold">
                KTP <span className="text-red-500">*</span>
              </label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setKtpFile(event.target.files?.[0] ?? null)
                }
                className={`mt-2 block w-full rounded-xl border p-3 text-sm ${theme.input}`}
              />

              {ktpFile && (
                <p className={`mt-2 text-xs ${theme.muted}`}>
                  File: {ktpFile.name}
                </p>
              )}
            </div>

            <div className="mt-6">
              <label className="text-sm font-bold">
                Selfie dengan KTP{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setSelfieFile(
                    event.target.files?.[0] ?? null
                  )
                }
                className={`mt-2 block w-full rounded-xl border p-3 text-sm ${theme.input}`}
              />

              {selfieFile && (
                <p className={`mt-2 text-xs ${theme.muted}`}>
                  File: {selfieFile.name}
                </p>
              )}
            </div>

            <div className="mt-6">
              <label className="text-sm font-bold">
                Dokumen Tambahan{" "}
                <span className={`font-normal ${theme.muted}`}>
                  (opsional)
                </span>
              </label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(event) =>
                  setAdditionalFile(
                    event.target.files?.[0] ?? null
                  )
                }
                className={`mt-2 block w-full rounded-xl border p-3 text-sm ${theme.input}`}
              />

              {additionalFile && (
                <p className={`mt-2 text-xs ${theme.muted}`}>
                  File: {additionalFile.name}
                </p>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-sm font-bold">
                🔒 Dokumen bersifat private
              </p>

              <p className={`mt-1 text-xs leading-5 ${theme.muted}`}>
                Dokumen KYC disimpan di private storage dan tidak
                dipublikasikan ke marketplace.
              </p>
            </div>
          </div>

          {/* CONSENT */}
          <div className={`rounded-3xl border p-6 sm:p-8 ${theme.card}`}>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                Step 4
              </p>

              <h2 className="mt-1 text-xl font-black">
                ✅ Persetujuan
              </h2>
            </div>

            <label className="flex cursor-pointer gap-3">
              <input
                type="checkbox"
                checked={agreeData}
                onChange={(event) =>
                  setAgreeData(event.target.checked)
                }
                className="mt-1 h-4 w-4"
              />

              <span className="text-sm leading-6">
                Saya menyatakan bahwa informasi yang saya berikan
                adalah benar dan dapat dipertanggungjawabkan.
              </span>
            </label>

            <label className="mt-4 flex cursor-pointer gap-3">
              <input
                type="checkbox"
                checked={agreeVerification}
                onChange={(event) =>
                  setAgreeVerification(event.target.checked)
                }
                className="mt-1 h-4 w-4"
              />

              <span className="text-sm leading-6">
                Saya menyetujui proses verifikasi identitas dan
                penggunaan dokumen KYC untuk keperluan pendaftaran
                seller ChainMarket.
              </span>
            </label>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
              <p className="font-bold text-emerald-500">
                ✅ Pengajuan seller berhasil dikirim
              </p>

              <p className={`mt-2 text-sm ${theme.muted}`}>
                Status kamu sekarang:
                <strong className="ml-1 text-yellow-500">
                  Pending Verification
                </strong>
              </p>

              <p className={`mt-2 text-xs leading-5 ${theme.muted}`}>
                Data dan dokumen kamu akan melalui proses review
                sebelum akses Seller Dashboard diberikan.
              </p>

              <Link
                href="/"
                className="mt-5 inline-flex rounded-xl border border-emerald-500 px-5 py-3 text-sm font-bold text-emerald-500 hover:bg-emerald-500 hover:text-white"
              >
                ← Kembali ke Marketplace
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || existingStatus === "approved"}
            className="w-full rounded-xl bg-blue-600 px-6 py-4 text-sm font-black text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Mengirim & Mengupload Dokumen..."
              : existingStatus === "approved"
                ? "Seller Sudah Approved"
                : "Submit Seller Application"}
          </button>
        </form>
      </section>
    </main>
  );
}
