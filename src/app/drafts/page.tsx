"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { formatRelativeTime, getStatusColor, getRiskColor } from "@/lib/utils";
import { RefreshCw, Filter, ExternalLink } from "lucide-react";

type Draft = {
  id: string;
  status: string;
  trendScore: number;
  templateType: string;
  emotionTriggers: string[];
  riskFlags: {
    hype_level: string;
    info_certainty: string;
    notes: string;
  };
  createdAt: string;
  sourceUrl: string;
  publishedAt: string;
};

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [minScore, setMinScore] = useState<number>(0);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (minScore > 0) params.set("minScore", String(minScore));

      const res = await fetch(`/api/drafts?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setDrafts(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [statusFilter, minScore]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      case "posted":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Draft Posts</h1>
            <p className="text-gray-600">
              Review and manage generated X post drafts
            </p>
          </div>
          <Button onClick={fetchDrafts} disabled={loading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Filters:
              </span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="posted">Posted</option>
            </select>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Min Score:</label>
              <input
                type="number"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                min={0}
                max={100}
                className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Drafts List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Loading drafts...</p>
          </div>
        ) : drafts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No drafts found</p>
              <p className="text-sm text-gray-400 mt-1">
                Run a job to generate new drafts
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <Link key={draft.id} href={`/review/${draft.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-start gap-4">
                    {/* Score */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {draft.trendScore}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getStatusVariant(draft.status)}>
                          {draft.status}
                        </Badge>
                        <Badge>{draft.templateType}</Badge>
                        <span className="text-sm text-gray-500">
                          {formatRelativeTime(draft.createdAt)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {(draft.emotionTriggers as string[]).slice(0, 4).map(
                          (trigger, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded"
                            >
                              {trigger}
                            </span>
                          )
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <span
                          className={getRiskColor(draft.riskFlags.hype_level)}
                        >
                          Hype: {draft.riskFlags.hype_level}
                        </span>
                        <span
                          className={getRiskColor(
                            draft.riskFlags.info_certainty
                          )}
                        >
                          Certainty: {draft.riskFlags.info_certainty}
                        </span>
                        <a
                          href={draft.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Source
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
