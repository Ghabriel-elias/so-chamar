"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { api } from "@/utils/api";
import { messageFrom } from "@/utils/api/errors";
import { useBookingByToken } from "@/utils/api/queries";
import { goToField, problemsFrom } from "@/utils/forms/problems";
import { useRouter } from "@/utils/navigation";

export function useCustomerAvaliacao(token: string) {
  const tField = useTranslations("fieldNames");
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const { data, loading } = useBookingByToken(token);
  const missing = attempted && rating === 0;

  async function send() {
    if (rating === 0) {
      setAttempted(true);
      goToField("review-rating");
      return;
    }

    setSaving(true);
    setFailure(null);

    try {
      await api.submitReview(token, {
        rating,
        comment: comment.trim() || undefined,
      });
      router.replace(`/a/${token}`);
    } catch (problem) {
      setFailure(messageFrom(problem));
      setSaving(false);
    }
  }

  return {
    loading,
    booking: data,
    canReview: Boolean(data?.actions.includes("review")),
    rating,
    setRating,
    comment,
    setComment,
    missing,
    saving,
    failure,
    problems: problemsFrom(missing ? { rating: "ratingRequired" } : {}, [
      {
        key: "rating",
        name: tField("rating"),
        target: "review-rating",
        empty: true,
      },
    ]),
    send,
  };
}
