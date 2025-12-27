"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { Play, RefreshCw, Clock, CheckCircle, XCircle, Loader } from "lucide-react";

type Job = {
  id: string;
  jobType: string;
  status: string;
  stats: Record<string, unknown>;
  error: Record<string, unknown> | null;
  startedAt: string;
  finishedAt: string | null;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (data.ok) {
        setJobs(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  const runJob = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/jobs/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun: false,
          maxItems: 200,
          fromHours: 72,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        fetchJobs();
      }
    } catch (error) {
      console.error("Failed to run job:", error);
    } finally {
      setRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "running":
        return "info";
      case "success":
        return "success";
      case "failed":
        return "danger";
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
            <h1 className="text-2xl font-bold text-gray-900">Job History</h1>
            <p className="text-gray-600">View and manage pipeline executions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={fetchJobs}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button onClick={runJob} disabled={running}>
              <Play className={`w-4 h-4 mr-2 ${running ? "animate-pulse" : ""}`} />
              {running ? "Running..." : "Run Pipeline"}
            </Button>
          </div>
        </div>

        {/* Jobs List */}
        {loading && jobs.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No jobs have been run yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Click &quot;Run Pipeline&quot; to start processing
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="flex items-start gap-4 py-6">
                  <div className="flex-shrink-0">
                    {getStatusIcon(job.status)}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {job.jobType}
                      </span>
                      <Badge variant={getStatusVariant(job.status)}>
                        {job.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatRelativeTime(job.startedAt)}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                      {Object.entries(job.stats).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-gray-500">{key}:</span>{" "}
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Error */}
                    {job.error && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm text-red-800 font-mono">
                          {JSON.stringify(job.error, null, 2)}
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Started: {formatDate(job.startedAt)}</span>
                      {job.finishedAt && (
                        <span>Finished: {formatDate(job.finishedAt)}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
