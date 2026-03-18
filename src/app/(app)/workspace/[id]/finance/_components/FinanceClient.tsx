"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ArrowUpDown,
  FileText,
  Wallet,
  PiggyBank,
  Users,
  UserCheck,
  BookOpen,
  Receipt,
  Globe,
  ClipboardList,
  ShieldCheck,
  BarChart3,
  Settings,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Package,
  ShoppingCart,
  ShoppingBag,
  Truck,
} from "lucide-react";

type FinanceSettings = {
  id: string;
  isSetup: boolean;
  fiscalYearStart: string;
  defaultCurrency: string;
  enableInvoicing: boolean;
  enableAccounts: boolean;
  enableBudgets: boolean;
  enableTax: boolean;
  enablePayroll: boolean;
  enablePayables: boolean;
  enableMultiCurrency: boolean;
  enableDoubleEntry: boolean;
  enableJournalEntries: boolean;
  enableAuditTrail: boolean;
  enableAdvancedReports: boolean;
  enableInventory: boolean;
  enablePurchaseOrders: boolean;
  enableSalesOrders: boolean;
  enableCustomers: boolean;
  enableSuppliers: boolean;
} | null;

type Transaction = {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  currency: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  total: number;
  status: string;
  dueDate: Date | null;
  currency: string;
};

type Budget = {
  id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  currency: string;
};

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
};

type DashboardData = {
  totalIncome: number;
  totalExpenses: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netProfit: number;
  outstandingInvoices: number;
  cashBalance: number;
  recentTransactions: Transaction[];
  recentInvoices: Invoice[];
  budgets: Budget[];
  accounts: Account[];
} | null;

type Props = {
  workspace: {
    id: string;
    name: string;
    currency: string;
  };
  financeSettings: FinanceSettings;
  dashboardData: DashboardData;
  isOwner: boolean;
  currentUserId: string;
};

const CURRENCIES = [
  "USD", "EUR", "GBP", "UGX", "KES", "TZS", "NGN",
  "ZAR", "GHS", "EGP", "MAD", "JPY", "CNY", "INR", "CAD", "AUD",
];

const FISCAL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const FEATURES = [
  {
    key: "enableInvoicing",
    label: "Invoicing & Billing",
    description: "Create and send professional invoices, track payments",
    icon: FileText,
    requires: [],
  },
  {
    key: "enableCustomers",
    label: "Customer Management",
    description: "Manage customer records, purchase history and outstanding balances",
    icon: Users,
    requires: [],
  },
  {
    key: "enableSuppliers",
    label: "Supplier Management",
    description: "Manage supplier records, payment terms and outstanding balances",
    icon: Truck,
    requires: [],
  },
  {
    key: "enableInventory",
    label: "Inventory & Stock",
    description: "Track products, stock levels, valuations and low stock alerts",
    icon: Package,
    requires: [],
  },
  {
    key: "enablePurchaseOrders",
    label: "Purchase Orders",
    description: "Create and manage orders to suppliers, track deliveries",
    icon: ShoppingCart,
    requires: ["enableSuppliers", "enableInventory"],
  },
  {
    key: "enableSalesOrders",
    label: "Sales Orders",
    description: "Create and manage customer orders, track fulfilment",
    icon: ShoppingBag,
    requires: ["enableCustomers", "enableInventory"],
  },
  {
    key: "enableAccounts",
    label: "Accounts Management",
    description: "Manage bank accounts, cash, credit and other accounts",
    icon: Wallet,
    requires: [],
  },
  {
    key: "enableBudgets",
    label: "Budget Tracking",
    description: "Set budgets by category and track spending against them",
    icon: PiggyBank,
    requires: [],
  },
  {
    key: "enableTax",
    label: "Tax Management",
    description: "Track tax obligations, VAT, income tax and filing deadlines",
    icon: Receipt,
    requires: [],
  },
  {
    key: "enablePayroll",
    label: "Payroll Management",
    description: "Process employee salaries, allowances, deductions and payslips",
    icon: UserCheck,
    requires: [],
  },
  {
    key: "enablePayables",
    label: "Accounts Payable & Receivable",
    description: "Track money owed to and from your business",
    icon: ArrowUpDown,
    requires: [],
  },
  {
    key: "enableMultiCurrency",
    label: "Multi-Currency Support",
    description: "Handle transactions in multiple currencies with exchange rates",
    icon: Globe,
    requires: [],
  },
  {
    key: "enableDoubleEntry",
    label: "Double Entry Bookkeeping",
    description: "Full double-entry accounting with chart of accounts",
    icon: BookOpen,
    requires: ["enableAccounts"],
  },
  {
    key: "enableJournalEntries",
    label: "Journal Entries & Ledger",
    description: "Record journal entries and view the general ledger",
    icon: ClipboardList,
    requires: ["enableAccounts", "enableDoubleEntry"],
  },
  {
    key: "enableAuditTrail",
    label: "Audit Trail",
    description: "Complete log of all financial actions for compliance",
    icon: ShieldCheck,
    requires: [],
  },
  {
    key: "enableAdvancedReports",
    label: "Advanced Reports",
    description: "Balance sheet, P&L statement, trial balance and more",
    icon: BarChart3,
    requires: ["enableDoubleEntry", "enableAccounts"],
  },
];

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {trend && (
        <div className="mt-1 flex items-center gap-1">
          {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
          {trend === "down" && <TrendingDown className="h-3 w-3 text-rose-500" />}
          <span className={`text-xs font-medium ${trend === "up" ? "text-green-600" : trend === "down" ? "text-rose-600" : "text-gray-400"}`}>
            This month
          </span>
        </div>
      )}
    </div>
  );
}

