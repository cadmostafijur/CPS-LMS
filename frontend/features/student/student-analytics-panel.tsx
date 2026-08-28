"use client";

import {
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  Star,
  Trophy,
  Video,
} from "lucide-react";
import { StatsCard } from "@/components/shared/stats-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { StudentAnalytics } from "@/types";
import { cn } from "@/lib/utils";

function PanelCard({
  title,
  children,
  className,
  action,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-border/80 bg-white p-5 shadow-sm",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-semibold text-navy">{title}</h3>
        {action}
      </div>
      {children}
    </article>
  );
}

function DonutChart({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative mx-auto h-36 w-36">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="12"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#f97316"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold text-navy">{pct}%</span>
        <span className="text-xs text-muted-foreground">Health</span>
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
    { icon: FileText, label: "Assignment mark" },
  ];

  return (
    <ul className="space-y-2.5 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange">
            <item.icon className="h-3.5 w-3.5" />
          </span>
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
      <div className="mb-3">
        <Badge variant="outline" className="rounded-full font-normal">
          {monthLabel}
        </Badge>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const done = completedDays.includes(day);
          return (
            <div
              key={day}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg text-xs font-medium",
                done
                  ? "bg-orange text-white shadow-sm"
                  : "bg-surface text-muted-foreground"
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

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function VideoBarChart({ data }: { data: StudentAnalytics["videoByDay"] }) {
  const totalMinutes = data.reduce((s, d) => s + d.minutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const max = Math.max(1, ...data.map((d) => d.minutes));

  if (!data.length) {
    return <ChartEmpty message="No video activity recorded yet." />;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Total:{" "}
        <span className="font-medium text-navy">
          {hours} hr{hours !== 1 ? "s" : ""} {mins} min
        </span>
      </p>
      <div className="flex h-36 items-end gap-2">
        {data.map((d) => {
          const h = d.minutes > 0 ? Math.max(6, (d.minutes / max) * 100) : 4;
          return (
            <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end justify-center">
                <div
                  className={cn(
                    "w-full max-w-8 rounded-t-lg transition-all",
                    d.minutes > 0 ? "bg-orange/80" : "bg-border"
                  )}
                  style={{ height: `${h}%` }}
                />
              </div>
              <span className="truncate text-[10px] text-muted-foreground">{d.label}</span>
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
  if (!data.length) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange/10 text-orange">
            <Star className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-xl font-bold text-navy">—</p>
            <p className="text-xs text-muted-foreground">No graded assignments yet</p>
          </div>
        </div>
        <ChartEmpty message="Submit assignments and get them graded to see your trend here." />
      </div>
    );
  }

  const points = data;
  const maxY = Math.max(50, ...points.map((p) => p.score), 1);
  const width = 320;
  const height = 120;
  const padX = 12;
  const padY = 12;
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
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange/10 text-orange">
          <Star className="h-4 w-4" />
        </span>
        <div>
          <p className="font-display text-xl font-bold text-navy">{avg}</p>
          <p className="text-xs text-muted-foreground">Avg assignment mark</p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl bg-surface/80 p-3">
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
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            );
          })}
          <path
            d={linePath}
            fill="none"
            stroke="#f97316"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {coords.map((c) => (
            <circle key={c.label} cx={c.x} cy={c.y} r="4" fill="#f97316" />
          ))}
          {coords.map((c) => (
            <text
              key={`${c.label}-label`}
              x={c.x}
              y={height + 16}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
              fill="#64748b"
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
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Health score"
          value={`${data.healthCheck}%`}
          description="Overall learning health"
          icon={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange/10 text-orange">
              <BarChart3 className="h-4 w-4" />
            </span>
          }
        />
        <StatsCard
          title="Quiz average"
          value={`${data.avgQuizMark}%`}
          description={`${data.quiz.completed} passed · ${data.quiz.attempted} attempted`}
          icon={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange/10 text-orange">
              <ClipboardList className="h-4 w-4" />
            </span>
          }
        />
        <StatsCard
          title="Lessons done"
          value={data.lessonsCompleted}
          description="Completed lessons"
          icon={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange/10 text-orange">
              <BookOpen className="h-4 w-4" />
            </span>
          }
        />
        <StatsCard
          title="Reward points"
          value={data.rewardPoints}
          description="Earned from activity"
          icon={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange/10 text-orange">
              <Trophy className="h-4 w-4" />
            </span>
          }
        />
      </div>

      <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-sm font-semibold text-navy">Module progress</p>
            <p className="text-xs text-muted-foreground">Across all enrolled courses</p>
          </div>
          <span className="font-display text-lg font-bold text-navy">{data.moduleProgress}%</span>
        </div>
        <Progress value={data.moduleProgress} className="h-2.5" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title="Health check">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
            <DonutChart value={data.healthCheck} />
            <HealthLegend />
          </div>
        </PanelCard>

        <PanelCard title="Quiz performance">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-4xl font-bold text-navy">{data.avgQuizMark}%</p>
              <p className="mt-1 text-sm text-muted-foreground">Average mark</p>
            </div>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-success" />
                Passed (80%+): <span className="font-medium text-navy">{data.quiz.completed}</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-orange" />
                Not attempted: <span className="font-medium text-navy">{data.quiz.incomplete}</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-border" />
                Total: <span className="font-medium text-navy">{data.quiz.total}</span>
              </li>
            </ul>
          </div>
        </PanelCard>

        <PanelCard title="Module finish track">
          <ModuleCalendar
            monthKey={data.calendarMonth}
            completedDays={data.completedDays}
          />
        </PanelCard>

        <PanelCard
          title="Video duration"
          action={
            <Badge variant="outline" className="rounded-full text-[10px] font-normal">
              Weekly
            </Badge>
          }
        >
          <VideoBarChart data={data.videoByDay} />
        </PanelCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <PanelCard title="Rewards">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange/10 text-orange">
              <Trophy className="h-7 w-7" />
            </span>
            <p className="mt-4 font-display text-4xl font-bold text-navy">
              {data.rewardPoints}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Total reward points</p>
          </div>
        </PanelCard>

        <PanelCard title="Assignment analytics">
          <AssignmentLineChart
            data={data.assignmentSeries}
            avg={data.avgAssignmentMark}
          />
        </PanelCard>
      </div>
    </div>
  );
}
