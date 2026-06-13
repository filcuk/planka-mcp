/**
 * Custom field tools for PLANKA MCP server.
 */
import {
  setCustomFieldValue,
  clearCustomFieldValue,
} from "../operations/custom-fields.js";
import { PlankaError } from "../errors.js";
import { defineTool } from "./types.js";

function handleError(error: unknown) {
  if (error instanceof PlankaError) {
    return {
      content: [{ type: "text" as const, text: `Error: ${error.message}` }],
      isError: true,
    };
  }
  throw error;
}

export const setCustomFieldValueTool = defineTool("modify", {
  name: "planka_set_custom_field_value",
  description:
    "Set a custom field value on a card. Use field names from planka_get_card or planka_get_board output.",
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
        type: "string",
        description: "Field value to set",
      },
    },
    required: ["cardId", "fieldName", "value"],
  },
  handler: async (params: {
    cardId: string;
    fieldName: string;
    value: string;
  }) => {
    try {
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
      return handleError(error);
    }
  },
});

export const clearCustomFieldValueTool = defineTool("delete", {
  name: "planka_clear_custom_field_value",
  description: "Clear a custom field value on a card.",
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
    },
    required: ["cardId", "fieldName"],
  },
  handler: async (params: { cardId: string; fieldName: string }) => {
    try {
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
    } catch (error) {
      return handleError(error);
    }
  },
});

export const customFieldTools = [
  setCustomFieldValueTool,
  clearCustomFieldValueTool,
];
