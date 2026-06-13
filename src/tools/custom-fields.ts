/**
 * Custom field tools for PLANKA MCP server.
 */
import {
  setCustomFieldValue,
  clearCustomFieldValue,
} from "../operations/custom-fields.js";
import { PlankaError } from "../errors.js";

/**
 * Tool: planka_set_custom_field_values
 * Set or clear custom field values on a card by field name.
 */
export const setCustomFieldValuesTool = {
  name: "planka_set_custom_field_values",
  description:
    "Set or clear custom field values on a card. Use field names from planka_get_card or planka_get_board output.",
  inputSchema: {
    type: "object" as const,
    properties: {
      cardId: {
        type: "string",
        description: "The card ID",
      },
      fieldName: {
        type: "string",
        description: "Custom field name (case-insensitive)",
      },
      value: {
        type: ["string", "null"],
        description: "Field value to set, or null to clear",
      },
    },
    required: ["cardId", "fieldName", "value"],
  },
  handler: async (params: {
    cardId: string;
    fieldName: string;
    value: string | null;
  }) => {
    try {
      if (params.value === null) {
        await clearCustomFieldValue({
          cardId: params.cardId,
          fieldName: params.fieldName,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  cardId: params.cardId,
                  fieldName: params.fieldName,
                  cleared: true,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const fieldValue = await setCustomFieldValue({
        cardId: params.cardId,
        fieldName: params.fieldName,
        content: params.value,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                field: {
                  name: params.fieldName,
                  value: fieldValue.content,
                  customFieldId: fieldValue.customFieldId,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      if (error instanceof PlankaError) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }
      throw error;
    }
  },
};

export const customFieldTools = [setCustomFieldValuesTool];
