"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, CalendarDays, CheckCircle2, Clock3, Download, RefreshCw, TrendingUp, Users, Activity } from "lucide-react";
import { toast } from "react-toastify";
import API from "@/services/api";

const ranges = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
];

const getTasks = (response) => {
  const body = response?.data;
  if (Array.isArray(body?.tasks)) return body.tasks;
  if (Array.isArray(body?.data?.tasks)) return body.data.tasks;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

function MetricCard({ title, value, suffix = "", detail, icon, color }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-indigo-50 text-indigo-700",
    purple: "bg-violet-50 text-violet-700",
    red: "bg-rose-50 text-rose-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#151b42]">{value}<span className="ml-1 text-sm">{suffix}</span></p>
          <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${styles[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState({});
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState(30);
  const [chartMode, setChartMode] = useState("week");
  const [today, setToday] = useState(null);

  // Read the current date after the component mounts to keep prerendering stable.
  useEffect(() => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    setToday(currentDate);
  }, []);

  const loadAnalytics = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      const [overviewRes, tasksRes] = await Promise.all([
        API.get("/analytics/overview"),
        API.get("/task/list"),
      ]);
      setOverview(overviewRes.data?.data || overviewRes.data || {});
      setTasks(getTasks(tasksRes));
    } catch (error) {
      console.error("Analytics API error:", error);
      toast.error(error.response?.data?.message || "Unable to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const completed = useMemo(() => tasks.filter((task) => task.status === "Completed"), [tasks]);
  const overdue = useMemo(() => {
    if (!today) return [];

    return tasks.filter((task) => {
      if (!task.dueDate || task.status === "Completed") return false;
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < today;
    });
  }, [tasks, today]);

  // These two metrics are calculated only when the task records contain the required dates.
  const onTimeRate = useMemo(() => {
    const dated = completed.filter((task) => task.completedAt && task.dueDate);
    if (!dated.length) return null;
    const onTime = dated.filter((task) => new Date(task.completedAt) <= new Date(task.dueDate)).length;
    return Math.round((onTime / dated.length) * 100);
  }, [completed]);

  const averageCycle = useMemo(() => {
    const dated = completed.filter((task) => task.startDate && task.completedAt);
    if (!dated.length) return null;
    const days = dated.reduce((sum, task) => sum + Math.max(0,
      (new Date(task.completedAt) - new Date(task.startDate)) / 86400000), 0);
    return (days / dated.length).toFixed(1);
  }, [completed]);

  const chartData = useMemo(() => {
    if (!today) return [];

    const from = new Date(today);
    from.setDate(from.getDate() - range + 1);
    const buckets = new Map();
    completed.forEach((task) => {
      if (!task.completedAt) return;
      const date = new Date(task.completedAt);
      if (date < from || date > today) return;
      const key = chartMode === "week"
        ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
        : `${date.getFullYear()}-${date.getMonth()}`;
      const label = chartMode === "week"
        ? date.toLocaleDateString("en-IN", { weekday: "short" })
        : date.toLocaleDateString("en-IN", { month: "short" });
      const current = buckets.get(key) || { label, completed: 0 };
      current.completed += 1; buckets.set(key, current);
    });
    return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
  }, [completed, range, chartMode, today]);

  const workload = useMemo(() => {
    const byMember = new Map();
    tasks.forEach((task) => {
      const user = task.assignedTo;
      if (!user) return;
      const id = typeof user === "string" ? user : user._id;
      if (!id) return;
      const member = byMember.get(id) || {
        id, name: typeof user === "object" ? (user.name || user.email || "Team member") : "Team member",
        total: 0, completed: 0,
      };
      member.total += 1;
      if (task.status === "Completed") member.completed += 1;
      byMember.set(id, member);
    });
    return [...byMember.values()].sort((a, b) => b.total - a.total);
  }, [tasks]);

  const exportReport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Tasks completed", completed.length],
      ["Total tasks", tasks.length],
      ["On-time rate", onTimeRate === null ? "Not available" : `${onTimeRate}%`],
      ["Average cycle time (days)", averageCycle ?? "Not available"],
      ["Overdue tasks", overdue.length],
      [], ["Team member", "Assigned tasks", "Completed tasks"],
      ...workload.map((member) => [member.name, member.total, member.completed]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "taskflow-analytics.csv"; anchor.click();
    URL.revokeObjectURL(url); toast.success("Analytics report exported");
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center bg-[#f5f6fc] text-slate-500"><RefreshCw className="mr-3 animate-spin text-indigo-600" />Loading analytics...</div>;

  const maxWorkload = Math.max(1, ...workload.map((member) => member.total));

  return (
    <main className="min-h-screen bg-[#f5f6fc] px-5 py-7 md:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-[#151b42]">Analytics</h1><p className="mt-1 text-sm text-slate-500">Track delivery, workload and team performance.</p></div>
          <div className="flex flex-wrap items-center gap-3">
            <select value={range} onChange={(e) => setRange(Number(e.target.value))} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500">
              {ranges.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <button onClick={exportReport} className="flex items-center gap-2 rounded-xl bg-[#5145ed] px-4 py-3 text-sm font-semibold text-white hover:bg-[#4035d5]"><Download size={17} />Export report</button>
            <button onClick={() => loadAnalytics(true)} disabled={refreshing} title="Refresh" className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600"><RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /></button>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Tasks completed" value={Number(overview.completedTasks ?? completed.length)} detail={`${Number(overview.totalTasks ?? tasks.length)} total tasks`} icon={<CheckCircle2 size={23} />} color="green" />
          <MetricCard title="On-time rate" value={onTimeRate ?? "—"} suffix={onTimeRate === null ? "" : "%"} detail={onTimeRate === null ? "Needs completedAt and dueDate" : "Completed by the due date"} icon={<TrendingUp size={23} />} color="blue" />
          <MetricCard title="Avg. cycle time" value={averageCycle ?? "—"} suffix={averageCycle === null ? "" : "d"} detail={averageCycle === null ? "Needs startDate and completedAt" : "Start to completion"} icon={<Clock3 size={23} />} color="purple" />
          <MetricCard title="Overdue" value={overdue.length} detail="Uncompleted tasks past due date" icon={<AlertCircle size={23} />} color="red" />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="font-bold text-[#151b42]">Tasks completed</h2><p className="mt-1 text-xs text-slate-400">Completed tasks during the selected period</p></div>
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button onClick={() => setChartMode("week")} className={`rounded-md px-4 py-2 text-xs font-semibold ${chartMode === "week" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}>Week</button>
                <button onClick={() => setChartMode("month")} className={`rounded-md px-4 py-2 text-xs font-semibold ${chartMode === "month" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}>Month</button>
              </div>
            </div>
            {chartData.length ? <div className="h-[280px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
              <defs><linearGradient id="taskCompletedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5145ed" stopOpacity={0.22} /><stop offset="95%" stopColor="#5145ed" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="#edf0f7" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} /><Tooltip contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 12 }} /><Area type="monotone" dataKey="completed" name="Completed tasks" stroke="#5145ed" strokeWidth={2.5} fill="url(#taskCompletedFill)" activeDot={{ r: 5, strokeWidth: 0 }} />
            </AreaChart></ResponsiveContainer></div> : <div className="flex h-[280px] flex-col items-center justify-center rounded-xl bg-slate-50 px-6 text-center"><Activity size={30} className="mb-3 text-slate-300" /><p className="text-sm font-semibold text-slate-600">No completion trend available</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">The chart needs a saved completedAt date on completed tasks. Your current analytics endpoint only returns a monthly total.</p></div>}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5"><h2 className="font-bold text-[#151b42]">Workload by member</h2><p className="mt-1 text-xs text-slate-400">Tasks assigned to each team member</p></div>
            {workload.length ? <div className="space-y-5">{workload.map((member, index) => {
              const pending = member.total - member.completed;
              return <div key={member.id}><div className="mb-2 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${["bg-indigo-100 text-indigo-700", "bg-sky-100 text-sky-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700"][index % 4]}`}>{member.name.charAt(0).toUpperCase()}</div><p className="truncate text-sm font-semibold text-slate-700">{member.name}</p></div><span className="shrink-0 text-xs text-slate-500">{member.total} tasks</span></div><div className="ml-11 flex h-2 overflow-hidden rounded-full bg-slate-100"><div className="bg-emerald-500" style={{ width: `${member.completed / maxWorkload * 100}%` }} /><div className="bg-amber-400" style={{ width: `${pending / maxWorkload * 100}%` }} /></div></div>;
            })}</div> : <div className="flex min-h-[220px] flex-col items-center justify-center text-center"><Users size={30} className="mb-3 text-slate-300" /><p className="text-sm font-semibold text-slate-600">No assigned tasks yet</p><p className="mt-1 text-xs text-slate-400">Assigned tasks will appear here by team member.</p></div>}
            <div className="mt-7 flex gap-4 border-t border-slate-100 pt-4"><span className="flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500" />Completed</span><span className="flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-amber-400" />Pending</span></div>
          </div>
        </section>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4"><p className="flex items-center gap-2 text-sm text-slate-600"><CalendarDays size={17} className="text-indigo-600" />Showing {ranges.find((item) => item.value === range)?.label.toLowerCase()}</p><p className="text-xs text-slate-400">Analytics are calculated from your organization's task records.</p></div>
      </div>
    </main>
  );
}
