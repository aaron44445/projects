"use client";

import { BorderBeamCard } from "@/components/border-beam";
import {
  Users,
  MessageSquare,
  Phone,
  UserCheck,
  DollarSign,
} from "lucide-react";

const stats = [
  { label: "Total Leads", value: "0", icon: Users },
  { label: "DMs Sent", value: "0", icon: MessageSquare },
  { label: "Calls Booked", value: "0", icon: Phone },
  { label: "Active Clients", value: "0", icon: UserCheck },
  { label: "Pipeline Value", value: "$0", icon: DollarSign },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <BorderBeamCard key={stat.label} duration={4}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <Icon className="w-4 h-4 text-lume/60" />
                </div>
                <p className="text-3xl font-mono font-bold text-white">
                  {stat.value}
                </p>
              </div>
            </BorderBeamCard>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02]">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="font-heading text-sm font-semibold text-white">
            Recent Activity
          </h2>
        </div>
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-white/30 font-mono">
            No activity yet. Start by finding leads.
          </p>
        </div>
      </div>
    </div>
  );
}
