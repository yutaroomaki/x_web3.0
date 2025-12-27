"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { TEMPLATES, type Template, type TemplateCategory } from "@/lib/pipeline/templates";
import { Search, Filter, LayoutTemplate } from "lucide-react";

const categoryLabels: Record<TemplateCategory, string> = {
  urgency: "Urgency",
  fomo: "FOMO",
  education: "Education",
  story: "Story",
  controversy: "Controversy",
  data: "Data",
};

const categoryColors: Record<TemplateCategory, string> = {
  urgency: "bg-red-100 text-red-800",
  fomo: "bg-orange-100 text-orange-800",
  education: "bg-blue-100 text-blue-800",
  story: "bg-purple-100 text-purple-800",
  controversy: "bg-yellow-100 text-yellow-800",
  data: "bg-green-100 text-green-800",
};

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "">("");
  const [hookFilter, setHookFilter] = useState<Template["hook_type"] | "">("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const filteredTemplates = TEMPLATES.filter((template) => {
    if (search && !template.name.toLowerCase().includes(search.toLowerCase()) &&
        !template.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (categoryFilter && template.category !== categoryFilter) {
      return false;
    }
    if (hookFilter && template.hook_type !== hookFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Post Templates (30 Types)
          </h1>
          <p className="text-gray-600">
            Reference templates for generating viral X posts
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-grow min-w-[200px]">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="flex-grow px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as TemplateCategory | "")
                }
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={hookFilter}
                onChange={(e) =>
                  setHookFilter(e.target.value as Template["hook_type"] | "")
                }
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Hook Types</option>
                <option value="question">Question</option>
                <option value="shock">Shock</option>
                <option value="empathy">Empathy</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.code}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTemplate(template)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <span className="text-xs text-gray-400">{template.code}</span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      categoryColors[template.category]
                    }`}
                  >
                    {categoryLabels[template.category]}
                  </span>
                  <Badge>{template.hook_type}</Badge>
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  {template.description}
                </p>

                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap line-clamp-4">
                  {template.example}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <LayoutTemplate className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No templates match your filters</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTemplate(null)}
        >
          <Card
            className="w-full max-w-2xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedTemplate.name}</h2>
                  <p className="text-sm text-gray-500">{selectedTemplate.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      categoryColors[selectedTemplate.category]
                    }`}
                  >
                    {categoryLabels[selectedTemplate.category]}
                  </span>
                  <Badge>{selectedTemplate.hook_type}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Description</h3>
                <p className="text-gray-600">{selectedTemplate.description}</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-1">Structure</h3>
                <div className="space-y-2">
                  <div className="p-2 bg-blue-50 rounded">
                    <span className="text-xs font-medium text-blue-700">HOOK:</span>
                    <p className="text-sm text-gray-800">{selectedTemplate.structure.hook}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="text-xs font-medium text-gray-700">BODY:</span>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {selectedTemplate.structure.body}
                    </p>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <span className="text-xs font-medium text-green-700">CTA:</span>
                    <p className="text-sm text-gray-800">{selectedTemplate.structure.cta}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-1">Example</h3>
                <div className="p-4 bg-gray-900 text-white rounded-lg text-sm whitespace-pre-wrap font-mono">
                  {selectedTemplate.example}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
