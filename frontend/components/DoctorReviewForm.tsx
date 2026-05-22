import { Button, Card, Input, StarRating } from "@/components";
import { doctorReviewApi, type DoctorReviewRow, type DoctorReviewSummary } from "@/services/api/doctorReviewApi";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { useState } from "react";
import { Text, View } from "react-native";

export type DoctorReviewFormProps = {
  doctorId: string;
  bookingId: number;
  onSuccess?: (result: { review: DoctorReviewRow; summary: DoctorReviewSummary }) => void;
  onCancel?: () => void;
};

export function DoctorReviewForm({ doctorId, bookingId, onSuccess, onCancel }: DoctorReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (rating < 1) {
      setError("Үнэлгээ сонгоно уу.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await doctorReviewApi.create(doctorId, {
        booking_id: bookingId,
        rating,
        comment: comment.trim() || null,
      });
      onSuccess?.(result);
    } catch (e) {
      setError(toFriendlyErrorMn(e instanceof Error ? e.message : "Үнэлгээ илгээхэд алдаа гарлаа."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-brand-200 bg-app-card dark:border-brand-800">
      <Text className="text-base font-bold text-app-text">Үнэлгээ өгөх</Text>
      <Text className="mt-1 text-xs text-app-text-muted">Таны үзлэгийн туршлагыг хуваалцана уу.</Text>
      <View className="mt-4 items-center">
        <StarRating value={rating} onChange={setRating} size={32} />
      </View>
      <View className="mt-4">
        <Input
          label="Сэтгэгдэл (заавал биш)"
          multiline
          value={comment}
          onChangeText={setComment}
          placeholder="Эмчийн үйлчилгээний талаар бичнэ үү…"
        />
      </View>
      {error ? <Text className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</Text> : null}
      <Button label="Илгээх" loading={loading} onPress={() => void submit()} />
      {onCancel ? <Button label="Болих" variant="ghost" className="mt-2" onPress={onCancel} /> : null}
    </Card>
  );
}
