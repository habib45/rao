"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/admin/_components/ui/tabs";
import { ClicksTable } from "./ClicksTable";
import { PriceHistoryChart } from "./PriceHistoryChart";

interface ProductOption {
  id: string;
  name: Record<string, string>;
  asin: string;
}

export function AnalyticsTabs({ products }: { products: ProductOption[] }) {
  return (
    <Tabs defaultValue="clicks">
      <TabsList>
        <TabsTrigger value="clicks">Click Analytics</TabsTrigger>
        <TabsTrigger value="price">Price History</TabsTrigger>
      </TabsList>

      <TabsContent value="clicks" className="mt-4">
        <ClicksTable />
      </TabsContent>

      <TabsContent value="price" className="mt-4">
        <PriceHistoryChart products={products} />
      </TabsContent>
    </Tabs>
  );
}
