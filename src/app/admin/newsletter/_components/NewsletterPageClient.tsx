"use client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/app/admin/_components/ui/tabs";
import { NewsletterSettingsForm } from "./NewsletterSettingsForm";
import { SubscribersTable } from "./SubscribersTable";

export function NewsletterPageClient() {
  return (
    <Tabs defaultValue="settings">
      <TabsList className="mb-6">
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
      </TabsList>
      <TabsContent value="settings">
        <NewsletterSettingsForm />
      </TabsContent>
      <TabsContent value="subscribers">
        <SubscribersTable />
      </TabsContent>
    </Tabs>
  );
}