export default function FinanceClient({
  workspace,
  financeSettings,
  dashboardData,
  isOwner,
}: Props) {
  const router = useRouter();
  const [showSetup, setShowSetup] = useState(!financeSettings?.isSetup);
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [fiscalYearStart, setFiscalYearStart] = useState(
    financeSettings?.fiscalYearStart ?? "January"
  );
  const [defaultCurrency, setDefaultCurrency] = useState(
    financeSettings?.defaultCurrency ?? workspace.currency ?? "USD"
  );
  const [features, setFeatures] = useState({
    enableInvoicing: financeSettings?.enableInvoicing ?? false,
    enableAccounts: financeSettings?.enableAccounts ?? false,
    enableBudgets: financeSettings?.enableBudgets ?? false,
    enableTax: financeSettings?.enableTax ?? false,
    enablePayroll: financeSettings?.enablePayroll ?? false,
    enablePayables: financeSettings?.enablePayables ?? false,
    enableMultiCurrency: financeSettings?.enableMultiCurrency ?? false,
    enableDoubleEntry: financeSettings?.enableDoubleEntry ?? false,
    enableJournalEntries: financeSettings?.enableJournalEntries ?? false,
    enableAuditTrail: financeSettings?.enableAuditTrail ?? false,
    enableAdvancedReports: financeSettings?.enableAdvancedReports ?? false,
    enableInventory: financeSettings?.enableInventory ?? false,
    enablePurchaseOrders: financeSettings?.enablePurchaseOrders ?? false,
    enableSalesOrders: financeSettings?.enableSalesOrders ?? false,
    enableCustomers: financeSettings?.enableCustomers ?? false,
    enableSuppliers: financeSettings?.enableSuppliers ?? false,
  });

  function toggleFeature(key: string) {
    setFeatures((prev) => {
      const updated = { ...prev, [key]: !prev[key as keyof typeof prev] };
      if (key === "enableDoubleEntry" && updated.enableDoubleEntry) {
        updated.enableAccounts = true;
        updated.enableJournalEntries = true;
      }
      if (key === "enableJournalEntries" && updated.enableJournalEntries) {
        updated.enableAccounts = true;
        updated.enableDoubleEntry = true;
      }
      if (key === "enableAdvancedReports" && updated.enableAdvancedReports) {
        updated.enableAccounts = true;
        updated.enableDoubleEntry = true;
        updated.enableJournalEntries = true;
      }
      if (key === "enablePurchaseOrders" && updated.enablePurchaseOrders) {
        updated.enableSuppliers = true;
        updated.enableInventory = true;
      }
      if (key === "enableSalesOrders" && updated.enableSalesOrders) {
        updated.enableCustomers = true;
        updated.enableInventory = true;
      }
      return updated;
    });
  }

  async function handleSaveSettings() {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/finance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fiscalYearStart, defaultCurrency, ...features }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      setShowSetup(false);
      setShowSettings(false);
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  const currency = financeSettings?.defaultCurrency ?? workspace.currency ?? "USD";

  function getNavItems() {
    const base = `/workspace/${workspace.id}/finance`;
    return [
      { label: "Overview", icon: LayoutDashboard, href: base },
      ...(financeSettings?.enableInventory ? [{ label: "Inventory", icon: Package, href: `${base}/inventory` }] : []),
      ...(financeSettings?.enableCustomers ? [{ label: "Customers", icon: Users, href: `${base}/customers` }] : []),
      ...(financeSettings?.enableSuppliers ? [{ label: "Suppliers", icon: Truck, href: `${base}/suppliers` }] : []),
      ...(financeSettings?.enablePurchaseOrders ? [{ label: "Purchases", icon: ShoppingCart, href: `${base}/purchases` }] : []),
      ...(financeSettings?.enableSalesOrders ? [{ label: "Sales", icon: ShoppingBag, href: `${base}/sales` }] : []),
      ...(financeSettings?.enableInvoicing ? [{ label: "Invoices", icon: FileText, href: `${base}/invoices` }] : []),
      ...(financeSettings?.enableAccounts ? [{ label: "Accounts", icon: Wallet, href: `${base}/accounts` }] : []),
      { label: "Transactions", icon: ArrowUpDown, href: `${base}/transactions` },
      ...(financeSettings?.enableBudgets ? [{ label: "Budgets", icon: PiggyBank, href: `${base}/budgets` }] : []),
      ...(financeSettings?.enablePayroll ? [{ label: "Payroll", icon: UserCheck, href: `${base}/payroll` }] : []),
      ...(financeSettings?.enableTax ? [{ label: "Tax", icon: Receipt, href: `${base}/tax` }] : []),
      ...(financeSettings?.enableJournalEntries ? [{ label: "Journal", icon: BookOpen, href: `${base}/journal` }] : []),
      ...(financeSettings?.enableAuditTrail ? [{ label: "Audit Trail", icon: ShieldCheck, href: `${base}/audit-trail` }] : []),
      { label: "Reports", icon: BarChart3, href: `${base}/reports` },
    ];
  }

  // ─── SETUP SCREEN ───────────────────────────────────────
  if (showSetup && isOwner) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Set Up Finance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure your finance module for {workspace.name}. You can change these settings anytime.
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Basic Settings</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Default Currency</label>
              <select value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Fiscal Year Starts</label>
              <select value={fiscalYearStart} onChange={(e) => setFiscalYearStart(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                {FISCAL_MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Select Features</h2>
          <p className="text-xs text-gray-500 mb-5">
            Choose the features you want to use. You can add or remove them anytime from Finance Settings.
          </p>
          <div className="space-y-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              const isEnabled = features[feature.key as keyof typeof features];
              const isAutoEnabled = feature.requires.length > 0 &&
                feature.requires.some((req) => features[req as keyof typeof features]);
              return (
                <div key={feature.key} onClick={() => toggleFeature(feature.key)}
                  className={["flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition",
                    isEnabled ? "border-indigo-200 bg-indigo-50" : "border-gray-100 hover:border-gray-200 bg-white"].join(" ")}>
                  <div className={["h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition",
                    isEnabled ? "bg-indigo-600" : "bg-gray-100"].join(" ")}>
                    <Icon className={`h-5 w-5 ${isEnabled ? "text-white" : "text-gray-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{feature.label}</span>
                      {isAutoEnabled && (
                        <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Auto-enabled</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
                    {feature.requires.length > 0 && (
                      <p className="text-xs text-indigo-500 mt-1">
                        Requires: {feature.requires.map((r) => FEATURES.find((f) => f.key === r)?.label).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className={["h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition",
                    isEnabled ? "border-indigo-600 bg-indigo-600" : "border-gray-300 bg-white"].join(" ")}>
                    {isEnabled && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {saveError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">{saveError}</div>
        )}
        <button onClick={() => void handleSaveSettings()} disabled={isSaving}
          className={["w-full rounded-xl px-5 py-3 text-sm font-semibold text-white transition",
            isSaving ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"].join(" ")}>
          {isSaving ? "Setting up..." : "Complete Finance Setup →"}
        </button>
      </div>
    );
  }

  if (!financeSettings?.isSetup) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <DollarSign className="h-8 w-8 text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Finance Not Set Up</h2>
        <p className="text-sm text-gray-500">
          The finance module has not been configured yet. Please ask the workspace owner to set it up.
        </p>
      </div>
    );
  }

  // ─── FINANCE DASHBOARD ──────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-sm text-gray-500 mt-1">
            {workspace.name} · {currency} · Fiscal year starts {financeSettings.fiscalYearStart}
          </p>
        </div>
        {isOwner && (
          <button onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            <Settings className="h-4 w-4" />
            Finance Settings
          </button>
        )}
      </div>

      {/* Finance Settings Modal */}
      {showSettings && isOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Finance Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 transition">✕</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Default Currency</label>
                  <select value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500">
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Fiscal Year Starts</label>
                  <select value={fiscalYearStart} onChange={(e) => setFiscalYearStart(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500">
                    {FISCAL_MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Active Features</h3>
              <div className="space-y-2 mb-6">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  const isEnabled = features[feature.key as keyof typeof features];
                  return (
                    <div key={feature.key} onClick={() => toggleFeature(feature.key)}
                      className={["flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition",
                        isEnabled ? "border-indigo-200 bg-indigo-50" : "border-gray-100 hover:border-gray-200"].join(" ")}>
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isEnabled ? "bg-indigo-600" : "bg-gray-100"}`}>
                        <Icon className={`h-4 w-4 ${isEnabled ? "text-white" : "text-gray-500"}`} />
                      </div>
                      <span className="text-sm font-medium text-gray-900 flex-1">{feature.label}</span>
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isEnabled ? "border-indigo-600 bg-indigo-600" : "border-gray-300"}`}>
                        {isEnabled && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
              {saveError && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">{saveError}</div>
              )}
              <div className="flex gap-3">
                <button onClick={() => void handleSaveSettings()} disabled={isSaving}
                  className="flex-1 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50">
                  {isSaving ? "Saving..." : "Save Settings"}
                </button>
                <button onClick={() => setShowSettings(false)}
                  className="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Finance Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
        {getNavItems().map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 whitespace-nowrap transition"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Stats Row */}
      {dashboardData && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
            <StatCard label="Cash Balance" value={formatCurrency(dashboardData.cashBalance, currency)}
              icon={DollarSign} color="bg-indigo-50 text-indigo-600" />
            <StatCard label="Monthly Income" value={formatCurrency(dashboardData.monthlyIncome, currency)}
              icon={TrendingUp} trend="up" color="bg-green-50 text-green-600" />
            <StatCard label="Monthly Expenses" value={formatCurrency(dashboardData.monthlyExpenses, currency)}
              icon={TrendingDown} trend="down" color="bg-rose-50 text-rose-600" />
            <StatCard label="Net Profit" value={formatCurrency(dashboardData.netProfit, currency)}
              icon={BarChart3} trend={dashboardData.netProfit >= 0 ? "up" : "down"} color="bg-purple-50 text-purple-600" />
          </div>

          {financeSettings.enableInvoicing && dashboardData.outstandingInvoices > 0 && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-amber-800">Outstanding Invoices</div>
                <div className="text-xs text-amber-600">
                  You have {formatCurrency(dashboardData.outstandingInvoices, currency)} in unpaid invoices.
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* Recent Transactions */}
            <div className="rounded-xl border border-gray-100 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
                <Link href={`/workspace/${workspace.id}/finance/transactions`}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition">
                  View all →
                </Link>
              </div>
              {dashboardData.recentTransactions.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">No transactions yet</div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recentTransactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${t.type === "income" ? "bg-green-50" : "bg-rose-50"}`}>
                          {t.type === "income"
                            ? <TrendingUp className="h-4 w-4 text-green-600" />
                            : <TrendingDown className="h-4 w-4 text-rose-600" />}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-900 truncate max-w-[140px]">{t.description}</div>
                          <div className="text-xs text-gray-400">{t.category}</div>
                        </div>
                      </div>
                      <div className={`text-sm font-semibold ${t.type === "income" ? "text-green-600" : "text-rose-600"}`}>
                        {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount, t.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Invoices */}
            {financeSettings.enableInvoicing && (
              <div className="rounded-xl border border-gray-100 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">Recent Invoices</h2>
                  <Link href={`/workspace/${workspace.id}/finance/invoices`}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition">
                    View all →
                  </Link>
                </div>
                {dashboardData.recentInvoices.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">No invoices yet</div>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.recentInvoices.map((inv) => {
                      const statusColors: Record<string, string> = {
                        draft: "bg-gray-100 text-gray-600",
                        sent: "bg-blue-100 text-blue-600",
                        paid: "bg-green-100 text-green-600",
                        overdue: "bg-rose-100 text-rose-600",
                        cancelled: "bg-gray-100 text-gray-400",
                      };
                      return (
                        <div key={inv.id} className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-medium text-gray-900">{inv.clientName}</div>
                            <div className="text-xs text-gray-400">{inv.invoiceNumber}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[inv.status] ?? "bg-gray-100 text-gray-600"}`}>
                              {inv.status}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(inv.total, inv.currency)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Budgets */}
            {financeSettings.enableBudgets && dashboardData.budgets.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">Budget Overview</h2>
                  <Link href={`/workspace/${workspace.id}/finance/budgets`}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition">
                    View all →
                  </Link>
                </div>
                <div className="space-y-4">
                  {dashboardData.budgets.slice(0, 4).map((budget) => {
                    const pct = Math.min((budget.spent / budget.amount) * 100, 100);
                    return (
                      <div key={budget.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">{budget.category}</span>
                          <span className="text-xs text-gray-400">
                            {formatCurrency(budget.spent, budget.currency)} / {formatCurrency(budget.amount, budget.currency)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all ${pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-indigo-600"}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Accounts */}
            {financeSettings.enableAccounts && dashboardData.accounts.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">Accounts</h2>
                  <Link href={`/workspace/${workspace.id}/finance/accounts`}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition">
                    View all →
                  </Link>
                </div>
                <div className="space-y-3">
                  {dashboardData.accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                          <Wallet className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-900">{account.name}</div>
                          <div className="text-xs text-gray-400 capitalize">{account.type}</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(account.balance, account.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {dashboardData && dashboardData.recentTransactions.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-16 text-center mt-6">
          <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Financial Data Yet</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Start by recording your first transaction or creating an invoice.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href={`/workspace/${workspace.id}/finance/transactions`}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition">
              + Add Transaction
            </Link>
            {financeSettings.enableInvoicing && (
              <Link href={`/workspace/${workspace.id}/finance/invoices`}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                + Create Invoice
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}