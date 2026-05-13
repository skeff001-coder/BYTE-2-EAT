import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, FileText } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/legal")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab === "terms" ? "terms" : "privacy") as "privacy" | "terms",
  }),
  component: LegalPage,
});

function LegalPage() {
  const { tab: initialTab } = Route.useSearch();
  const [tab, setTab] = useState<"privacy" | "terms">(initialTab);

  return (
    <main className="min-h-screen bg-background pb-16">
      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Link
          to="/settings"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">Legal</h1>
      </header>

      <div className="px-5">
        <div className="flex gap-1 rounded-2xl bg-card p-1 ring-1 ring-border mb-6">
          <button
            onClick={() => setTab("privacy")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all ${tab === "privacy" ? "text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
            style={tab === "privacy" ? { background: "var(--gradient-primary)" } : undefined}
          >
            <Shield className="h-3.5 w-3.5" />
            Privacy Policy
          </button>
          <button
            onClick={() => setTab("terms")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all ${tab === "terms" ? "text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
            style={tab === "terms" ? { background: "var(--gradient-primary)" } : undefined}
          >
            <FileText className="h-3.5 w-3.5" />
            Terms &amp; Conditions
          </button>
        </div>

        {tab === "privacy" && <PrivacyPolicy />}
        {tab === "terms" && <TermsOfService />}
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-base font-bold text-foreground mb-2">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function PrivacyPolicy() {
  return (
    <article>
      <p className="text-xs text-muted-foreground mb-6">Last updated: May 2025 · Byte 2 Eat is operated under UK law and this policy complies with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>

      <Section title="1. Who We Are">
        <p>Byte 2 Eat ("we", "us", "our") is an AI-powered recipe application. For data protection enquiries, contact us at <strong>privacy@byte2eat.app</strong>.</p>
      </Section>

      <Section title="2. Data We Collect">
        <p><strong>Account data:</strong> When you register, we collect your email address and a hashed password (managed securely by Supabase Auth).</p>
        <p><strong>Fridge photos:</strong> Photos you take or upload are transmitted securely to our server and then to OpenAI's API for ingredient detection. Fridge images are <strong>never stored</strong> — they are processed in real time and immediately discarded after analysis.</p>
        <p><strong>Ingredient & food data:</strong> The ingredients detected from your scan, along with AI-generated recipes, health scores, and meal plans.</p>
        <p><strong>Scan history:</strong> If you are signed in, we store your scan results (detected ingredients, suggested recipes, and health scores) so you can review past scans.</p>
        <p><strong>Saved recipes:</strong> Recipes you mark as favourites are stored against your account.</p>
        <p><strong>Preferences:</strong> Your selected dietary goal (e.g. Balanced, Vegan, High Protein) is stored locally on your device.</p>
        <p><strong>Usage data:</strong> Standard server logs (request timestamps, IP addresses, error reports) are retained for up to 30 days for security and debugging purposes.</p>
      </Section>

      <Section title="3. How We Use Your Data">
        <p>We use your data solely to provide the Byte 2 Eat service, including:</p>
        <p>• Generating personalised AI recipe suggestions based on your detected ingredients</p>
        <p>• Displaying your scan history and saved favourites</p>
        <p>• Calculating health scores for your fridge contents</p>
        <p>• Sending essential service emails (e.g. account verification)</p>
        <p>We do <strong>not</strong> use your data for advertising, profiling, or sell it to any third party.</p>
      </Section>

      <Section title="4. Legal Basis (UK GDPR)">
        <p><strong>Contract performance (Art. 6(1)(b)):</strong> Processing your account data and fridge scans is necessary to provide the service you signed up for.</p>
        <p><strong>Legitimate interests (Art. 6(1)(f)):</strong> Server security logging and bug monitoring, balanced against your privacy rights.</p>
      </Section>

      <Section title="5. Third Parties We Share Data With">
        <p><strong>OpenAI (USA):</strong> Fridge photos and ingredient lists are sent to OpenAI's GPT-4o API for AI analysis. OpenAI is bound by its own privacy policy and data processing agreement. OpenAI does not use API data to train its models by default. See <strong>openai.com/privacy</strong>.</p>
        <p><strong>Supabase (USA/EU):</strong> We use Supabase for secure database storage and authentication. Supabase is GDPR-compliant and offers Standard Contractual Clauses for international transfers. See <strong>supabase.com/privacy</strong>.</p>
        <p>No other third parties receive your personal data.</p>
      </Section>

      <Section title="6. International Data Transfers">
        <p>Our service providers (OpenAI, Supabase) may process data outside the UK/EEA. Where this occurs, appropriate safeguards (Standard Contractual Clauses or equivalent) are in place in accordance with UK GDPR Chapter V.</p>
      </Section>

      <Section title="7. Data Retention">
        <p>• Account data (email, scan history, favourites): retained until you delete your account.</p>
        <p>• Fridge photos: never stored; discarded immediately after processing.</p>
        <p>• Server logs: retained for 30 days.</p>
        <p>Upon account deletion, all personal data is permanently removed from our systems within 30 days.</p>
      </Section>

      <Section title="8. Your Rights Under UK GDPR">
        <p>You have the right to:</p>
        <p>• <strong>Access</strong> the personal data we hold about you</p>
        <p>• <strong>Rectify</strong> inaccurate data</p>
        <p>• <strong>Erasure</strong> ("right to be forgotten") — delete your account via Settings → Delete Account</p>
        <p>• <strong>Data portability</strong> — receive your data in a structured format</p>
        <p>• <strong>Restrict</strong> processing in certain circumstances</p>
        <p>• <strong>Object</strong> to processing based on legitimate interests</p>
        <p>To exercise any right, use the Delete Account feature in Settings, or email <strong>privacy@byte2eat.app</strong>. We will respond within 30 days. You also have the right to lodge a complaint with the <strong>Information Commissioner's Office (ICO)</strong> at ico.org.uk.</p>
      </Section>

      <Section title="9. Children's Privacy">
        <p>Byte 2 Eat is not intended for children under the age of 13. We do not knowingly collect data from children under 13. If you believe a child has provided us with personal data, please contact privacy@byte2eat.app.</p>
      </Section>

      <Section title="10. Security">
        <p>We use industry-standard security measures including HTTPS encryption, hashed passwords, and row-level security on our database. No method of transmission over the internet is 100% secure, however we take all reasonable steps to protect your data.</p>
      </Section>

      <Section title="11. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notice. The "Last updated" date at the top indicates when this policy was last revised.</p>
      </Section>

      <Section title="12. Contact">
        <p>For any privacy-related questions or to exercise your rights, contact us at <strong>privacy@byte2eat.app</strong>.</p>
      </Section>
    </article>
  );
}

function TermsOfService() {
  return (
    <article>
      <p className="text-xs text-muted-foreground mb-6">Last updated: May 2025 · These Terms govern your use of the Byte 2 Eat application. By using the app, you agree to these Terms. If you do not agree, please do not use the app.</p>

      <Section title="1. The Service">
        <p>Byte 2 Eat is an AI-powered application that analyses photos of your fridge and suggests recipes based on the detected ingredients. The service is provided on an "as is" basis.</p>
      </Section>

      <Section title="2. Eligibility">
        <p>You must be at least 13 years old to use Byte 2 Eat. By using the app, you confirm you meet this requirement.</p>
      </Section>

      <Section title="3. Premium Access — £4.99 One-Time Purchase">
        <p>Byte 2 Eat offers a one-time Premium upgrade for <strong>£4.99</strong>, which unlocks:</p>
        <p>• Unlimited fridge scans</p>
        <p>• AI recipe suggestions (unrestricted)</p>
        <p>• Personalised meal plans</p>
        <p>• Auto shopping lists</p>
        <p>• Health scores &amp; tips</p>
        <p>Payment is charged to your Apple ID at the time of purchase. Premium access is tied to your Apple ID and can be restored on any device signed in to the same Apple ID using the "Restore Purchases" button.</p>
        <p>Refunds are subject to Apple's standard refund policy. Contact Apple Support to request a refund.</p>
      </Section>

      <Section title="4. Free Trial">
        <p>New users receive <strong>one free fridge scan</strong> upon downloading the app. After the free scan is used, a Premium subscription is required to continue scanning.</p>
      </Section>

      <Section title="5. Health Disclaimer — Important">
        <p>⚠️ <strong>The health scores, nutritional information, meal plans, and dietary tips provided by Byte 2 Eat are for informational and entertainment purposes only. They do not constitute medical advice, nutritional counselling, or professional dietary guidance.</strong></p>
        <p>Byte 2 Eat is not a medical device and has not been evaluated by the Medicines and Healthcare products Regulatory Agency (MHRA) or any other regulatory authority.</p>
        <p>Always consult a qualified healthcare professional, registered dietitian, or your GP before making significant changes to your diet, particularly if you have a medical condition, food allergy, or are pregnant.</p>
        <p>Never disregard professional medical advice or delay seeking it because of something you have read in this app.</p>
      </Section>

      <Section title="6. AI-Generated Content">
        <p>Recipes, ingredient detection, meal plans, and health scores are generated by artificial intelligence and may contain errors or inaccuracies. Always use your own judgement when preparing food, check for allergens, and ensure ingredients are safe before consumption.</p>
        <p>We are not responsible for any adverse effects resulting from following AI-generated recipes or dietary advice.</p>
      </Section>

      <Section title="7. Acceptable Use">
        <p>You agree not to:</p>
        <p>• Use the service for any unlawful purpose</p>
        <p>• Attempt to reverse-engineer, scrape, or abuse the API</p>
        <p>• Upload images that are not of food or fridges</p>
        <p>• Share your account credentials with others</p>
      </Section>

      <Section title="8. Intellectual Property">
        <p>The Byte 2 Eat name, logo, and app design are the intellectual property of Byte 2 Eat. AI-generated recipes produced by the app during your use are provided to you for personal, non-commercial use.</p>
      </Section>

      <Section title="9. Limitation of Liability">
        <p>To the maximum extent permitted by law, Byte 2 Eat shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the app, including but not limited to health outcomes, food waste, or reliance on AI-generated content.</p>
        <p>Our total liability to you shall not exceed the amount you paid for Premium access.</p>
      </Section>

      <Section title="10. Governing Law">
        <p>These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
      </Section>

      <Section title="11. Changes to These Terms">
        <p>We may update these Terms from time to time. Continued use of the app after changes constitutes acceptance of the revised Terms. We will notify you of material changes via email or in-app notice.</p>
      </Section>

      <Section title="12. Contact">
        <p>For any questions about these Terms, contact us at <strong>support@byte2eat.app</strong>.</p>
      </Section>
    </article>
  );
}
