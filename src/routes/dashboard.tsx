import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  ShieldAlert,
  AlertCircle,
  Settings,
  Code2,
  ChevronDown,
  ChevronRight,
  Radio,
  Download,
  Calendar,
  Activity,
  BarChart3,
  FileText,
  Bell,
  SlidersHorizontal,
  MoreHorizontal,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Flame,
  Info,
  ArrowUpRight,
  RefreshCw,
  Eye,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  Cell,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard Executiva & Tracking de Leads · Templo de Luz" },
      {
        name: "description",
        content: "Painel de controle em tempo real para monitoramento de leads, quiz e vendas.",
      },
    ],
  }),
  component: DashboardPage,
});

interface DashboardStats {
  newSubscriptions: number;
  newSubscriptionsDiff: number;
  newOrders: number;
  newOrdersDiff: number;
  avgOrderRevenue: number;
  avgOrderRevenueDiff: number;
  totalRevenue: number;
  totalRevenueDiff: number;
  pendingAmount: number;
  pendingCount: number;
}

interface PaymentOrder {
  id: string;
  order_id?: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  amount_cents: number;
  status: "paid" | "pending" | "failed" | "creating" | "expired";
  payment_method: "pix" | "credit_card";
  created_at: string;
}

interface Lead {
  id: string;
  session_id: string;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  ente_querido: string | null;
  grau_parentesco: string | null;
  mensagem_preview: string | null;
  temas_selecionados: string[] | null;
  current_step_index: number;
  current_step_name: string;
  highest_step_index: number;
  completed: boolean;
  payment_status: "none" | "waiting_payment" | "paid" | "failed";
  last_amount_cents: number;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CHART_DATA = [
  { month: "Jan", sales: 1200, revenue: 2400 },
  { month: "Feb", sales: 2100, revenue: 4200 },
  { month: "Mar", sales: 1800, revenue: 3600 },
  { month: "Apr", sales: 2780, revenue: 5500 },
  { month: "May", sales: 3200, revenue: 6400 },
  { month: "Jun", sales: 4300, revenue: 8600 },
];

const BAR_DATA = [
  { name: "1", value: 35, color: "#f87171" },
  { name: "2", value: 20, color: "#2dd4bf" },
  { name: "3", value: 45, color: "#f87171" },
  { name: "4", value: 25, color: "#2dd4bf" },
  { name: "5", value: 30, color: "#2dd4bf" },
  { name: "6", value: 55, color: "#f87171" },
  { name: "7", value: 70, color: "#0d9488" },
  { name: "8", value: 40, color: "#f87171" },
  { name: "9", value: 20, color: "#2dd4bf" },
  { name: "10", value: 48, color: "#f87171" },
  { name: "11", value: 95, color: "#0d9488" },
  { name: "12", value: 50, color: "#f87171" },
  { name: "13", value: 60, color: "#2dd4bf" },
];

const MEMBERS = [
  {
    name: "Médium Milena",
    email: "milena@templodeluz.com",
    role: "Owner",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60",
  },
  {
    name: "Diogo (Admin)",
    email: "diogo@templodeluz.com",
    role: "Owner",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60",
  },
  {
    name: "Equipe de Acolhimento",
    email: "acolhimento@templodeluz.com",
    role: "Member",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=60",
  },
  {
    name: "Suporte WhatsApp",
    email: "suporte@templodeluz.com",
    role: "Member",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60",
  },
];

const STEP_LABELS = [
  { index: 1, name: "intro", label: "1. Início do Quiz", icon: "✨" },
  { index: 2, name: "ente", label: "2. Nome do Ente", icon: "🤍" },
  { index: 3, name: "relacao", label: "3. Vínculo Familiar", icon: "🕊️" },
  { index: 4, name: "tempo", label: "4. Tempo & Sentimento", icon: "⏳" },
  { index: 5, name: "mensagem", label: "5. Intenção / Mensagem", icon: "✍️" },
  { index: 6, name: "confirma", label: "6. Confirmação dos Dados", icon: "📋" },
  { index: 7, name: "loading", label: "7. Preparação Sagrada", icon: "🕯️" },
  { index: 8, name: "result", label: "8. Altar & Checkout PIX", icon: "💳" },
];

const DEFAULT_SUPABASE_URL = "https://opftmzegcvfyoinjfmcj.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZnRtemVnY3ZmeW9pbmpmbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzgyMDksImV4cCI6MjEwMzg1NDIwOX0.VpQitxh7x5v_0k5q35hhMz3eAATUHGERubdmA_TnR24";

function renderLeadPaymentStatusBadge(paymentStatus: Lead["payment_status"]) {
  if (paymentStatus === "paid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10.5px] font-bold">
        ✓ Pago
      </span>
    );
  }
  if (paymentStatus === "waiting_payment") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10.5px] font-bold">
        ⏳ PIX Pendente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10.5px] font-semibold">
      Em Navegação
    </span>
  );
}

