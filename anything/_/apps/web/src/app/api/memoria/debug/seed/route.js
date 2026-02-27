import sql from "@/app/api/utils/sql";
import {
  buildLegacyContent,
  upsertIndexAndSubindex,
  upsertThread,
  upsertTurn,
} from "@/app/api/utils/memoriaStore";
import { requireSession } from "@/app/api/tournament/utils";

const SEED_TAG = "memoria_seed_14_v1";

function safeStr(value) {
  return typeof value === "string" ? value : "";
}

function buildSeedConversations(userId) {
  const uid = String(userId);
  const topics = [
    {
      slug: "blockchain",
      title: "Blockchain: simple ledger design",
      a: "Explain how a simple append-only ledger works.",
      b: "Give one example of a smart contract use case.",
    },
    {
      slug: "finance",
      title: "Finance: cashflow basics",
      a: "How do I track cash in vs cash out for a small business?",
      b: "What is the difference between revenue and profit?",
    },
    {
      slug: "integrations",
      title: "Integrations: API patterns",
      a: "What is the clean way to store API keys and call external services?",
      b: "How do I rate limit API calls safely?",
    },
    {
      slug: "memory",
      title: "Memory: read/write checks",
      a: "What tables store threads and turns in Memoria?",
      b: "How do we search past turns quickly?",
    },
    {
      slug: "fullstack",
      title: "Full stack: UI + API + DB",
      a: "What is a good pattern for a form that saves to Postgres?",
      b: "How do we keep the UI in sync after saving?",
    },
    {
      slug: "seo",
      title: "SEO: basics",
      a: "What are the top 3 SEO things a new site should do?",
      b: "How do internal links help SEO?",
    },
    {
      slug: "marketing",
      title: "Marketing: positioning",
      a: "What is a simple value prop for EventureAI?",
      b: "What is one good call-to-action for the homepage?",
    },
    {
      slug: "consulting",
      title: "Business consulting: next steps",
      a: "How do I prioritize features for an MVP?",
      b: "How do I validate customer demand quickly?",
    },
    {
      slug: "security",
      title: "Security: least privilege",
      a: "What does least privilege mean in practice?",
      b: "How should we handle secrets in production?",
    },
    {
      slug: "ops",
      title: "Ops: stability",
      a: "How do we monitor backend errors?",
      b: "What is a simple approach to retries?",
    },
    {
      slug: "product",
      title: "Product: onboarding",
      a: "What makes onboarding feel simple?",
      b: "How do I reduce friction at signup?",
    },
    {
      slug: "docs",
      title: "Docs: explain system",
      a: "How do I explain this system to a new developer?",
      b: "What should we document first?",
    },
    {
      slug: "testing",
      title: "Testing: smoke checks",
      a: "What is a good smoke test for a web app?",
      b: "How do I confirm DB read/write is working?",
    },
    {
      slug: "vision",
      title: "Vision: EventureAI",
      a: "Summarize EventureAI in one sentence.",
      b: "What is the long-term mission in 2 sentences?",
    },
  ];

  const conversations = topics.slice(0, 14).map((t, idx) => {
    const externalId = `memoria-seed:${uid}:${idx + 1}:${t.slug}`;
    return {
      externalId,
      title: t.title,
      context: "Seeded conversation for verifying Memoria read/write.",
      topic: t.slug,
      turns: [
        {
          turnIndex: 0,
          userText: t.a,
          assistantThinkingSummary:
            "Seeded example turn (no hidden reasoning).",
          assistantSynthesis:
            "Answer concisely, then include 2-3 bullets with concrete steps.",
          codeSummary: null,
          assistantResponse:
            "This is a seeded assistant response. It exists to test DB write paths and UI read paths.",
        },
        {
          turnIndex: 1,
          userText: t.b,
          assistantThinkingSummary: "Seeded example follow-up.",
          assistantSynthesis:
            "Keep it short. If uncertain, state assumptions. Provide a simple example.",
          codeSummary: null,
          assistantResponse:
            "This is another seeded assistant response used for verifying multi-turn threads.",
        },
      ],
    };
  });

  return conversations;
}

