"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircleIcon, PauseIcon, PlayIcon, ZapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  runAutomationNowAction,
  setAutomationEnabledAction,
  setAutomationPausedAction,
  updateAutomationSettingsAction,
} from "@/app/actions/automations";
import {
  AUTOMATION_SCHEDULES,
  SCHEDULE_LABELS,
  type AutomationSchedule,
} from "@/types";
import { formatRelative } from "@/lib/utils";

export interface AutomationCardData {
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  paused: boolean;
  schedule: string;
  dailyLimit: number;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  successRate: number | null;
  itemsProcessedToday: number;
  lastDurationMs: number | null;
  recentErrors: { at: Date; message: string }[];
}

export function AutomationCard({ automation }: { automation: AutomationCardData }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [showErrors, setShowErrors] = React.useState(false);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const runNow = async () => {
    setBusy(true);
    try {
      const result = await runAutomationNowAction(automation.key);
      if (result.errors.length && result.succeeded === 0) {
        toast.warning(result.errors[0]);
      } else {
        toast.success(
          `${automation.name}: ${result.succeeded}/${result.processed} item${result.processed === 1 ? "" : "s"} processed`
        );
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Run failed");
    } finally {
      setBusy(false);
    }
  };

  const status = !automation.enabled ? "off" : automation.paused ? "paused" : "on";

  return (
    <Card className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{automation.name}</h3>
            {status === "on" && <Badge variant="success">active</Badge>}
            {status === "paused" && <Badge variant="warning">paused</Badge>}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{automation.description}</p>
        </div>
        <Switch
          checked={automation.enabled}
          disabled={busy}
          onCheckedChange={(enabled) =>
            void act(() => setAutomationEnabledAction(automation.key, enabled))
          }
        />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
          <Stat label="Last run" value={automation.lastRunAt ? formatRelative(automation.lastRunAt) : "never"} />
          <Stat
            label="Next run"
            value={
              !automation.enabled || automation.paused
                ? "—"
                : automation.nextRunAt
                  ? automation.nextRunAt.getTime() <= Date.now()
                    ? "due now"
                    : formatRelative(automation.nextRunAt)
                  : "—"
            }
          />
          <Stat
            label="Duration"
            value={automation.lastDurationMs !== null ? `${(automation.lastDurationMs / 1000).toFixed(1)}s` : "—"}
          />
          <Stat label="Today" value={`${automation.itemsProcessedToday}/${automation.dailyLimit} items`} />
          <Stat
            label="Success rate"
            value={automation.successRate !== null ? `${automation.successRate}%` : "—"}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Schedule</Label>
            <Select
              value={automation.schedule}
              disabled={busy}
              onValueChange={(schedule) =>
                void act(() =>
                  updateAutomationSettingsAction(automation.key, {
                    schedule: schedule as AutomationSchedule,
                  })
                )
              }
            >
              <SelectTrigger className="h-7 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTOMATION_SCHEDULES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SCHEDULE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Daily limit</Label>
            <Input
              type="number"
              min={1}
              max={1000}
              defaultValue={automation.dailyLimit}
              disabled={busy}
              className="h-7 w-20 text-xs"
              onBlur={(e) => {
                const dailyLimit = Number(e.target.value);
                if (dailyLimit > 0 && dailyLimit !== automation.dailyLimit) {
                  void act(() => updateAutomationSettingsAction(automation.key, { dailyLimit }));
                }
              }}
            />
          </div>
          <div className="ml-auto flex gap-1.5">
            {automation.enabled && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() =>
                  void act(() => setAutomationPausedAction(automation.key, !automation.paused))
                }
              >
                {automation.paused ? (
                  <>
                    <PlayIcon /> Resume
                  </>
                ) : (
                  <>
                    <PauseIcon /> Pause
                  </>
                )}
              </Button>
            )}
            <Button size="sm" variant="outline" disabled={busy} onClick={runNow}>
              <ZapIcon /> {busy ? "Running…" : "Run now"}
            </Button>
          </div>
        </div>

        {/* Recent errors */}
        {automation.recentErrors.length > 0 && (
          <div className="space-y-1.5">
            <button
              onClick={() => setShowErrors((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-destructive cursor-pointer"
            >
              <AlertCircleIcon className="size-3.5" />
              {automation.recentErrors.length} recent error
              {automation.recentErrors.length === 1 ? "" : "s"}
            </button>
            {showErrors && (
              <div className="space-y-1">
                {automation.recentErrors.map((error, i) => (
                  <p
                    key={i}
                    className="rounded-md bg-destructive/8 px-2 py-1.5 text-[11px] leading-relaxed text-destructive"
                  >
                    <span className="opacity-70">{formatRelative(error.at)} — </span>
                    {error.message}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
