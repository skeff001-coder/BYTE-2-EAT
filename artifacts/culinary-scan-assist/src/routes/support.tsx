import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/support")({
  component: SupportPage,
});

function SupportPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-2">Byte 2 Eat — Support</h1>
      <p className="text-muted-foreground mb-6">We are happy to help with any questions about the app.</p>

      <section className="rounded-2xl bg-card p-5 mb-4 ring-1 ring-border">
        <h2 className="font-bold text-foreground mb-2">Contact Us</h2>
        <p className="text-sm text-muted-foreground">Email: <a href="mailto:support@byte2eat.app" className="text-primary">support@byte2eat.app</a></p>
        <p className="text-sm text-muted-foreground mt-1">We aim to respond within 1–2 business days.</p>
      </section>

      <section className="rounded-2xl bg-card p-5 mb-4 ring-1 ring-border">
        <h2 className="font-bold text-foreground mb-3">Frequently Asked Questions</h2>

        <h3 className="font-semibold text-sm text-foreground mt-3">How do I scan my fridge?</h3>
        <p className="text-sm text-muted-foreground mt-1">Tap the <strong>Scan My Fridge</strong> button on the home screen. Use your camera or upload a photo. The AI will detect ingredients and suggest recipes.</p>

        <h3 className="font-semibold text-sm text-foreground mt-3">How many free scans do I get?</h3>
        <p className="text-sm text-muted-foreground mt-1">New users receive <strong>1 free scan</strong>. After that, top up with a scan pack whenever you need more.</p>

        <h3 className="font-semibold text-sm text-foreground mt-3">How do I get more scans?</h3>
        <p className="text-sm text-muted-foreground mt-1">When your scans run out, a screen appears with three options: <strong>Single Scan Top-up (£0.99, expires in 30 days)</strong>, <strong>Monthly Premium 10 Scans (£4.99, expires in 1 month)</strong>, or <strong>30 Scan Saver Pack (£11.99, expires in 3 months)</strong>. Use your scans before they expire.</p>

        <h3 className="font-semibold text-sm text-foreground mt-3">How do I restore my purchase?</h3>
        <p className="text-sm text-muted-foreground mt-1">Go to <strong>Settings → Restore Purchases</strong> inside the app.</p>

        <h3 className="font-semibold text-sm text-foreground mt-3">How do I delete my account?</h3>
        <p className="text-sm text-muted-foreground mt-1">Go to <strong>Settings → Delete Account</strong>. This permanently deletes your account and all data.</p>

        <h3 className="font-semibold text-sm text-foreground mt-3">Do I need an account?</h3>
        <p className="text-sm text-muted-foreground mt-1">No — you can scan and get recipes without an account. An account is only needed to save favourites across devices.</p>
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <h2 className="font-bold text-foreground mb-2">Privacy &amp; Legal</h2>
        <p className="text-sm text-muted-foreground">Email: <a href="mailto:privacy@byte2eat.app" className="text-primary">privacy@byte2eat.app</a></p>
      </section>
    </main>
  );
}
