"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  FileSignature,
  ShieldCheck,
  ArrowLeft,
  Printer,
  Copy,
} from "lucide-react";
import useUser from "@/utils/useUser";
import { useMemoriaAdminStatus } from "@/hooks/useMemoriaAdminStatus";

function safeTrim(v) {
  if (typeof v !== "string") {
    return "";
  }
  return v.trim();
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildAgreementText({
  agreementType,
  companyName,
  companyAddress,
  counterpartyName,
  counterpartyAddress,
  effectiveDate,
  jurisdiction,
  termMonths,
  purpose,
  restrictedActivities,
  territory,
  notes,
  companySignerName,
  companySignerTitle,
  counterpartySignerName,
  counterpartySignerTitle,
}) {
  const typeLabel =
    agreementType === "non_compete"
      ? "Non-Compete"
      : agreementType === "cda"
        ? "Confidential Disclosure Agreement (CDA)"
        : "Non-Disclosure Agreement (NDA)";

  const termLine = termMonths ? `${termMonths} months` : "[term]";
  const jurisdictionLine = jurisdiction || "[jurisdiction]";

  const companyAddressLine =
    companyAddress ||
    "[Company Address — paste your registered business address here]";
  const counterpartyAddressLine =
    counterpartyAddress || "[Counterparty Address]";

  const purposeLine = purpose || "[Purpose / scope of discussions]";

  const restrictedLine = restrictedActivities || "[Restricted activities]";
  const territoryLine = territory || "[Territory]";

  const extraNotes = notes ? `\n\nAdditional Notes:\n${notes}` : "";

  if (agreementType === "non_compete") {
    return [
      `${typeLabel} — EventureAI`,
      "",
      `This Non-Compete Agreement (\"Agreement\") is entered into as of ${effectiveDate || "[Effective Date]"} (\"Effective Date\") by and between:`,
      "",
      `${companyName || "EventureAI"} (\"Company\"), located at ${companyAddressLine},`,
      `and`,
      `${counterpartyName || "[Counterparty Name]"} (\"Recipient\"), located at ${counterpartyAddressLine}.`,
      "",
      "1. Purpose.",
      `The parties expect to engage in discussions for: ${purposeLine}.`,
      "",
      "2. Non-Compete.",
      `For a period of ${termLine} following the Effective Date, Recipient agrees not to engage in: ${restrictedLine}.`,
      "",
      "3. Territory.",
      `This restriction applies in: ${territoryLine}.`,
      "",
      "4. Confidentiality.",
      "Recipient agrees to keep Company confidential information strictly confidential and use it only for the Purpose.",
      "",
      "5. Governing Law.",
      `This Agreement is governed by the laws of ${jurisdictionLine}.`,
      extraNotes,
      "",
      "Signatures",
      "",
      `COMPANY: ${companyName || "EventureAI"}`,
      `By: ${companySignerName || "[Name]"}`,
      `Title: ${companySignerTitle || "[Title]"}`,
      "",
      `RECIPIENT: ${counterpartyName || "[Counterparty Name]"}`,
      `By: ${counterpartySignerName || "[Name]"}`,
      `Title: ${counterpartySignerTitle || "[Title]"}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  // NDA / CDA
  const confidentialityTerm = termLine;

  return [
    `${typeLabel} — EventureAI`,
    "",
    `This ${typeLabel} (\"Agreement\") is entered into as of ${effectiveDate || "[Effective Date]"} (\"Effective Date\") by and between:`,
    "",
    `${companyName || "EventureAI"} (\"Disclosing Party\"), located at ${companyAddressLine},`,
    `and`,
    `${counterpartyName || "[Counterparty Name]"} (\"Receiving Party\"), located at ${counterpartyAddressLine}.`,
    "",
    "1. Purpose.",
    `The parties wish to share information for: ${purposeLine}.`,
    "",
    "2. Confidential Information.",
    "Confidential Information includes non-public business, technical, product, customer, and financial information disclosed by the Disclosing Party.",
    "",
    "3. Obligations.",
    "The Receiving Party will (a) keep Confidential Information confidential, (b) use it only for the Purpose, and (c) not disclose it except to people who need to know and are bound by similar duties.",
    "",
    "4. Term.",
    `These obligations last for ${confidentialityTerm} from the Effective Date (unless otherwise required by law).`,
    "",
    "5. Governing Law.",
    `This Agreement is governed by the laws of ${jurisdictionLine}.`,
    extraNotes,
    "",
    "Signatures",
    "",
    `DISCLOSING PARTY: ${companyName || "EventureAI"}`,
    `By: ${companySignerName || "[Name]"}`,
    `Title: ${companySignerTitle || "[Title]"}`,
    "",
    `RECEIVING PARTY: ${counterpartyName || "[Counterparty Name]"}`,
    `By: ${counterpartySignerName || "[Name]"}`,
    `Title: ${counterpartySignerTitle || "[Title]"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function AgreementsAdminPage() {
  const { data: user, loading: userLoading } = useUser();
  const adminStatusQuery = useMemoriaAdminStatus(userLoading);

  const isAuthenticated = Boolean(adminStatusQuery.data?.isAuthenticated);
  const isAdmin = Boolean(adminStatusQuery.data?.isAdmin);

  const [agreementType, setAgreementType] = useState("nda");

  const [companyName, setCompanyName] = useState("EventureAI");
  const [companyAddress, setCompanyAddress] = useState("");

  const [counterpartyName, setCounterpartyName] = useState("");
  const [counterpartyEmail, setCounterpartyEmail] = useState("");
  const [counterpartyAddress, setCounterpartyAddress] = useState("");

  const [effectiveDate, setEffectiveDate] = useState(todayISO());
  const [jurisdiction, setJurisdiction] = useState("Delaware");

  const [termMonths, setTermMonths] = useState("24");
  const [purpose, setPurpose] = useState(
    "Evaluation of a potential business relationship",
  );

  const [restrictedActivities, setRestrictedActivities] = useState("");
  const [territory, setTerritory] = useState("");

  const [notes, setNotes] = useState("");

  const [companySignerName, setCompanySignerName] = useState(user?.name || "");
  const [companySignerTitle, setCompanySignerTitle] = useState("Founder");

  const [counterpartySignerName, setCounterpartySignerName] = useState("");
  const [counterpartySignerTitle, setCounterpartySignerTitle] = useState("");

  const [agreed, setAgreed] = useState(false);

  const [pageError, setPageError] = useState(null);
  const [saveResult, setSaveResult] = useState(null);

  const parsedTermMonths = useMemo(() => {
    const n = Number(termMonths);
    if (!Number.isFinite(n) || n <= 0) {
      return null;
    }
    return Math.min(240, Math.floor(n));
  }, [termMonths]);

  const agreementText = useMemo(() => {
    return buildAgreementText({
      agreementType,
      companyName: safeTrim(companyName),
      companyAddress: safeTrim(companyAddress),
      counterpartyName: safeTrim(counterpartyName),
      counterpartyAddress: safeTrim(counterpartyAddress),
      effectiveDate: safeTrim(effectiveDate),
      jurisdiction: safeTrim(jurisdiction),
      termMonths: parsedTermMonths,
      purpose: safeTrim(purpose),
      restrictedActivities: safeTrim(restrictedActivities),
      territory: safeTrim(territory),
      notes: safeTrim(notes),
      companySignerName: safeTrim(companySignerName),
      companySignerTitle: safeTrim(companySignerTitle),
      counterpartySignerName: safeTrim(counterpartySignerName),
      counterpartySignerTitle: safeTrim(counterpartySignerTitle),
    });
  }, [
    agreementType,
    companyName,
    companyAddress,
    counterpartyName,
    counterpartyAddress,
    effectiveDate,
    jurisdiction,
    parsedTermMonths,
    purpose,
    restrictedActivities,
    territory,
    notes,
    companySignerName,
    companySignerTitle,
    counterpartySignerName,
    counterpartySignerTitle,
  ]);

  const canSave = useMemo(() => {
    if (!isAdmin) {
      return false;
    }

    const hasCounterparty = Boolean(safeTrim(counterpartyName));
    const hasEmail = Boolean(safeTrim(counterpartyEmail));
    const hasCompanySigner = Boolean(safeTrim(companySignerName));
    const hasCounterpartySigner = Boolean(safeTrim(counterpartySignerName));

    if (!agreed) {
      return false;
    }

    if (!hasCounterparty || !hasEmail) {
      return false;
    }

    if (!hasCompanySigner || !hasCounterpartySigner) {
      return false;
    }

    return true;
  }, [
    agreed,
    counterpartyEmail,
    counterpartyName,
    companySignerName,
    counterpartySignerName,
    isAdmin,
  ]);

  const captureMutation = useMutation({
    mutationFn: async () => {
      if (!canSave) {
        throw new Error(
          "Fill required fields and check the agreement box before finalizing.",
        );
      }

      const conversationId = `legal-${Date.now()}`;

      const turn = {
        userText: agreementText,
        assistantThinkingSummary: null,
        assistantSynthesis: null,
        codeSummary: null,
        assistantResponse: null,
        metadata: {
          agreementType,
          counterpartyName: safeTrim(counterpartyName) || null,
          counterpartyEmail: safeTrim(counterpartyEmail) || null,
          effectiveDate: safeTrim(effectiveDate) || null,
          jurisdiction: safeTrim(jurisdiction) || null,
          termMonths: parsedTermMonths,
          companySignerName: safeTrim(companySignerName) || null,
          counterpartySignerName: safeTrim(counterpartySignerName) || null,
        },
      };

      const options = {
        appSource: "eventureai_legal",
        index: "Legal_Agreements",
        title: `${companyName || "EventureAI"} – ${agreementType.toUpperCase()} – ${counterpartyName || "Agreement"}`,
        metadata: {
          agreementType,
          counterpartyEmail: safeTrim(counterpartyEmail) || null,
          createdByEmail: user?.email || null,
        },
      };

      const response = await fetch("/api/memoria/proxy/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, turn, options }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `When calling /api/memoria/proxy/capture, the response was [${response.status}] ${text}`,
        );
      }

      return response.json();
    },
    onMutate: () => {
      setPageError(null);
      setSaveResult(null);
    },
    onSuccess: (data) => {
      setSaveResult(data);
    },
    onError: (e) => {
      console.error(e);
      setPageError(e?.message || "Could not finalize agreement");
    },
  });

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(agreementText);
    } catch (e) {
      console.error(e);
      setPageError("Could not copy to clipboard");
    }
  }, [agreementText]);

  const onPrint = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.print();
  }, []);

  const banner = useMemo(() => {
    if (!isAuthenticated) {
      return {
        tone: "bg-gray-50 border-black/10",
        title: "Sign in required",
        body: "Sign in to create and finalize agreements.",
      };
    }

    if (!isAdmin) {
      return {
        tone: "bg-gray-50 border-black/10",
        title: "Signed in (not admin yet)",
        body: "To create agreements here, enable Memoria admin for your account.",
      };
    }

    return {
      tone: "bg-green-50 border-green-200",
      title: "Admin: Agreement builder",
      body: "Fill the fields, preview, then finalize to store it in Memoria.",
    };
  }, [isAuthenticated, isAdmin]);

  const showNonCompeteFields = agreementType === "non_compete";
  const isBusy = captureMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <div className="bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <a
                href="/memoria/admins"
                className="text-sm text-[#667085] dark:text-[#A1A1AA] inline-flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Back to admins
              </a>
              <h1 className="mt-3 text-[28px] leading-[1.2] font-bold text-[#0F172A] dark:text-white font-inter">
                Agreement Builder
              </h1>
              <p className="mt-1 text-sm text-[#667085] dark:text-[#A1A1AA]">
                DocuSign-style: fill → preview → sign → finalize.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/memoria/keys"
                className="h-[40px] px-4 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white inline-flex items-center justify-center"
              >
                Keys
              </a>
              <a
                href="/memory"
                className="h-[40px] px-4 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white inline-flex items-center justify-center"
              >
                Open Memory
              </a>
            </div>
          </div>

          <div className={`mt-5 p-4 rounded-xl border ${banner.tone}`}>
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="mt-0.5 text-[#0F172A]" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-[#0F172A] dark:text-white">
                  {banner.title}
                </div>
                <div className="mt-1 text-sm text-[#334155] dark:text-[#CBD5E1]">
                  {banner.body}
                </div>
                <div className="mt-2 text-xs text-[#667085] dark:text-[#A1A1AA]">
                  Not legal advice — please have counsel review before sending.
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm text-[#334155] dark:text-[#CBD5E1]">
              {user?.email ? (
                <div>
                  Signed in as{" "}
                  <span className="font-semibold">{user.email}</span>.{" "}
                  <a className="underline" href="/account/logout">
                    Sign out
                  </a>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <a
                    className="underline"
                    href="/account/signin?callbackUrl=/memoria/admins/agreements"
                  >
                    Sign in
                  </a>
                  <a
                    className="underline"
                    href="/account/signup?callbackUrl=/memoria/admins/agreements"
                  >
                    Create account
                  </a>
                </div>
              )}
            </div>

            {isAuthenticated && !isAdmin && (
              <div className="mt-3">
                <a
                  href="/memoria/bootstrap"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-black text-white"
                >
                  Enable Memoria admin
                </a>
              </div>
            )}
          </div>

          {pageError && (
            <div className="mt-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm">
              {pageError}
            </div>
          )}

          {saveResult?.ok && (
            <div className="mt-4 p-4 rounded-xl border border-green-200 bg-green-50 text-sm text-[#0F172A]">
              <div className="font-semibold">Saved</div>
              <div className="mt-1 text-xs text-[#334155]">
                thread_id: {String(saveResult.thread_id || "")} • turn_id:{" "}
                {String(saveResult.turn_id || "")}
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-semibold text-[#0F172A] dark:text-white font-inter">
                Form
              </div>
              <button
                type="button"
                onClick={onCopy}
                className="h-[38px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] text-[#0F172A] dark:text-white hover:bg-[#F8F9FA] dark:hover:bg-[#262626] transition-colors inline-flex items-center gap-2"
              >
                <Copy size={16} /> Copy text
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
                  Agreement type
                </label>
                <select
                  value={agreementType}
                  onChange={(e) => setAgreementType(e.target.value)}
                  className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                  disabled={!isAdmin}
                >
                  <option value="nda">NDA</option>
                  <option value="cda">CDA</option>
                  <option value="non_compete">Non-Compete</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
                  Effective date
                </label>
                <input
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                  disabled={!isAdmin}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
                  Company name
                </label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="EventureAI"
                  className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                  disabled={!isAdmin}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
                  Company address
                </label>
                <input
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="(leave blank for now)"
                  className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
                  Counterparty name *
                </label>
                <input
                  value={counterpartyName}
                  onChange={(e) => setCounterpartyName(e.target.value)}
                  placeholder="Acme, Inc."
                  className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
                  Counterparty email *
                </label>
                <input
                  value={counterpartyEmail}
                  onChange={(e) => setCounterpartyEmail(e.target.value)}
                  placeholder="name@acme.com"
                  className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                  disabled={!isAdmin}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
                  Counterparty address
                </label>
                <input
                  value={counterpartyAddress}
                  onChange={(e) => setCounterpartyAddress(e.target.value)}
                  placeholder="(optional)"
                  className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                  disabled={!isAdmin}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
                  Purpose
                </label>
                <input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
                  Term (months)
                </label>
                <input
                  value={termMonths}
                  onChange={(e) => setTermMonths(e.target.value)}
                  className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
                  Governing law
                </label>
                <input
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                  disabled={!isAdmin}
                />
              </div>

              {showNonCompeteFields && (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
                      Restricted activities
                    </label>
                    <input
                      value={restrictedActivities}
                      onChange={(e) => setRestrictedActivities(e.target.value)}
                      placeholder="e.g., building/working on competing AI memory products"
                      className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                      disabled={!isAdmin}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
                      Territory
                    </label>
                    <input
                      value={territory}
                      onChange={(e) => setTerritory(e.target.value)}
                      placeholder="e.g., United States"
                      className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                      disabled={!isAdmin}
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                  disabled={!isAdmin}
                />
              </div>
            </div>

            <div className="mt-6 border-t border-[#EAECF0] dark:border-[#404040] pt-5">
              <div className="text-sm font-semibold text-[#0F172A] dark:text-white">
                Signatures (typed)
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[#667085] dark:text-[#A1A1AA] mb-1">
                    Company signer name *
                  </label>
                  <input
                    value={companySignerName}
                    onChange={(e) => setCompanySignerName(e.target.value)}
                    placeholder="Your name"
                    className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#667085] dark:text-[#A1A1AA] mb-1">
                    Company signer title
                  </label>
                  <input
                    value={companySignerTitle}
                    onChange={(e) => setCompanySignerTitle(e.target.value)}
                    className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#667085] dark:text-[#A1A1AA] mb-1">
                    Counterparty signer name *
                  </label>
                  <input
                    value={counterpartySignerName}
                    onChange={(e) => setCounterpartySignerName(e.target.value)}
                    placeholder="Their name"
                    className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#667085] dark:text-[#A1A1AA] mb-1">
                    Counterparty signer title
                  </label>
                  <input
                    value={counterpartySignerTitle}
                    onChange={(e) => setCounterpartySignerTitle(e.target.value)}
                    className="w-full h-[42px] px-3 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white outline-none"
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <label className="mt-4 flex items-start gap-3 text-sm text-[#0F172A] dark:text-white">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  disabled={!isAdmin}
                  className="mt-1"
                />
                <span>
                  I confirm this is accurate and I intend to sign
                  electronically.
                </span>
              </label>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => captureMutation.mutate()}
                  disabled={!canSave || isBusy}
                  className="h-[44px] px-4 rounded-lg bg-[#0F172A] hover:bg-[#17233A] text-white font-semibold disabled:opacity-60 inline-flex items-center gap-2"
                >
                  <FileSignature size={18} />
                  {isBusy ? "Finalizing…" : "Finalize + save"}
                </button>

                <button
                  type="button"
                  onClick={onPrint}
                  className="h-[44px] px-4 rounded-lg border border-[#E4E7EC] dark:border-[#404040] bg-white dark:bg-[#0F0F0F] text-[#0F172A] dark:text-white inline-flex items-center gap-2"
                >
                  <Printer size={18} /> Print
                </button>

                {!isAdmin && (
                  <div className="text-sm text-[#667085] dark:text-[#A1A1AA]">
                    Admin required to finalize.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#EAECF0] dark:border-[#404040] p-5">
            <div className="text-lg font-semibold text-[#0F172A] dark:text-white font-inter">
              Preview
            </div>
            <p className="mt-1 text-sm text-[#667085] dark:text-[#A1A1AA]">
              This is the exact text that will be saved.
            </p>

            <pre className="mt-4 whitespace-pre-wrap text-sm leading-relaxed bg-[#0B1220] text-[#E5E7EB] p-4 rounded-xl overflow-auto border border-black/10">
              {agreementText}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
