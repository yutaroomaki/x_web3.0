"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { formatDate, getRiskColor } from "@/lib/utils";
import {
  ArrowLeft,
  Copy,
  Check,
  X,
  Send,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

type DraftDetail = {
  draft: {
    id: string;
    postText: string;
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
    updatedAt: string;
  };
  ingestItem: {
    url: string;
    publishedAt: string;
    platform: string;
    language: string | null;
    text: string | null;
  };
  analysis: {
    hookType: string;
    ctaType: string;
    emotionProfile: Record<string, number>;
    templateGuess: string;
    summary: string;
    risks: Record<string, unknown>;
  } | null;
  outline: {
    templateType: string;
    hookDraft: string;
    keyPoints: string[];
    ctaDraft: string;
    emotionPlan: Record<string, number>;
  } | null;
};

export default function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<DraftDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const res = await fetch(`/api/drafts/${id}`);
        const json = await res.json();
        if (json.ok) {
          setData(json.data);
          setPostText(json.data.draft.postText);
        }
      } catch (error) {
        console.error("Failed to fetch draft:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDraft();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/drafts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postText }),
      });
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDecision = async (action: "approve" | "reject" | "posted") => {
    setSaving(true);
    try {
      await fetch(`/api/drafts/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          editedText: postText !== data?.draft.postText ? postText : undefined,
          note: note || undefined,
        }),
      });
      router.push("/drafts");
    } catch (error) {
      console.error("Failed to submit decision:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(postText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">Draft not found</p>
        </main>
      </div>
    );
  }

  const { draft, ingestItem, analysis } = data;
  const riskFlags = draft.riskFlags;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push("/drafts")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-grow">
            <h1 className="text-xl font-bold text-gray-900">Review Draft</h1>
          </div>
          <Badge
            variant={
              draft.status === "pending"
                ? "warning"
                : draft.status === "approved"
                  ? "success"
                  : draft.status === "rejected"
                    ? "danger"
                    : "info"
            }
          >
            {draft.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Text Editor */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Post Text</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {postText.length}/280
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Edit the post text..."
                />
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <Button
                  variant="secondary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  Save Changes
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    onClick={() => handleDecision("reject")}
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleDecision("posted")}
                    disabled={saving}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Mark as Posted
                  </Button>
                </div>
              </CardFooter>
            </Card>

            {/* Note */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold">Decision Note (Optional)</h2>
              </CardHeader>
              <CardContent>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Add a note about your decision..."
                />
              </CardContent>
            </Card>

            {/* Original Content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Original Content</h2>
                  <a
                    href={ingestItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Source
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 mb-2">
                  Platform: {ingestItem.platform} | Published:{" "}
                  {formatDate(ingestItem.publishedAt)}
                  {ingestItem.language && ` | Language: ${ingestItem.language}`}
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                  {ingestItem.text || "(No text available)"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Metrics */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold">Metrics</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Trend Score</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                        style={{ width: `${draft.trendScore}%` }}
                      />
                    </div>
                    <span className="font-bold text-lg">
                      {draft.trendScore}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Template</div>
                  <Badge>{draft.templateType}</Badge>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    Emotion Triggers
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(draft.emotionTriggers as string[]).map((trigger, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded"
                      >
                        {trigger}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Flags */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <h2 className="font-semibold">Risk Assessment</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hype Level</span>
                  <span
                    className={`font-medium ${getRiskColor(riskFlags.hype_level)}`}
                  >
                    {riskFlags.hype_level}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Info Certainty</span>
                  <span
                    className={`font-medium ${getRiskColor(riskFlags.info_certainty)}`}
                  >
                    {riskFlags.info_certainty}
                  </span>
                </div>
                {riskFlags.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Notes</div>
                    <p className="text-sm text-gray-800">{riskFlags.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analysis */}
            {analysis && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold">Viral Analysis</h2>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Hook Type</span>
                    <Badge>{analysis.hookType}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">CTA Type</span>
                    <Badge>{analysis.ctaType}</Badge>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Summary</div>
                    <p className="text-sm text-gray-800">{analysis.summary}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardContent className="text-sm text-gray-600 space-y-1">
                <div>Created: {formatDate(draft.createdAt)}</div>
                <div>Updated: {formatDate(draft.updatedAt)}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
