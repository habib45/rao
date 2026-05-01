"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/admin/_components/ui/tabs";
import { RegenerateButton } from "./RegenerateButton";
import { SitemapPreviewTable } from "./SitemapPreviewTable";
import { CustomEntriesPanel } from "./CustomEntriesPanel";
import { ExclusionsPanel } from "./ExclusionsPanel";
import { RobotsEditor } from "./RobotsEditor";

export function SitemapTabs() {
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
            <RegenerateButton />
          </div>

          <TabsContent value="preview">
            <SitemapPreviewTable />
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
