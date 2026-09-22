"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/admin/_components/ui/tabs";
import { RegenerateButton } from "./RegenerateButton";
import { SitemapUrlManager } from "./SitemapUrlManager";
import { SitemapPreviewTable } from "./SitemapPreviewTable";
import { CustomEntriesPanel } from "./CustomEntriesPanel";
import { ExclusionsPanel } from "./ExclusionsPanel";
import { RobotsEditor } from "./RobotsEditor";

type SitemapConfig = {
  baseUrl: string;
  lastGenerated: string | null;
  isAutoDetected: boolean;
};

export function SitemapTabs() {
  const [config, setConfig] = useState<SitemapConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const res = await fetch("/admin/api/sitemap?action=config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Failed to load sitemap config:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs defaultValue="preview" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="custom">Custom URLs</TabsTrigger>
              <TabsTrigger value="exclusions">Exclusions</TabsTrigger>
              <TabsTrigger value="robots">Robots.txt</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <SitemapUrlManager config={config} onConfigChange={loadConfig} loading={loading} />
              <RegenerateButton />
            </div>
          </div>

          <TabsContent value="preview">
            <SitemapPreviewTable currentBaseUrl={config?.baseUrl} />
          </TabsContent>
          <TabsContent value="custom">
            <CustomEntriesPanel />
          </TabsContent>
          <TabsContent value="exclusions">
            <ExclusionsPanel />
          </TabsContent>
          <TabsContent value="robots">
            <RobotsEditor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
