export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-zinc-300 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold text-zinc-100">Privacy Policy</h1>
      <p className="text-zinc-400">Last updated: February 28, 2026</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-200">What This App Does</h2>
        <p>
          AutoPin is a personal Pinterest automation tool that connects to your Google Drive
          and Pinterest accounts to help you schedule and post pins.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-200">Data We Access</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Google Drive:</strong> Read-only access to image files in a folder you specify.</li>
          <li><strong>Pinterest:</strong> Access to create pins and read your boards.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-200">How Data Is Stored</h2>
        <p>
          OAuth tokens and image metadata are stored securely in a private Supabase database.
          Images are temporarily cached in Supabase Storage for posting. No data is shared
          with third parties beyond the APIs required to operate (Google, Pinterest, Anthropic).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-200">Contact</h2>
        <p>For questions, reach out to the app owner directly.</p>
      </section>
    </div>
  );
}
