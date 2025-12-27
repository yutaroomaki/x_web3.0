"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { formatDate } from "@/lib/utils";
import { Plus, RefreshCw, X, Database, Rss, Youtube, Twitter } from "lucide-react";

type Source = {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
};

const sourceTypeIcons: Record<string, React.ElementType> = {
  X_SEARCH: Twitter,
  RSS: Rss,
  YOUTUBE_SEARCH: Youtube,
  YOUTUBE_CHANNEL: Youtube,
  MANUAL: Database,
};

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: "RSS",
    name: "",
    config: "{}",
    enabled: true,
  });

  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sources");
      const data = await res.json();
      if (data.ok) {
        setSources(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          config: JSON.parse(formData.config),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setShowModal(false);
        setFormData({ type: "RSS", name: "", config: "{}", enabled: true });
        fetchSources();
      }
    } catch (error) {
      console.error("Failed to create source:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sources</h1>
            <p className="text-gray-600">
              Manage data sources for content collection
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={fetchSources} disabled={loading}>
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Source
            </Button>
          </div>
        </div>

        {/* Sources Grid */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Loading sources...</p>
          </div>
        ) : sources.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Database className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No sources configured</p>
              <p className="text-sm text-gray-400 mt-1">
                Add a source to start collecting content
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map((source) => {
              const Icon = sourceTypeIcons[source.type] || Database;
              return (
                <Card key={source.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {source.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge>{source.type}</Badge>
                          <Badge variant={source.enabled ? "success" : "default"}>
                            {source.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-500">
                      <div className="bg-gray-50 rounded p-2 font-mono text-xs overflow-x-auto">
                        {JSON.stringify(source.config, null, 2)}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="text-xs text-gray-500">
                    Created: {formatDate(source.createdAt)}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Source Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Add New Source</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="X_SEARCH">X Search</option>
                    <option value="RSS">RSS Feed</option>
                    <option value="YOUTUBE_SEARCH">YouTube Search</option>
                    <option value="YOUTUBE_CHANNEL">YouTube Channel</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CoinDesk RSS"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Config (JSON)
                  </label>
                  <textarea
                    value={formData.config}
                    onChange={(e) =>
                      setFormData({ ...formData, config: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm h-24"
                    placeholder='{"url": "https://..."}'
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) =>
                      setFormData({ ...formData, enabled: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="enabled" className="text-sm text-gray-700">
                    Enabled
                  </label>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Source</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