export async function POST(request) {
  try {
    const { userId } = await requireSession();
    if (!userId) {
      return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const appSource = safeStr(
      body?.app_source || body?.appSource || "eventureai",
    );
    const indexKey = safeStr(
      body?.indexKey || body?.index || "Cross_App_Conversations",
    );
    const subindexKey = safeStr(
      body?.subindexKey || body?.subindex || `seed-${userId}`,
    );

    const { memoriaIndexId, memoriaSubindexId } = await upsertIndexAndSubindex({
      indexKey,
      subindexKey,
    });

    const conversations = buildSeedConversations(userId);

    let threadsTouched = 0;
    let turnsTouched = 0;
    let legacyEntriesInserted = 0;

    for (const convo of conversations) {
      const metadata = {
        seed_tag: SEED_TAG,
        created_by_user_id: String(userId),
        topic: convo.topic,
      };

      const threadId = await upsertThread({
        externalId: convo.externalId,
        appSource,
        title: convo.title,
        context: convo.context,
        memoriaIndexId,
        memoriaSubindexId,
        metadata,
      });

      if (!threadId) {
        continue;
      }

      threadsTouched += 1;

      for (const turn of convo.turns) {
        const externalTurnId = `${convo.externalId}:${turn.turnIndex}:seed`;

        const turnId = await upsertTurn({
          threadId,
          externalTurnId,
          turnIndex: turn.turnIndex,
          userText: turn.userText,
          assistantThinkingSummary: turn.assistantThinkingSummary,
          assistantSynthesis: turn.assistantSynthesis,
          codeSummary: turn.codeSummary,
          assistantResponse: turn.assistantResponse,
          rawMessages: [
            { role: "user", content: turn.userText },
            { role: "assistant", content: turn.assistantResponse },
          ],
          metadata: {
            seed_tag: SEED_TAG,
            created_by_user_id: String(userId),
            topic: convo.topic,
          },
        });

        if (turnId) {
          turnsTouched += 1;
        }

        // Idempotent legacy row: only insert if not already present for this turn.
        const existing = await sql`
          SELECT id
          FROM memory_entries
          WHERE session_context = ${"Memoria Debug Seed"}
            AND user_intent_analysis = ${externalTurnId}
          LIMIT 1
        `;

        if (existing?.length) {
          continue;
        }

        const transcript = `User: ${turn.userText}\nAssistant: ${turn.assistantResponse}`;

        const legacyContent = buildLegacyContent({
          title: convo.title,
          externalId: convo.externalId,
          indexKey,
          subindexKey,
          transcript,
          turnIndex: turn.turnIndex,
          userText: turn.userText,
          assistantThinkingSummary: turn.assistantThinkingSummary,
          assistantSynthesis: turn.assistantSynthesis,
          codeSummary: turn.codeSummary,
          assistantResponse: turn.assistantResponse,
          includeFiveLayer: true,
        });

        await sql`
          INSERT INTO memory_entries (
            sub_index_cluster_id,
            content,
            reasoning_chain,
            user_intent_analysis,
            cross_domain_connections,
            session_context,
            usage_frequency
          ) VALUES (
            ${null},
            ${legacyContent},
            ${"Seeded Memoria conversation"},
            ${externalTurnId},
            ${["memoria", "seed", convo.topic]},
            ${"Memoria Debug Seed"},
            ${0}
          )
        `;

        legacyEntriesInserted += 1;
      }
    }

    return Response.json({
      ok: true,
      seed_tag: SEED_TAG,
      app_source: appSource,
      indexKey,
      subindexKey,
      threads_touched: threadsTouched,
      turns_touched: turnsTouched,
      legacy_memory_entries_inserted: legacyEntriesInserted,
      note: "Seed is safe to run multiple times (it upserts threads/turns and avoids duplicate legacy rows).",
    });
  } catch (e) {
    console.error("/api/memoria/debug/seed error:", e);
    return Response.json(
      { ok: false, error: e?.message || "Failed to seed" },
      { status: 500 },
    );
  }
}
