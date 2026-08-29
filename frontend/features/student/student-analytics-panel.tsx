"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
  Star,
} from "lucide-react";
import { StatsCard } from "@/components/shared/stats-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { StudentAnalytics } from "@/types";
import { cn } from "@/lib/utils";

function PanelCard({
  title,
  children,
  className,
  action,
  description,
}: {
  title: string;
  description?: string;
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
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-sm font-semibold text-navy">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </article>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
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
      {completedDays.length === 0 ? (
        <ChartEmpty message="No lessons completed this month yet." />
      ) : (
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
      )}
    </div>
  );
}

function ActivityBarChart({ data }: { data: StudentAnalytics["activityByDay"] }) {
  const total = data.reduce((s, d) => s + d.lessons, 0);
  const max = Math.max(1, ...data.map((d) => d.lessons));

  if (!data.length || total === 0) {
    return <ChartEmpty message="Complete lessons to see your daily activity here." />;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Last 7 days:{" "}
        <span className="font-medium text-navy">
          {total} lesson{total !== 1 ? "s" : ""} completed
        </span>
      </p>
      <div className="flex h-36 items-end gap-2">
        {data.map((d) => {
          const h = d.lessons > 0 ? Math.max(8, (d.lessons / max) * 100) : 4;
          return (
            <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end justify-center">
                <div
                  className={cn(
                    "w-full max-w-8 rounded-t-lg transition-all",
                    d.lessons > 0 ? "bg-orange/80" : "bg-border"
                  )}
                  style={{ height: `${h}%` }}
                  title={`${d.lessons} lesson${d.lessons !== 1 ? "s" : ""}`}
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
      <ChartEmpty message="Submit assignments and get them graded to see your scores here." />
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
          <p className="text-xs text-muted-foreground">Average assignment score</p>
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

function hasAnyActivity(data: StudentAnalytics) {
  return (
    data.enrolledCourses > 0 ||
    data.lessonsCompleted > 0 ||
    data.quiz.attempted > 0 ||
    data.assignmentSeries.length > 0
  );
}

export function StudentAnalyticsPanel({ data }: { data: StudentAnalytics }) {
  if (!hasAnyActivity(data)) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No learning activity yet"
        description="Enroll in a course, complete lessons, and take quizzes — your real progress will show up here."
        action={
          <Button asChild>
            <Link href="/courses">Browse courses</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Course progress"
          value={`${data.moduleProgress}%`}
          description="Average across enrolled courses"
          icon={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange/10 text-orange">
              <BarChart3 className="h-4 w-4" />
            </span>
          }
        />
        <StatsCard
          title="Lessons completed"
          value={data.lessonsCompleted}
          description="From your lesson progress records"
          icon={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange/10 text-orange">
              <BookOpen className="h-4 w-4" />
            </span>
          }
        />
        <StatsCard
          title="Quiz average"
          value={data.quiz.attempted > 0 ? `${data.avgQuizMark}%` : "—"}
          description={
            data.quiz.attempted > 0
              ? `Best score per quiz · ${data.quizAttemptsTotal} attempt${data.quizAttemptsTotal !== 1 ? "s" : ""}`
              : "No quiz attempts yet"
          }
          icon={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange/10 text-orange">
              <ClipboardList className="h-4 w-4" />
            </span>
          }
        />
        <StatsCard
          title="Enrolled courses"
          value={data.enrolledCourses}
          description={
            data.completedCourses > 0
              ? `${data.completedCourses} fully completed`
              : "Active enrollments"
          }
          icon={
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange/10 text-orange">
              <GraduationCap className="h-4 w-4" />
            </span>
          }
        />
      </div>

      <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-sm font-semibold text-navy">Overall course progress</p>
            <p className="text-xs text-muted-foreground">
              Calculated from completed lessons ÷ total lessons per course
            </p>
          </div>
          <span className="font-display text-lg font-bold text-navy">{data.moduleProgress}%</span>
        </div>
        <Progress value={data.moduleProgress} className="h-2.5" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard
          title="Quiz performance"
          description="Counts from your enrolled courses and quiz attempts"
        >
          {data.quiz.total === 0 ? (
            <ChartEmpty message="No quizzes in your enrolled courses yet." />
          ) : (
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-4xl font-bold text-navy">
                  {data.quiz.attempted > 0 ? `${data.avgQuizMark}%` : "—"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Best-score average</p>
              </div>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Passed (80%+):{" "}
                  <span className="font-medium text-navy">{data.quiz.completed}</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-orange" />
                  Attempted:{" "}
                  <span className="font-medium text-navy">{data.quiz.attempted}</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-border" />
                  Not attempted:{" "}
                  <span className="font-medium text-navy">{data.quiz.incomplete}</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-navy/30" />
                  Total in courses:{" "}
                  <span className="font-medium text-navy">{data.quiz.total}</span>
                </li>
              </ul>
            </div>
          )}
        </PanelCard>

        <PanelCard
          title="Lesson activity calendar"
          description="Days you completed at least one lesson this month"
        >
          <ModuleCalendar monthKey={data.calendarMonth} completedDays={data.completedDays} />
        </PanelCard>

        <PanelCard
          title="Daily lesson completions"
          description="Real count from lesson progress — last 7 days"
          action={
            <Badge variant="outline" className="rounded-full text-[10px] font-normal">
              7 days
            </Badge>
          }
        >
          <ActivityBarChart data={data.activityByDay} />
        </PanelCard>

        <PanelCard
          title="Assignment scores"
          description={
            data.assignmentSeries.length > 0
              ? "Graded submissions from your courses"
              : "No graded assignments yet"
          }
        >
          <div className="flex items-start gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange/10 text-orange">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <AssignmentLineChart
                data={data.assignmentSeries}
                avg={data.avgAssignmentMark}
              />
            </div>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
