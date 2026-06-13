/**
 * Custom field value operations for PLANKA API.
 */
import { plankaClient } from "../client.js";
import { CustomFieldValue } from "../schemas/entities.js";
import { PlankaNotFoundError } from "../errors.js";
import { CustomFieldValueResponse } from "../schemas/responses.js";
import {
  SetCustomFieldValueSchema,
  ClearCustomFieldValueSchema,
  SetCustomFieldValueInput,
  ClearCustomFieldValueInput,
} from "../schemas/requests.js";
import { resolveCustomFieldIds } from "../lib/custom-fields.js";
import { getCard } from "./cards.js";

/**
 * Set a custom field value on a card by field name.
 */
export async function setCustomFieldValue(
  input: SetCustomFieldValueInput
): Promise<CustomFieldValue> {
  const validated = SetCustomFieldValueSchema.parse(input);
  const cardDetails = await getCard(validated.cardId);

  const ids = resolveCustomFieldIds(
    validated.fieldName,
    cardDetails.customFieldGroups,
    cardDetails.customFields,
    cardDetails.customFieldValues
  );

  if (!ids) {
    throw new PlankaNotFoundError("Custom field", validated.fieldName);
  }

  const response = await plankaClient.patch<unknown>(
    `/api/cards/${validated.cardId}/custom-field-values/customFieldGroupId:${ids.customFieldGroupId}:customFieldId:${ids.customFieldId}`,
    { content: validated.content }
  );

  const parsed = CustomFieldValueResponse.parse(response);
  return parsed.item;
}

/**
 * Clear a custom field value on a card by field name.
 */
export async function clearCustomFieldValue(
  input: ClearCustomFieldValueInput
): Promise<void> {
  const validated = ClearCustomFieldValueSchema.parse(input);
  const cardDetails = await getCard(validated.cardId);

  const ids = resolveCustomFieldIds(
    validated.fieldName,
    cardDetails.customFieldGroups,
    cardDetails.customFields,
    cardDetails.customFieldValues
  );

  if (!ids) {
    throw new PlankaNotFoundError("Custom field", validated.fieldName);
  }

  await plankaClient.delete(
    `/api/cards/${validated.cardId}/custom-field-value/customFieldGroupId:${ids.customFieldGroupId}:customFieldId:${ids.customFieldId}`
  );
}
