export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <div className="text-2xl font-bold tracking-tight text-indigo-600">MUNIX</div>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <a href="#features" className="hover:text-indigo-600 transition">Features</a>
          <a href="#pricing" className="hover:text-indigo-600 transition">Pricing</a>
          <a href="#docs" className="hover:text-indigo-600 transition">Documentation</a>
          <a href="#about" className="hover:text-indigo-600 transition">About</a>
        </div>
        <div className="flex items-center gap-3">
          <a href="/sign-in" className="text-sm text-gray-600 hover:text-indigo-600 transition">Login</a>
          <a href="/sign-up" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">Get Started</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-28 bg-gradient-to-b from-indigo-50 to-white">
        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-4 bg-indigo-100 px-3 py-1 rounded-full">
          Business & Project Management
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight max-w-4xl">
          Manage Everything.<br />
          <span className="text-indigo-600">From One Place.</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-2xl">
          MUNIX gives businesses, teams, and project managers a powerful workspace to collaborate, track progress, manage people, and grow — all in one platform.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <a href="/sign-up" className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
            Get Started Free
          </a>
          <a href="#features" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-sm font-semibold hover:border-indigo-400 transition">
            See How It Works
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-24 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Everything You Need</h2>
        <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
          Built for organizations, businesses, and project teams of all sizes.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: "🏢", title: "Workspaces", desc: "Create workspaces for your organization, business, or project. Invite your team and get moving." },
            { icon: "👥", title: "People Management", desc: "Manage members, roles, departments, and teams. Control who sees and does what." },
            { icon: "📋", title: "Project Tracking", desc: "Create projects, assign tasks, set deadlines, and track progress in real time." },
            { icon: "💰", title: "Finance Management", desc: "Track invoices, expenses, budgets, and financial reports all in one place." },
            { icon: "📊", title: "Analytics & Reports", desc: "Get a clear picture of your business with dashboards, charts, and activity logs." },
            { icon: "🔒", title: "Security & Access", desc: "Role-based access control, audit logs, two-factor authentication, and session management." },
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-indigo-50 px-8 py-24">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Simple Pricing</h2>
        <p className="text-center text-gray-500 mb-16">Start free. Scale as you grow.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { plan: "Starter", price: "Free", desc: "Perfect for individuals and small teams just getting started.", features: ["1 Workspace", "Up to 5 members", "Basic projects", "Community support"] },
            { plan: "Pro", price: "$19/mo", desc: "For growing businesses that need more power and flexibility.", features: ["5 Workspaces", "Unlimited members", "Advanced analytics", "Priority support"], highlight: true },
            { plan: "Enterprise", price: "Custom", desc: "For large organizations with custom needs and compliance requirements.", features: ["Unlimited workspaces", "Custom roles", "Audit logs", "Dedicated support"] },
          ].map((tier, i) => (
            <div key={i} className={`p-8 rounded-xl border ${tier.highlight ? "border-indigo-600 bg-white shadow-lg" : "border-gray-200 bg-white"}`}>
              {tier.highlight && <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Most Popular</span>}
              <h3 className="text-xl font-bold text-gray-900 mt-2">{tier.plan}</h3>
              <p className="text-3xl font-extrabold text-indigo-600 my-3">{tier.price}</p>
              <p className="text-sm text-gray-500 mb-6">{tier.desc}</p>
              <ul className="space-y-2 mb-8">
                {tier.features.map((f, j) => (
                  <li key={j} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-indigo-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="/sign-up" className={`block text-center py-2 rounded-lg text-sm font-semibold transition ${tier.highlight ? "bg-indigo-600 text-white hover:bg-indigo-700" : "border border-indigo-600 text-indigo-600 hover:bg-indigo-50"}`}>
                Get Started
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-24 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
        <p className="text-gray-500 mb-8 max-w-xl mx-auto">Join thousands of teams already using MUNIX to manage their work smarter.</p>
        <a href="/sign-up" className="bg-indigo-600 text-white px-10 py-3 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
          Create Your Free Account
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-8 py-10 text-center text-sm text-gray-400">
        <div className="text-lg font-bold text-indigo-600 mb-2">MUNIX</div>
        <p>© 2025 MUNIX. All rights reserved.</p>
      </footer>

    </main>
  );
}