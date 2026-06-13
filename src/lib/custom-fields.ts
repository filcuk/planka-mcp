/**
 * Helpers for resolving custom field data.
 */
import {
  CustomField,
  CustomFieldGroup,
  CustomFieldValue,
} from "../schemas/entities.js";

export interface CustomFieldDisplay {
  name: string;
  value: string;
  customFieldId: string;
  customFieldGroupId: string;
}

export function formatCustomFields(
  groups: CustomFieldGroup[],
  fields: CustomField[],
  values: CustomFieldValue[]
): CustomFieldDisplay[] {
  const fieldById = new Map(fields.map((field) => [field.id, field]));
  const groupById = new Map(groups.map((group) => [group.id, group]));

  return values
    .map((value) => {
      const field = fieldById.get(value.customFieldId);
      const group = groupById.get(value.customFieldGroupId);
      const name = field?.name ?? group?.name ?? value.customFieldId;
      return {
        name,
        value: value.content,
        customFieldId: value.customFieldId,
        customFieldGroupId: value.customFieldGroupId,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function resolveCustomFieldIds(
  fieldName: string,
  groups: CustomFieldGroup[],
  fields: CustomField[],
  values: CustomFieldValue[]
): { customFieldId: string; customFieldGroupId: string } | undefined {
  const normalizedName = fieldName.toLowerCase();

  for (const field of fields) {
    if (field.name.toLowerCase() === normalizedName) {
      const groupId =
        field.customFieldGroupId ??
        values.find((value) => value.customFieldId === field.id)
          ?.customFieldGroupId;
      if (groupId) {
        return { customFieldId: field.id, customFieldGroupId: groupId };
      }
    }
  }

  for (const group of groups) {
    if (group.name?.toLowerCase() === normalizedName) {
      const field = fields.find((f) => f.customFieldGroupId === group.id);
      if (field) {
        return { customFieldId: field.id, customFieldGroupId: group.id };
      }
    }
  }

  return undefined;
}
