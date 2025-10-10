import type { FoodItem } from "../infra/tool.foods";

export type ConfirmationRequest = {
  sourceId: string;
  message: string;
  items: FoodItem[];
  onConfirm: () => Promise<void>;
  onCancel?: () => Promise<void>;
};

export interface ConfirmationPort {
  requestConfirmation(request: ConfirmationRequest): Promise<void>;
  sendResult(result: { sourceId: string; text: string }): Promise<void>;
}
