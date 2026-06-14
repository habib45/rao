"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/app/admin/_components/ui/button";
import { Input } from "@/app/admin/_components/ui/input";
import { Select } from "@/app/admin/_components/ui/select";
import { Badge } from "@/app/admin/_components/ui/badge";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { ProductFAQ, LocaleCode } from "@/types/domain";

interface FAQEditorProps {
  productId: string;
}

interface FAQFormData {
  id?: string;
  question: string;
  answer: string;
  locale: LocaleCode;
  sort_order: number;
  is_active: boolean;
}

const LOCALES = [
  { code: "en" as const, label: "English" },
  { code: "bn-BD" as const, label: "Bangla" },
  { code: "sv" as const, label: "Swedish" },
];

export function FAQEditor({ productId }: FAQEditorProps) {
  const [faqs, setFaqs] = useState<FAQFormData[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newFAQ, setNewFAQ] = useState<FAQFormData>({
    question: "",
    answer: "",
    locale: "en",
    sort_order: 0,
    is_active: true,
  });

  const { data: existingFAQs, isLoading } = useQuery({
    queryKey: ["product-faqs", productId],
    queryFn: async () => {
      const res = await fetch(`/admin/api/products/${productId}/faqs`);
      if (!res.ok) throw new Error("Failed to fetch FAQs");
      return res.json() as unknown as ProductFAQ[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (faq: FAQFormData) => {
      const res = await fetch(`/admin/api/products/${productId}/faqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(faq),
      });
      if (!res.ok) throw new Error("Failed to create FAQ");
      return res.json() as unknown as ProductFAQ;
    },
    onSuccess: () => {
      toast.success("FAQ created successfully");
      setNewFAQ({ question: "", answer: "", locale: "en", sort_order: 0, is_active: true });
    },
    onError: () => {
      toast.error("Failed to create FAQ");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ faqId, data }: { faqId: string; data: Partial<FAQFormData> }) => {
      const res = await fetch(`/admin/api/products/${productId}/faqs/${faqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update FAQ");
      return res.json() as unknown as ProductFAQ;
    },
    onSuccess: () => {
      toast.success("FAQ updated successfully");
      setEditingIndex(null);
    },
    onError: () => {
      toast.error("Failed to update FAQ");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (faqId: string) => {
      const res = await fetch(`/admin/api/products/${productId}/faqs/${faqId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete FAQ");
    },
    onSuccess: () => {
      toast.success("FAQ deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete FAQ");
    },
  });

  const handleAddFAQ = () => {
    if (!newFAQ.question || !newFAQ.answer) {
      toast.error("Question and answer are required");
      return;
    }
    createMutation.mutate(newFAQ);
  };

  const handleUpdateFAQ = (index: number, faqId: string) => {
    const faq = faqs[index];
    updateMutation.mutate({ faqId, data: faq });
  };

  const handleDeleteFAQ = (faqId: string) => {
    if (confirm("Are you sure you want to delete this FAQ?")) {
      deleteMutation.mutate(faqId);
    }
  };

  const displayFAQs = existingFAQs ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Product FAQs</h3>
        <Badge variant="default">{displayFAQs.length} FAQs</Badge>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500">Loading FAQs...</div>
      ) : displayFAQs.length === 0 ? (
        <div className="text-sm text-gray-500">No FAQs yet. Add your first FAQ below.</div>
      ) : (
        <div className="space-y-3">
          {displayFAQs.map((faq, index) => (
            <div
              key={faq.id}
              className="border rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800"
            >
              {editingIndex === index ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Question"
                    value={faqs[index]?.question ?? faq.question}
                    onChange={(e) => {
                      const updated = [...faqs];
                      updated[index] = { ...updated[index], question: e.target.value };
                      setFaqs(updated);
                    }}
                  />
                  <textarea
                    placeholder="Answer"
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm"
                    value={faqs[index]?.answer ?? faq.answer}
                    onChange={(e) => {
                      const updated = [...faqs];
                      updated[index] = { ...updated[index], answer: e.target.value };
                      setFaqs(updated);
                    }}
                  />
                  <div className="flex gap-2">
                    <Select
                      value={faqs[index]?.locale ?? faq.locale}
                      onChange={(e) => {
                        const updated = [...faqs];
                        updated[index] = { ...updated[index], locale: e.target.value as LocaleCode };
                        setFaqs(updated);
                      }}
                    >
                      {LOCALES.map((locale) => (
                        <option key={locale.code} value={locale.code}>
                          {locale.label}
                        </option>
                      ))}
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateFAQ(index, faq.id)}
                      disabled={updateMutation.isPending}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingIndex(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <div className="font-medium">{faq.question}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {faq.answer}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="info" className="text-xs">
                          {faq.locale}
                        </Badge>
                        {!faq.is_active && (
                          <Badge variant="warning" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingIndex(index);
                          const updated = [...faqs];
                          updated[index] = {
                            id: faq.id,
                            question: faq.question,
                            answer: faq.answer,
                            locale: faq.locale,
                            sort_order: faq.sort_order,
                            is_active: faq.is_active,
                          };
                          setFaqs(updated);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteFAQ(faq.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-3">Add New FAQ</h4>
        <div className="space-y-3">
          <Input
            placeholder="Question"
            value={newFAQ.question}
            onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
          />
          <textarea
            placeholder="Answer"
            className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm"
            value={newFAQ.answer}
            onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
          />
          <div className="flex gap-2">
            <Select
              value={newFAQ.locale}
              onChange={(e) => setNewFAQ({ ...newFAQ, locale: e.target.value as LocaleCode })}
            >
              {LOCALES.map((locale) => (
                <option key={locale.code} value={locale.code}>
                  {locale.label}
                </option>
              ))}
            </Select>
            <Button
              onClick={handleAddFAQ}
              disabled={createMutation.isPending || !newFAQ.question || !newFAQ.answer}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
