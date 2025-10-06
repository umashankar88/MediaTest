import React, { useMemo, useState } from "react";

/**
 * Live Prompt Generator (No external UI deps)
 * - Replaces Funnel Stage with Campaign Goal
 * - Works in plain CRA/Vite/Next without aliases or UI libraries
 * - Includes prompt builder + simple live previews
 */

const tones = [
  "Confident",
  "Friendly",
  "Cheeky",
  "Luxury / Premium",
  "Scientific / Clinical",
  "Warm & Caring",
  "Bold & Energetic",
  "Minimal & Calm",
];

const frameworks = [
  "PAS (Problem-Agitate-Solution)",
  "AIDA",
  "FAB",
  "Testimonial",
  "Story",
  "Before-After-Bridge",
  "FAQ",
];

const headlineStyles = [
  "Curiosity",
  "Problem-led",
  "Numbered / Listicle",
  "Testimonial-style",
  "Benefit-first",
  "Urgency / FOMO",
  "Contrarian / Pattern-break",
];

const languages = ["English", "Hinglish", "Hindi", "Bengali", "Gujarati", "Marathi", "Tamil", "Telugu"];

const campaignGoals = ["Awareness", "Engagement", "Sales", "Lead Generation", "Retargeting"];

// ------- small utils -------
const sanitize = (s, fallback) => (s && s.trim() ? s.trim() : fallback);
const splitUSPs = (u) =>
  (u || "")
    .split(/[;\n,]/)
    .map((x) => x.trim())
    .filter(Boolean);
