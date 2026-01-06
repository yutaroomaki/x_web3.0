"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { formatRelativeTime, getStatusColor, getRiskColor } from "@/lib/utils";
import { RefreshCw, Filter, ExternalLink, Play, Pause } from "lucide-react";

type DraftVersion = {
  id: string;
  lengthCategory: "short" | "medium" | "long";
  lengthLabel: string;
  charCount: number;
  trendScore: number;
  status: string;
};

type DraftGroup = {
  id: string;
  groupId: string;
  title: string;
  status: string;
  trendScore: number;
  templateType: string;
  emotionTriggers: string[];
  riskFlags: {
    hype_level: string;
    info_certainty: string;
    notes: string;
  };
  versions: DraftVersion[];
  createdAt: string;
  sourceUrl: string;
  publishedAt: string;
};

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DraftGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalDrafts, setTotalDrafts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [lengthFilter, setLengthFilter] = useState<string>("");
  const [minScore, setMinScore] = useState<number>(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL / 1000);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDrafts = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (lengthFilter) params.set("lengthCategory", lengthFilter);
      if (minScore > 0) params.set("minScore", String(minScore));

      const res = await fetch(`/api/drafts?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setDrafts(data.data);
        setTotalCount(data.meta?.total || data.data.length);
        setTotalDrafts(data.meta?.totalDrafts || 0);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, lengthFilter, minScore]);

  // Initial fetch and filter change
  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh) {
      // Start countdown
      setCountdown(AUTO_REFRESH_INTERVAL / 1000);

      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) return AUTO_REFRESH_INTERVAL / 1000;
          return prev - 1;
        });
      }, 1000);

      // Start auto-refresh
      intervalRef.current = setInterval(() => {
        fetchDrafts(false);
      }, AUTO_REFRESH_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [autoRefresh, fetchDrafts]);

  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
  };

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

  const getLengthBadgeColor = (category: string) => {
    switch (category) {
      case "short":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "long":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Draft Posts
              <span className="ml-2 text-lg font-normal text-gray-500">
                ({drafts.length}トピック / {totalDrafts}件)
              </span>
            </h1>
            <p className="text-gray-600">
              Review and manage generated X post drafts
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-1">
                最終更新: {lastUpdated.toLocaleTimeString('ja-JP')}
                {autoRefresh && ` (${countdown}秒後に更新)`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "primary" : "secondary"}
              onClick={toggleAutoRefresh}
              className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {autoRefresh ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  自動更新ON
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  自動更新OFF
                </>
              )}
            </Button>
            <Button onClick={() => fetchDrafts()} disabled={loading}>
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              更新
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-center gap-4">
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

            <select
              value={lengthFilter}
              onChange={(e) => setLengthFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Lengths</option>
              <option value="short">200-400字</option>
              <option value="medium">500-1000字</option>
              <option value="long">1000字以上</option>
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
              <Link key={draft.groupId} href={`/review/${draft.id}`}>
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
                      {/* Title */}
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">
                        {draft.title}
                      </h3>

                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant={getStatusVariant(draft.status)}>
                          {draft.status}
                        </Badge>
                        <Badge>{draft.templateType}</Badge>
                        <span className="text-sm text-gray-500">
                          {formatRelativeTime(draft.createdAt)}
                        </span>
                      </div>

                      {/* Version badges */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {draft.versions.map((version) => (
                          <span
                            key={version.id}
                            className={`px-2 py-1 text-xs rounded-full border ${getLengthBadgeColor(version.lengthCategory)}`}
                          >
                            {version.lengthLabel} ({version.charCount}字)
                          </span>
                        ))}
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