function DashboardPage() {
  const [currentTab, setCurrentTab] = useState("dashboard-1");
  const [activeViewTab, setActiveViewTab] = useState("overview");
  const [dateFilter, setDateFilter] = useState("all");
  const [filterText, setFilterText] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);

  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [developersOpen, setDevelopersOpen] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    newSubscriptions: 4682,
    newSubscriptionsDiff: 15.54,
    newOrders: 1226,
    newOrdersDiff: 40.2,
    avgOrderRevenue: 27.5,
    avgOrderRevenueDiff: 10.8,
    totalRevenue: 15231.89,
    totalRevenueDiff: 20.1,
    pendingAmount: 185.0,
    pendingCount: 6,
  });

  const [orders, setOrders] = useState<PaymentOrder[]>([
    {
      id: "ord_1",
      customer_name: "Diogo",
      customer_email: "diogo@exemplo.com",
      product_name: "Carta Sagrada",
      amount_cents: 2000,
      status: "pending",
      payment_method: "pix",
      created_at: new Date().toISOString(),
    },
    {
      id: "ord_2",
      customer_name: "Jucilene Ap Andrade de Melo",
      customer_email: "jucilene@exemplo.com",
      product_name: "Doacao ao Templo de Luz",
      amount_cents: 3500,
      status: "pending",
      payment_method: "pix",
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "ord_3",
      customer_name: "Lourdes Maria",
      customer_email: "lourdes99@yahoo.com",
      product_name: "Carta Psicografada Sagrada",
      amount_cents: 2000,
      status: "paid",
      payment_method: "pix",
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "ord_4",
      customer_name: "Cláudia Fernandes",
      customer_email: "claudia.f@gmail.com",
      product_name: "Campanha Cirurgia Médium Milena",
      amount_cents: 3500,
      status: "paid",
      payment_method: "credit_card",
      created_at: new Date(Date.now() - 10800000).toISOString(),
    },
  ]);

  const [leads, setLeads] = useState<Lead[]>([
    {
      id: "lead_1",
      session_id: "tl_178844001",
      lead_name: "Dona Lourdes",
      lead_email: null,
      lead_phone: "11987654321",
      ente_querido: "Leonardo",
      grau_parentesco: "Filho",
      mensagem_preview: "Quero saber se ele está em paz e se perdoou a família...",
      temas_selecionados: ["Notícias de Paz e Conforto", "Perdão e Reconciliação"],
      current_step_index: 8,
      current_step_name: "result",
      highest_step_index: 8,
      completed: true,
      payment_status: "waiting_payment",
      last_amount_cents: 2000,
      utm_source: "facebook_ads",
      utm_medium: "cpc",
      utm_campaign: "campanha_psicografia_kardec",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "lead_2",
      session_id: "tl_178844002",
      lead_name: "Roberto Silva",
      lead_email: null,
      lead_phone: "21998877665",
      ente_querido: "Maria Helena",
      grau_parentesco: "Mãe",
      mensagem_preview: "Mãe querida, sinto tantas saudades das suas orações.",
      temas_selecionados: ["Sinal de Presença"],
      current_step_index: 5,
      current_step_name: "mensagem",
      highest_step_index: 5,
      completed: false,
      payment_status: "none",
      last_amount_cents: 0,
      utm_source: "instagram",
      utm_medium: "stories",
      utm_campaign: "reels_milena",
      created_at: new Date(Date.now() - 1800000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
    },
  ]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabaseUrl =
        (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) || DEFAULT_SUPABASE_URL;
      const supabaseAnonKey =
        (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) || DEFAULT_SUPABASE_ANON_KEY;

      const res = await fetch(`${supabaseUrl}/rest/v1/pix_orders?select=*&order=created_at.desc&limit=50`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: PaymentOrder[] = data.map((o: any) => ({
            id: o.id,
            customer_name: o.customer_name || "Consulente",
            customer_email: o.customer_email || "contato@templodeluz.com",
            product_name: o.product_name || "Carta Sagrada",
            amount_cents: o.amount_cents || 0,
            status: o.status,
            payment_method: "pix",
            created_at: o.created_at,
          }));
          setOrders(mapped);

          const paidOrders = mapped.filter((o) => o.status === "paid");
          const pendingOrders = mapped.filter(
            (o) => o.status === "pending" || o.status === "creating",
          );

          const totalPaid = paidOrders.reduce((sum, o) => sum + o.amount_cents, 0) / 100;
          const totalPending = pendingOrders.reduce((sum, o) => sum + o.amount_cents, 0) / 100;
          const avg = paidOrders.length > 0 ? totalPaid / paidOrders.length : 20.0;

          setStats((prev) => ({
            ...prev,
            newOrders: paidOrders.length,
            totalRevenue: totalPaid > 0 ? totalPaid : prev.totalRevenue,
            avgOrderRevenue: avg,
            pendingAmount: totalPending,
            pendingCount: pendingOrders.length,
          }));
        }
      }

      // Busca leads
      const resLeads = await fetch(`${supabaseUrl}/rest/v1/quiz_funnel_leads?select=*&order=created_at.desc&limit=100`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });

      if (resLeads.ok) {
        const leadsData = await resLeads.json();
        if (Array.isArray(leadsData) && leadsData.length > 0) {
          setLeads(leadsData);
          setStats((prev) => ({ ...prev, newSubscriptions: leadsData.length }));
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    const interval = setInterval(() => void fetchData(), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleExportCsv = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID,Nome,Email,Produto,Valor(BRL),Status,Metodo,Data"]
        .concat(
          orders.map(
            (o) =>
              `${o.id},"${o.customer_name}","${o.customer_email}","${o.product_name}",${(
                o.amount_cents / 100
              ).toFixed(2)},${o.status},${o.payment_method},${o.created_at}`,
          ),
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_templo_de_luz_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.customer_email.toLowerCase().includes(filterText.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(filterText.toLowerCase()),
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Sidebar Lateral */}
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between h-screen sticky top-0 select-none">
        <div className="p-4 flex-1 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-2 py-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 leading-tight">
                Templo de Luz
              </h1>
              <span className="text-[10.5px] font-bold text-slate-400">
                Tracking & Analytics Hub
              </span>
            </div>
          </div>

          <div className="space-y-6 text-[13px]">
            <div>
              <button
                type="button"
                onClick={() => setDashboardOpen(!dashboardOpen)}
                className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </span>
                {dashboardOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {dashboardOpen && (
                <div className="mt-1 space-y-0.5 pl-2">
                  <button
                    type="button"
                    onClick={() => setCurrentTab("dashboard-1")}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition-all cursor-pointer ${
                      currentTab === "dashboard-1"
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span>Dashboard 1 (Geral)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentTab("dashboard-2")}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition-all cursor-pointer ${
                      currentTab === "dashboard-2"
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span>Dashboard 2 (Quiz Funnel)</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setCurrentTab("dashboard-2")}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition-all cursor-pointer ${
                  currentTab === "dashboard-2"
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>Leads em Tempo Real</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-slate-50"
              >
                <CheckSquare className="w-4 h-4 text-slate-400" />
                <span>Tarefas</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-slate-50"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>Usuários & Clientes</span>
              </button>
            </div>

            <div className="pt-2">
              <span className="block px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Pages
              </span>
              <div className="space-y-0.5">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-slate-400" />
                    <span>Auth</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                    <span>Errors</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="pt-2">
              <span className="block px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Other
              </span>
              <div className="space-y-0.5">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Settings</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <div>
                  <button
                    type="button"
                    onClick={() => setDevelopersOpen(!developersOpen)}
                    className="flex w-full items-center justify-between px-3 py-2 font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Code2 className="w-4 h-4 text-slate-400" />
                      <span>Developers</span>
                    </span>
                    {developersOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                  {developersOpen && (
                    <div className="mt-1 space-y-0.5 pl-6 text-xs text-slate-500">
                      <span className="block py-1 px-2 text-slate-400 font-semibold">Overview</span>
                      <span className="block py-1 px-2 text-slate-400 font-semibold">API Keys</span>
                      <span className="block py-1 px-2 text-slate-400 font-semibold">Webhooks</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-slate-50">
            <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              TL
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-slate-900 truncate">
                Administrador
              </span>
              <span className="block text-[11px] text-slate-400 truncate">
                admin@templodeluz.com
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo Central */}
      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden">
        {/* Top Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Dashboard
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Monitoramento em tempo real do quiz, leads, vendas e telemetria de tráfego.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>

              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="appearance-none inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 pr-8 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer outline-none"
                >
                  <option value="today">Hoje</option>
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="all">Todo o período</option>
                </select>
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveViewTab("overview")}
              className={`inline-flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                activeViewTab === "overview"
                  ? "border-slate-900 text-slate-900 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab("analytics")}
              className={`inline-flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                activeViewTab === "analytics"
                  ? "border-slate-900 text-slate-900 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab("reports")}
              className={`inline-flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                activeViewTab === "reports"
                  ? "border-slate-900 text-slate-900 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Reports</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab("notifications")}
              className={`inline-flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                activeViewTab === "notifications"
                  ? "border-slate-900 text-slate-900 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notifications</span>
            </button>
          </div>
        </div>

        {/* Visualização de Funil / Leads em Tempo Real */}
        {currentTab === "dashboard-2" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Jornada do Quiz & Leads em Tempo Real
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Acompanhe exatamente onde os visitantes estão e recupere leads que abandonaram o formulário.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchData}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
                <span>Atualizar</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {STEP_LABELS.map((step) => {
                const count = leads.filter(
                  (l) => l.current_step_index === step.index || l.current_step_name === step.name,
                ).length;
                return (
                  <div
                    key={step.index}
                    className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs text-center flex flex-col justify-between"
                  >
                    <span className="text-lg block mb-1">{step.icon}</span>
                    <span className="text-xs font-bold text-slate-900 block truncate" title={step.label}>
                      {step.label}
                    </span>
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <span className="text-lg font-black text-indigo-600 block">{count}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block">visitantes</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Últimos Leads Registrados ({leads.length})
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3">Lead / Consulente</th>
                      <th className="py-3 px-3">Ente Querido</th>
                      <th className="py-3 px-3">Vínculo</th>
                      <th className="py-3 px-3">Etapa Atual</th>
                      <th className="py-3 px-3">Status Pagamento</th>
                      <th className="py-3 px-3">Origem (UTM)</th>
                      <th className="py-3 px-3">Data</th>
                      <th className="py-3 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {leads.map((lead) => (
                      <tr key={lead.id || lead.session_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                            {lead.lead_name || "Visitante Anônimo"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-800 truncate max-w-[140px]">
                          {lead.ente_querido || "—"}
                        </td>
                        <td className="py-3.5 px-3 text-slate-500">{lead.grau_parentesco || "—"}</td>
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10.5px] font-bold text-indigo-700">
                            {lead.current_step_name || `Etapa ${lead.current_step_index}`}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          {renderLeadPaymentStatusBadge(lead.payment_status)}
                        </td>
                        <td className="py-3.5 px-3 text-[11px] text-slate-500">
                          <span className="block font-bold text-slate-700">{lead.utm_source || "Orgânico / Direto"}</span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                          {new Date(lead.created_at || Date.now()).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLead(lead)}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 4 Cards de Métricas Principais (Fiel ao Design) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5 font-bold text-slate-700">
                      <span className="text-slate-400">⚡</span> New Subscriptions
                    </span>
                    <Info className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {stats.newSubscriptions.toLocaleString("pt-BR")}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-medium mt-0.5">
                        Since last week
                      </span>
                    </div>
                    <div className="w-16 h-8 text-red-400">
                      <svg viewBox="0 0 60 30" className="w-full h-full stroke-current fill-none stroke-[2.5] stroke-linecap-round">
                        <path d="M0,25 Q15,10 30,18 T60,5" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Details</span>
                  <span className="inline-flex items-center font-bold text-emerald-600 gap-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>{stats.newSubscriptionsDiff}% ▲</span>
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5 font-bold text-slate-700">
                      <span className="text-slate-400">📦</span> New Orders
                    </span>
                    <Info className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {stats.newOrders.toLocaleString("pt-BR")}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-medium mt-0.5">
                        Since last week
                      </span>
                    </div>
                    <div className="w-16 h-8 text-teal-500">
                      <svg viewBox="0 0 60 30" className="w-full h-full stroke-current fill-none stroke-[2.5] stroke-linecap-round">
                        <path d="M0,20 Q15,28 30,15 T60,8" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Details</span>
                  <span className="inline-flex items-center font-bold text-red-500 gap-0.5">
                    <span>{stats.newOrdersDiff}% ▼</span>
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5 font-bold text-slate-700">
                      <span className="text-slate-400">🎁</span> Avg Order Revenue
                    </span>
                    <Info className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {formatCurrency(stats.avgOrderRevenue)}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-medium mt-0.5">
                        Since last week
                      </span>
                    </div>
                    <div className="w-16 h-8 text-indigo-400">
                      <svg viewBox="0 0 60 30" className="w-full h-full stroke-current fill-none stroke-[2.5] stroke-linecap-round">
                        <path d="M0,15 Q20,5 40,22 T60,10" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Details</span>
                  <span className="inline-flex items-center font-bold text-emerald-600 gap-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>{stats.avgOrderRevenueDiff}% ▲</span>
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5 font-bold text-slate-700">
                      Total Revenue
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {formatCurrency(stats.totalRevenue)}
                    </span>
                    <span className="block text-[11px] text-slate-400 font-medium mt-0.5">
                      +{stats.totalRevenueDiff}% from last month
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="w-full h-8 text-slate-800">
                    <svg viewBox="0 0 160 30" className="w-full h-full">
                      <path d="M 5,22 Q 35,24 65,20 T 115,18 T 155,5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="5" cy="22" r="3" fill="#1e293b" />
                      <circle cx="65" cy="20" r="3" fill="#1e293b" />
                      <circle cx="115" cy="18" r="3" fill="#1e293b" />
                      <circle cx="155" cy="5" r="3.5" fill="#1e293b" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos Centrais (Sale Activity & Subscriptions) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="mb-4">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Sale Activity - Monthly
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Showing total sales for the last 6 months
                  </p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={DEFAULT_CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSalesMain" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRevenueMain" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                          fontSize: "12px",
                        }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorSalesMain)" />
                      <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenueMain)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Subscriptions</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-slate-900">+2350</span>
                    <span className="text-xs font-bold text-emerald-600">+180.1% from last month</span>
                  </div>
                </div>
                <div className="h-56 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={BAR_DATA} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <XAxis dataKey="name" hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          fontSize: "11px",
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {BAR_DATA.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Tabela de Pagamentos e Equipe */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Payments</h3>
                    <p className="text-xs text-slate-400 font-medium">Manage your payments.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      placeholder="Filter emails..."
                      className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-slate-400 w-48 sm:w-64"
                    />
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                      <span>Columns</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3 w-10">
                          <input
                            type="checkbox"
                            checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
                            onChange={toggleSelectAll}
                            className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                          />
                        </th>
                        <th className="py-3 px-3 font-semibold">Status</th>
                        <th className="py-3 px-3 font-semibold">
                          <button type="button" className="inline-flex items-center gap-1 hover:text-slate-700">
                            <span>Email</span>
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        </th>
                        <th className="py-3 px-3 font-semibold text-right">Amount</th>
                        <th className="py-3 px-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredOrders.map((order) => {
                        const isSelected = selectedIds.includes(order.id);
                        return (
                          <tr key={order.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? "bg-slate-50" : ""}`}>
                            <td className="py-3.5 px-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(order.id)}
                                className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="py-3.5 px-3">
                              {order.status === "paid" ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Success</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Processing</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="font-bold text-slate-900 block truncate max-w-[220px]">
                                {order.customer_email}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                              {formatCurrency(order.amount_cents / 100)}
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <button type="button" className="p-1 text-slate-400 hover:text-slate-700 rounded-md">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Team Members</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Invite your team members to collaborate.
                  </p>
                  <div className="mt-5 space-y-4">
                    {MEMBERS.map((member) => (
                      <div key={member.email} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200"
                          />
                          <div className="min-w-0">
                            <span className="block text-xs font-bold text-slate-900 truncate">
                              {member.name}
                            </span>
                            <span className="block text-[11px] text-slate-400 truncate">
                              {member.email}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <span>{member.role}</span>
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal de Detalhes do Lead */}
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Ficha do Lead: {selectedLead.lead_name || "Visitante"}
                  </h4>
                  <span className="text-xs text-slate-400">ID: {selectedLead.session_id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-400 block font-bold">Ente Querido:</span>
                  <span className="text-slate-900 font-extrabold text-sm mt-0.5 block">
                    {selectedLead.ente_querido || "Não informado"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-400 block font-bold">Vínculo:</span>
                  <span className="text-slate-900 font-extrabold text-sm mt-0.5 block">
                    {selectedLead.grau_parentesco || "Não informado"}
                  </span>
                </div>
              </div>

              {selectedLead.mensagem_preview && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                  <span className="text-amber-900 font-bold block mb-1">✍️ Conteúdo Digitado da Carta:</span>
                  <p className="text-slate-700 italic leading-relaxed">
                    "{selectedLead.mensagem_preview}"
                  </p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 text-xs space-y-1">
                <span className="text-slate-400 font-bold block">Rastreamento de Tráfego:</span>
                <p className="text-slate-600"><strong>Source:</strong> {selectedLead.utm_source || "None"}</p>
                <p className="text-slate-600"><strong>Campaign:</strong> {selectedLead.utm_campaign || "None"}</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
