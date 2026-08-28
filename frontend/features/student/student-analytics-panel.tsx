"use client";

import {
  BarChart3,
  Calendar,
  ClipboardList,
  FileText,
  Info,
  Star,
  Trophy,
  Video,
} from "lucide-react";
import type { StudentAnalytics } from "@/types";
import { cn } from "@/lib/utils";

function PanelCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "relative rounded-2xl border border-white/10 bg-[#1a1f35] p-4 shadow-lg sm:p-5",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white/90">{title}</h3>
        <Info className="h-4 w-4 shrink-0 text-white/30" aria-hidden />
      </div>
      {children}
    </article>
  );
}

function DonutChart({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative mx-auto h-36 w-36 sm:h-40 sm:w-40">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="14"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#60a5fa"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-2xl font-bold text-white sm:text-3xl">
          {pct}%
        </span>
      </div>
    </div>
  );
}

function HealthLegend() {
  const items = [
    { icon: Calendar, label: "Module finish on time" },
    { icon: BarChart3, label: "Module progress" },
    { icon: ClipboardList, label: "Quiz mark" },
    { icon: Video, label: "Video duration" },
    { icon: FileText, label: "Assignment Mark" },
  ];

  return (
    <ul className="space-y-2 text-xs text-white/70 sm:text-sm">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <item.icon className="h-3.5 w-3.5 shrink-0 text-violet-300" />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

function ModuleCalendar({
  monthKey,
  completedDays,
}: {
  monthKey: string;
  completedDays: number[];
}) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthLabel = firstDay.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
          {monthLabel}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const done = completedDays.includes(day);
          return (
            <div
              key={day}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-[10px] font-medium sm:text-xs",
                done
                  ? "bg-violet-500/80 text-white"
                  : "bg-white/5 text-white/40"
              )}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VideoBarChart({ data }: { data: StudentAnalytics["videoByDay"] }) {
  const max = Math.max(1, ...data.map((d) => d.minutes));
  const totalMinutes = data.reduce((s, d) => s + d.minutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return (
    <div>
      <p className="mb-3 text-xs text-white/60">
        Total: {hours} Hour{hours !== 1 ? "s" : ""} and {mins} Minute
        {mins !== 1 ? "s" : ""}.
      </p>
      <div className="flex h-32 items-end gap-1 sm:gap-2">
        {data.map((d) => {
          const h = Math.max(4, (d.minutes / max) * 100);
          return (
            <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end justify-center">
                <div
                  className="w-full max-w-[28px] rounded-t bg-violet-500/70 transition-all"
                  style={{ height: `${h}%` }}
                />
              </div>
              <span className="truncate text-[9px] text-white/50 sm:text-[10px]">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AssignmentLineChart({
  data,
  avg,
}: {
  data: StudentAnalytics["assignmentSeries"];
  avg: number;
}) {
  const points = data.length ? data : [{ label: "A1", score: 0 }];
  const maxY = Math.max(50, ...points.map((p) => p.score), 1);
  const width = 320;
  const height = 120;
  const padX = 8;
  const padY = 8;
  const step = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = padX + i * step;
    const y = height - padY - (p.score / maxY) * (height - padY * 2);
    return { x, y, ...p };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Star className="h-4 w-4 text-amber-400" />
        <span className="text-lg font-semibold text-white">{avg}</span>
        <span className="text-sm text-white/60">Avg Assignment Mark</span>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height + 24}`}
          className="h-auto w-full min-w-[260px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = height - padY - t * (height - padY * 2);
            return (
              <line
                key={t}
                x1={padX}
                x2={width - padX}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
            );
          })}
          <path
            d={linePath}
            fill="none"
            stroke="#a78bfa"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {coords.map((c) => (
            <circle key={c.label} cx={c.x} cy={c.y} r="4" fill="#c4b5fd" />
          ))}
          {coords.map((c) => (
            <text
              key={`${c.label}-label`}
              x={c.x}
              y={height + 16}
              textAnchor="middle"
              className="fill-white/50 text-[10px]"
            >
              {c.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

export function StudentAnalyticsPanel({ data }: { data: StudentAnalytics }) {
  return (
    <div className="rounded-3xl bg-[#0b1020] p-4 sm:p-6 lg:p-8">
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <PanelCard title="Health Check">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
            <DonutChart value={data.healthCheck} />
            <HealthLegend />
          </div>
        </PanelCard>

        <PanelCard title="Quiz Mark">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="font-display text-4xl font-bold text-white sm:text-5xl">
                {data.avgQuizMark}%
              </p>
              <p className="mt-1 text-sm text-white/60">Avg mark%</p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-white/80">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                Complete Quiz: {data.quiz.completed}
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <span className="h-2 w-2 rounded-full bg-orange-400" />
                Incomplete Quiz: {data.quiz.incomplete}
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <span className="h-2 w-2 rounded-full bg-white/70" />
                Total Quiz: {data.quiz.total}
              </li>
            </ul>
          </div>
        </PanelCard>

        <PanelCard title="Module Finish Track">
          <ModuleCalendar
            monthKey={data.calendarMonth}
            completedDays={data.completedDays}
          />
        </PanelCard>

        <PanelCard title="Video Duration">
          <div className="mb-2 flex justify-end">
            <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60">
              Weekly
            </span>
          </div>
          <VideoBarChart data={data.videoByDay} />
        </PanelCard>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)] lg:gap-5">
        <PanelCard title="Reward">
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Trophy className="h-12 w-12 text-amber-400 sm:h-14 sm:w-14" />
            <p className="mt-3 font-display text-4xl font-bold text-white">
              {data.rewardPoints}
            </p>
            <p className="mt-1 text-sm text-white/60">Reward</p>
          </div>
        </PanelCard>

        <PanelCard title="Assignment Analytics">
          <AssignmentLineChart
            data={data.assignmentSeries}
            avg={data.avgAssignmentMark}
          />
        </PanelCard>
      </div>
    </div>
  );
}