const pick = (arr, i) => arr[i % arr.length];
const truncateWords = (text, maxWords) => {
  const words = (text || "").split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, Math.max(3, maxWords)).join(" ") + "…";
};
const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export default function LivePromptGenerator() {
  const [mode, setMode] = useState("adcopy"); // "adcopy" | "headlines"

  // Inputs
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [brand, setBrand] = useState("");
  const [offer, setOffer] = useState("");
  const [uniquePoints, setUniquePoints] = useState("");
  const [proof, setProof] = useState("");
  const [platform, setPlatform] = useState("Meta (Facebook + Instagram)");
  const [tone, setTone] = useState(tones[0]);
  const [framework, setFramework] = useState(frameworks[0]);
  const [headStyle, setHeadStyle] = useState(headlineStyles[0]);
  const [language, setLanguage] = useState(languages[0]);
  const [campaignGoal, setCampaignGoal] = useState(campaignGoals[0]);

  // Options
  const [wordLimit, setWordLimit] = useState(40);
  const [headlineCount, setHeadlineCount] = useState(5);
  const [variantCount, setVariantCount] = useState(3);
  const [includeEmojis, setIncludeEmojis] = useState(false);
  const [includeCTA, setIncludeCTA] = useState(true);
  const [includeHashtags, setIncludeHashtags] = useState(false);
  const [forceSimple, setForceSimple] = useState(true);
  const [addHooks, setAddHooks] = useState(true);
  const [negativeList, setNegativeList] = useState("No clickbait. No false claims. Avoid medical claims. Keep compliant for Meta.");
  const [ctaText, setCtaText] = useState("Shop Now");
  const [seed, setSeed] = useState("");

  // Headlines
  const [headlineLength, setHeadlineLength] = useState(6);

  // TOC
  const [includeTOC, setIncludeTOC] = useState(false);
  const [tocRatio, setTocRatio] = useState("1:1, 4:5, 9:16");

  // Brand voice
  const [brandVoiceRules, setBrandVoiceRules] = useState("");

  const safe = (label, value) => (value && value.trim() ? `**${label}:** ${value.trim()}\n` : "");

  const promptHeader = useMemo(() => {
    return `Act as a senior performance copywriter for D2C brands. Your task is to write high-converting ${
      mode === "adcopy" ? "Meta ad copy" : "Meta ad headlines"
    } for ${brand || "[Brand]"}. Audience is ${audience || "[target persona]"}. Use a ${tone.toLowerCase()} tone in ${language}. Platform: ${platform}. Campaign Goal: ${campaignGoal}.`;
  }, [mode, brand, audience, tone, language, platform, campaignGoal]);

  const constraints = useMemo(() => {
    const lines = [];
    if (forceSimple) lines.push("Keep reading level simple (Grade 5). Use short sentences.");
    if (includeEmojis) lines.push("Use tasteful emojis sparingly.");
    if (includeCTA && ctaText) lines.push(`End with a strong CTA: "${ctaText}".`);
    if (includeHashtags) lines.push("Add 3-5 relevant, non-spammy hashtags at the end.");
    lines.push(`Soft word limit: ~${wordLimit} words.`);
    lines.push(`Avoid: ${negativeList}`);
    return lines.map((l) => `- ${l}`).join("\n");
  }, [forceSimple, includeEmojis, includeCTA, includeHashtags, ctaText, wordLimit, negativeList]);

  const buildAdcopyInstruction = () => {
    const seedLine = seed && seed.trim() ? `\nInspiration seed (rewrite & improve, not verbatim): ${seed.trim()}` : "";
    return [
      promptHeader,
      "\n\nPRODUCT CONTEXT\n" +
        safe("Product", product) +
        safe("Offer", offer) +
        safe("Unique Selling Points (USPs)", uniquePoints) +
        safe("Proof / Social Proof", proof) +
        (brandVoiceRules && brandVoiceRules.trim() ? safe("Brand Voice", brandVoiceRules) : ""),
      "\nOUTPUT REQUIREMENTS\n" +
        `- Write ${variantCount} ad copy variations for Meta.` +
        `\n- Use ${framework}.` +
        (addHooks ? `\n- Start each variation with a strong HOOK.` : "") +
        (includeTOC ? `\n- Also provide a short Text-On-Creative (TOC) line (max 8 words) per variation, with aspect ratios ${tocRatio}.` : "") +
        `\n- ${constraints}` +
        `\n- Avoid headlines here. Focus on body copy.` +
        (seedLine || ""),
    ].join("");
  };

  const buildHeadlineInstruction = () => {
    const seedLine = seed && seed.trim() ? `\nInspiration seed (rewrite & improve, not verbatim): ${seed.trim()}` : "";
    return [
      promptHeader,
      "\n\nPRODUCT CONTEXT\n" +
        safe("Product", product) +
        safe("Offer", offer) +
        safe("Unique Selling Points (USPs)", uniquePoints) +
        safe("Proof / Social Proof", proof) +
        (brandVoiceRules && brandVoiceRules.trim() ? safe("Brand Voice", brandVoiceRules) : ""),
      "\nOUTPUT REQUIREMENTS\n" +
        `- Generate ${headlineCount} headline options in the "${headStyle}" style.` +
        `\n- Target headline length: ~${headlineLength} words.` +
        `\n- Keep headlines punchy and platform-safe. No excessive punctuation.` +
        `\n- ${constraints}` +
        (seedLine || ""),
    ].join("");
  };

  const prompt = useMemo(
    () => (mode === "adcopy" ? buildAdcopyInstruction() : buildHeadlineInstruction()),
    [
      mode,
      brand,
      audience,
      tone,
      language,
      platform,
      product,
      offer,
      uniquePoints,
      proof,
      brandVoiceRules,
      includeTOC,
      tocRatio,
      constraints,
      framework,
      addHooks,
      variantCount,
      seed,
      headlineCount,
      headStyle,
      headlineLength,
      campaignGoal,
    ]
  );

  // -------- live previews (local mocks) --------
  const mockHooksByGoal = {
    Awareness: ["Meet your new go‑to.", "What if skincare just worked?", "The secret’s out.", "This changes your routine."],
    Engagement: ["Try the 10‑sec test.", "Pick your fave in 3 taps.", "Would you switch for this?", "Tell us: gel or cream?"],
    Sales: ["Your upgrade starts today.", "Save on your best skin.", "Cart’s waiting for you.", "Claim your offer now."],
    "Lead Generation": ["Grab your free guide.", "Get a sample—no risk.", "Join thousands learning this.", "Unlock the checklist."],
    Retargeting: ["Still thinking it over?", "You left something behind.", "Price dropped. Tap in.", "The best time is now."],
  };

  const emojisMaybe = (...arr) => (includeEmojis ? " " + arr.join(" ") : "");
  const makeCTA = () => (includeCTA ? `${ctaText || "Shop Now"}${emojisMaybe("→")}` : "");
  const mockProof = (p) => {
    if (!p || !p.trim()) return "";
    const first = p
      .split(/[.;\n]/)
      .map((x) => x.trim())
      .filter(Boolean)[0];
    return first || p.trim();
  };

  const adPreview = useMemo(() => {
    const prod = sanitize(product, "[Product]");
    const hooks = mockHooksByGoal[campaignGoal] || mockHooksByGoal["Awareness"];
    const usps = splitUSPs(uniquePoints);
    const proofLine = mockProof(proof);
    const n = Math.max(1, Math.min(10, variantCount));

    const bodyByFramework = (fw) => {
      const firstUSP = usps[0] || "targeted actives";
      const secondUSP = usps[1] || "clean formula";
      const thirdUSP = usps[2] || "visible results";
      const benefitLine = `Built around ${firstUSP.toLowerCase()}.`;
      const proofBit = proofLine ? ` ${proofLine}.` : "";
      const salesNudge =
        campaignGoal === "Sales" || campaignGoal === "Retargeting"
          ? ` ${offer ? `Offer: ${offer}. ` : ""}Limited time—don’t miss it.`
          : "";

      switch (fw) {
        case "PAS (Problem-Agitate-Solution)":
          return `Tired of settling? ${prod} fixes it. ${benefitLine} ${secondUSP ? `Plus, ${secondUSP.toLowerCase()}. ` : ""}${proofBit}${salesNudge}`;
        case "AIDA":
          return `Discover ${prod}. ${benefitLine} ${thirdUSP ? `Also: ${thirdUSP.toLowerCase()}. ` : ""}${proofBit}${salesNudge}`;
        case "FAB":
          return `Features: ${usps.slice(0, 2).join(", ")}. Advantage: better daily results. Benefit: feel the difference from day one.${proofBit}${salesNudge}`;
        case "Testimonial":
          return `"I switched to ${prod} and never looked back." ${benefitLine}${proofBit}${salesNudge}`;
        case "Story":
          return `Day 1 with ${prod}: noticeable change. Day 7: habit. Day 30: you won’t go back. ${benefitLine}${proofBit}${salesNudge}`;
        case "Before-After-Bridge":
          return `Before: inconsistent results. After: calm, predictable outcomes. Bridge: ${prod} with ${firstUSP}.${proofBit}${salesNudge}`;
        case "FAQ":
          return `Q: Will ${prod} work for me?\nA: If you value ${firstUSP}, yes. ${secondUSP ? `It’s also ${secondUSP.toLowerCase()}. ` : ""}${proofBit}${salesNudge}`;
        default:
          return `Meet ${prod}. ${benefitLine}${proofBit}${salesNudge}`;
      }
    };

    return Array.from({ length: n }, (_, i) => {
      const hook = addHooks ? pick(hooks, i) : "";
      let out = [hook, bodyByFramework(framework)].filter(Boolean).join(" ");
      out = truncateWords(out, Math.max(15, Math.min(60, wordLimit)));
      if (includeCTA) out += ` ${makeCTA()}`;
      if (includeHashtags) out += ` #${(brand || "YourBrand").replace(/\s+/g, "")} #${campaignGoal.replace(/\s+/g, "")}`;
      const toc = includeTOC ? truncateWords(hook || `${prod}—${campaignGoal}`, 8) : "";
      return { hook, body: out, toc };
    });
  }, [
    addHooks,
    brand,
    campaignGoal,
    ctaText,
    framework,
    includeCTA,
    includeHashtags,
    includeTOC,
    offer,
    product,
    proof,
    uniquePoints,
    variantCount,
    wordLimit,
  ]);

  const headlineStartersByStyle = {
    Curiosity: ["What if", "The one thing", "You won’t believe", "Nobody told you"],
    "Problem-led": ["Tired of", "Done with", "Struggling with", "Sick of"],
    "Numbered / Listicle": ["3 reasons", "5 ways", "Top 7", "The 2-step"],
    "Testimonial-style": ['"I switched to"', '"Finally, a"', '"I never knew"', '"This is my"'],
    "Benefit-first": ["Instant glow", "Faster relief", "Longer wear", "Smoother days"],
    "Urgency / FOMO": ["Ends soon", "Last chance", "Don’t miss", "Price drop"],
    "Contrarian / Pattern-break": ["Stop overpaying", "Skip the hype", "Do less, get more", "Rethink routine"],
  };

  const headlinesPreview = useMemo(() => {
    const prod = sanitize(product, "[Product]");
    const n = Math.max(3, Math.min(20, headlineCount));
    const starters = headlineStartersByStyle[headStyle] || headlineStartersByStyle["Benefit-first"];
    const goalTag = campaignGoal === "Sales" ? offer || "Save today" : campaignGoal;

    return Array.from({ length: n }, (_, i) => {
      const start = pick(starters, i);
      const raw = `${start} ${prod.toLowerCase()} — ${goalTag}`;
      const hl = truncateWords(raw, Math.max(2, Math.min(12, headlineLength)));
      return hl.replace(/\s—\s$/, "");
    });
  }, [product, headlineCount, headStyle, headlineLength, campaignGoal, offer]);

  // Clipboard UI state
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.h1}>Live Prompt Generator</h1>
            <p style={styles.muted}>Build high-converting Meta ad copy & headlines with structured prompts — now with a live preview.</p>
          </div>
          <div style={styles.row}>
            <button
              style={styles.buttonPrimary}
              onClick={async () => {
                const ok = await copyText(prompt);
                setCopied(ok);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "✓ Copied!" : "Copy Prompt"}
            </button>
            <button
              style={styles.button}
              onClick={() => {
                const blob = new Blob([prompt], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `prompt-${mode}-${Date.now()}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download
            </button>
          </div>
        </header>

        {/* tabs */}
        <div style={styles.tabs}>
          <button style={mode === "adcopy" ? styles.tabActive : styles.tab} onClick={() => setMode("adcopy")}>
            Ad Copy
          </button>
          <button style={mode === "headlines" ? styles.tabActive : styles.tab} onClick={() => setMode("headlines")}>
            Headlines
          </button>
        </div>

        {/* AD COPY */}
        {mode === "adcopy" && (
          <div style={styles.grid}>
            <div style={styles.card}>
              <h2 style={styles.h2}>Core Inputs</h2>
              <div style={styles.gridTwo}>
                <TextField label="Brand" value={brand} setValue={setBrand} placeholder="e.g., The Pink Foundry" />
                <TextField label="Product" value={product} setValue={setProduct} placeholder="e.g., 1% Pure Ceramide Moisturiser" />
                <TextField label="Audience Persona" value={audience} setValue={setAudience} placeholder="e.g., Women 22–35, oily/acne-prone" />
                <TextField label="Offer (optional)" value={offer} setValue={setOffer} placeholder="e.g., 20% Off + Free Mini" />
              </div>
              <div style={styles.gridTwo}>
                <TextareaField
                  label="USPs"
                  value={uniquePoints}
                  setValue={setUniquePoints}
                  placeholder="e.g., 3:1:1 ceramide ratio; fragrance-free; made for Indian climate"
                />
                <TextareaField
                  label="Proof (social proof, stats, awards)"
                  value={proof}
                  setValue={setProof}
                  placeholder="e.g., 5,000+ reviews; dermat-recommended; clinical study"
                />
              </div>

              <hr style={styles.hr} />

              <h2 style={styles.h2}>Style & Strategy</h2>
              <div style={styles.gridTwo}>
                <SelectField label="Tone" value={tone} setValue={setTone} options={tones} />
                <SelectField label="Framework" value={framework} setValue={setFramework} options={frameworks} />
                <SelectField label="Language" value={language} setValue={setLanguage} options={languages} />
                <SelectField label="Campaign Goal" value={campaignGoal} setValue={setCampaignGoal} options={campaignGoals} />
              </div>

              <hr style={styles.hr} />

              <h2 style={styles.h2}>Constraints & Options</h2>
              <div style={styles.gridTwo}>
                <RangeField label={`Word Limit (~${wordLimit} words)`} value={wordLimit} setValue={setWordLimit} min={20} max={120} step={5} />
                <NumberField label="# of Variations" value={variantCount} setValue={setVariantCount} min={1} max={10} />
              </div>
              <div style={styles.gridThree}>
                <SwitchField label="Start with a HOOK" checked={addHooks} setChecked={setAddHooks} />
                <SwitchField label="Include CTA" checked={includeCTA} setChecked={setIncludeCTA} />
                <SwitchField label="Use Emojis" checked={includeEmojis} setChecked={setIncludeEmojis} />
                <SwitchField label="Add Hashtags" checked={includeHashtags} setChecked={setIncludeHashtags} />
                <SwitchField label="Simple Language" checked={forceSimple} setChecked={setForceSimple} />
                <SwitchField label="Also generate TOC line" checked={includeTOC} setChecked={setIncludeTOC} />
              </div>
              <div style={styles.gridTwo}>
                {includeCTA && <TextField label="CTA Text" value={ctaText} setValue={setCtaText} placeholder="e.g., Shop Now, Try It Today" />}
                {includeTOC && <TextField label="TOC Aspect Ratios" value={tocRatio} setValue={setTocRatio} placeholder="e.g., 1:1, 4:5, 9:16" />}
              </div>

              <TextareaField
                label="Brand Voice Rules (optional)"
                value={brandVoiceRules}
                setValue={setBrandVoiceRules}
                placeholder="e.g., Avoid slang, emphasize science, always mention ‘for Indian skin’"
              />
              <TextareaField label="Negative / Compliance Notes" value={negativeList} setValue={setNegativeList} />

              <hr style={styles.hr} />

              <TextareaField label="Inspiration Seed (optional)" value={seed} setValue={setSeed} placeholder="Paste a rough draft or past winner to iterate" />
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div style={styles.card}>
                <h2 style={styles.h2}>Generated Prompt</h2>
                <textarea readOnly value={prompt} style={styles.bigTextarea} />
                <button
                  style={styles.buttonPrimary}
                  onClick={async () => {
                    const ok = await copyText(prompt);
                    setCopied(ok);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? "✓ Copied!" : "Copy Prompt"}
                </button>
              </div>

              <div style={styles.card}>
                <h2 style={styles.h2}>Live Preview — Ad Copy</h2>
                <div style={{ display: "grid", gap: 8 }}>
                  {adPreview.map((v, idx) => (
                    <div key={idx} style={styles.previewCard}>
                      <div style={styles.previewHead}>
                        <span style={styles.badge}>Variation {idx + 1}</span>
                        <button
                          style={styles.button}
                          onClick={async () => {
                            const ok = await copyText(v.body + (v.toc ? `\nTOC: ${v.toc}` : ""));
                            setCopiedIndex(ok ? idx : null);
                            setTimeout(() => setCopiedIndex(null), 1000);
                          }}
                        >
                          {copiedIndex === idx ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                      <p style={styles.copy}>{v.body}</p>
                      {v.toc ? (
                        <p style={styles.toc}>
                          <b>TOC:</b> {v.toc}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
                <Tips />
              </div>
            </div>
          </div>
        )}

        {/* HEADLINES */}
        {mode === "headlines" && (
          <div style={styles.grid}>
            <div style={styles.card}>
              <h2 style={styles.h2}>Core Inputs</h2>
              <div style={styles.gridTwo}>
                <TextField label="Brand" value={brand} setValue={setBrand} placeholder="e.g., Auli" />
                <TextField label="Product" value={product} setValue={setProduct} placeholder="e.g., Collagen Mask" />
                <TextField label="Audience Persona" value={audience} setValue={setAudience} placeholder="e.g., Women 25–40, dry skin" />
                <TextField label="Offer (optional)" value={offer} setValue={setOffer} placeholder="e.g., Buy 2 Get 1" />
              </div>
              <div style={styles.gridTwo}>
                <TextareaField label="USPs" value={uniquePoints} setValue={setUniquePoints} placeholder="e.g., Visible plump in 15 mins" />
                <TextareaField label="Proof / Social Proof" value={proof} setValue={setProof} placeholder="e.g., Derm-approved; 100+ creators used" />
              </div>

              <hr style={styles.hr} />

              <h2 style={styles.h2}>Style & Strategy</h2>
              <div style={styles.gridTwo}>
                <SelectField label="Tone" value={tone} setValue={setTone} options={tones} />
                <SelectField label="Headline Style" value={headStyle} setValue={setHeadStyle} options={headlineStyles} />
                <SelectField label="Language" value={language} setValue={setLanguage} options={languages} />
                <SelectField label="Campaign Goal" value={campaignGoal} setValue={setCampaignGoal} options={campaignGoals} />
              </div>

              <hr style={styles.hr} />

              <h2 style={styles.h2}>Constraints & Options</h2>
              <div style={styles.gridTwo}>
                <RangeField
                  label={`Target Headline Length (~${headlineLength} words)`}
                  value={headlineLength}
                  setValue={setHeadlineLength}
                  min={2}
                  max={12}
                  step={1}
                />
                <NumberField label="# of Headlines" value={headlineCount} setValue={setHeadlineCount} min={3} max={20} />
              </div>

              <TextareaField label="Brand Voice Rules (optional)" value={brandVoiceRules} setValue={setBrandVoiceRules} placeholder="e.g., No slang; crisp & authoritative" />
              <TextareaField label="Negative / Compliance Notes" value={negativeList} setValue={setNegativeList} />
              <TextareaField label="Inspiration Seed (optional)" value={seed} setValue={setSeed} placeholder="Paste a rough idea to improve" />
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div style={styles.card}>
                <h2 style={styles.h2}>Generated Prompt</h2>
                <textarea readOnly value={prompt} style={styles.bigTextarea} />
                <button
                  style={styles.buttonPrimary}
                  onClick={async () => {
                    const ok = await copyText(prompt);
                    setCopied(ok);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? "✓ Copied!" : "Copy Prompt"}
                </button>
              </div>

              <div style={styles.card}>
                <h2 style={styles.h2}>Live Preview — Headlines</h2>
                <div style={{ display: "grid", gap: 8 }}>
                  {headlinesPreview.map((h, idx) => (
                    <div key={idx} style={styles.previewRow}>
                      <span>{h}</span>
                      <button
                        style={styles.button}
                        onClick={async () => {
                          const ok = await copyText(h);
                          setCopiedIndex(ok ? idx : null);
                          setTimeout(() => setCopiedIndex(null), 1000);
                        }}
                      >
                        {copiedIndex === idx ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>
                <Tips headlinesMode />
              </div>
            </div>
          </div>
        )}

        <footer style={styles.footer}>Built for Marketing Lab • Standardize briefs, preview output quality, and speed up testing.</footer>
      </div>
    </div>
  );
}

// ----------- tiny UI bits -----------
function TextField({ label, value, setValue, placeholder }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} style={styles.input} />
    </label>
  );
}
function TextareaField({ label, value, setValue, placeholder }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} style={styles.textarea} />
    </label>
  );
}
function SelectField({ label, value, setValue, options }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <select value={value} onChange={(e) => setValue(e.target.value)} style={styles.input}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
function NumberField({ label, value, setValue, min = 1, max = 10 }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => setValue(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
        style={styles.input}
      />
    </label>
  );
}
function RangeField({ label, value, setValue, min = 0, max = 100, step = 1 }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => setValue(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </label>
  );
}
function SwitchField({ label, checked, setChecked }) {
  return (
    <label style={styles.switchRow}>
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
    </label>
  );
}
function Tips({ headlinesMode = false }) {
  return (
    <div style={styles.tipBox}>
      <strong>Tips</strong>
      <ul style={styles.ul}>
        {headlinesMode ? (
          <>
            <li>Keep it under ~6–8 words for thumb-stopping clarity.</li>
            <li>Match headline style to the campaign goal (e.g., curiosity for Awareness, urgency/offer for Sales).</li>
            <li>Avoid excessive punctuation, ALL CAPS, or clickbait.</li>
            <li>Test at least 5–10 headlines per creative. Kill underperformers fast.</li>
          </>
        ) : (
          <>
            <li>Lead with a human problem or desire, then bridge to your USP.</li>
            <li>Keep sentences short. Aim for Grade-5 readability.</li>
            <li>Make one point well; don’t cram.</li>
            <li>Ensure the first 2 lines work as standalone hooks on mobile.</li>
          </>
        )}
      </ul>
    </div>
  );
}

// ----------- styles (inline) -----------
const styles = {
  page: { background: "#fff", color: "#111", minHeight: "100vh", padding: 24 },
  container: { maxWidth: 1100, margin: "0 auto", display: "grid", gap: 16 },
  header: { display: "flex", gap: 12, alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap" },
  h1: { fontSize: 28, fontWeight: 800, margin: 0 },
  h2: { fontSize: 18, fontWeight: 700, margin: "0 0 8px" },
  muted: { fontSize: 12, color: "#666" },
  button: { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10, background: "#fff", cursor: "pointer" },
  buttonPrimary: { padding: "8px 12px", borderRadius: 10, background: "#111", color: "#fff", border: "1px solid #111", cursor: "pointer" },
  row: { display: "flex", gap: 8, alignItems: "center" },
  tabs: { display: "flex", gap: 8 },
  tab: { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10, background: "#fff", cursor: "pointer" },
  tabActive: { padding: "8px 12px", border: "1px solid #111", borderRadius: 10, background: "#111", color: "#fff", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  gridTwo: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  gridThree: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },
  card: { border: "1px solid #eee", borderRadius: 14, padding: 16 },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 12, color: "#555" },
  input: { padding: 10, border: "1px solid #ddd", borderRadius: 10 },
  textarea: { padding: 10, border: "1px solid #ddd", borderRadius: 10, minHeight: 90, fontFamily: "inherit" },
  bigTextarea: { width: "100%", minHeight: 200, padding: 10, border: "1px solid #ddd", borderRadius: 10, fontFamily: "inherit", fontSize: 12 },
  previewCard: { border: "1px solid #eee", borderRadius: 10, padding: 12 },
  previewHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  badge: { fontSize: 11, color: "#666" },
  copy: { fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-line", margin: 0 },
  toc: { fontSize: 12, color: "#555", marginTop: 8 },
  previewRow: { border: "1px solid #eee", borderRadius: 10, padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center" },
  tipBox: { background: "#f7f7f7", borderRadius: 10, padding: 10, fontSize: 12, color: "#333", marginTop: 8 },
  ul: { margin: "6px 0 0 16px" },
  hr: { border: 0, borderTop: "1px solid #eee", margin: "12px 0" },
  footer: { fontSize: 11, color: "#666", textAlign: "center", paddingTop: 8, paddingBottom: 24 },
};
