/**
 * Shared formatters for card tool output.
 */
import { CardDetails } from "../operations/cards.js";
import { getAttachmentUrl } from "./attachments.js";
import { formatCustomFields } from "./custom-fields.js";

export function formatCardDetails(details: CardDetails) {
  const usersById = new Map(details.users.map((user) => [user.id, user]));

  return {
    card: {
      id: details.card.id,
      name: details.card.name,
      description: details.card.description,
      listId: details.card.listId,
      boardId: details.card.boardId,
      type: details.card.type,
      dueDate: details.card.dueDate,
      isDueCompleted: details.card.isDueCompleted,
      isClosed: details.card.isClosed,
      coverAttachmentId: details.card.coverAttachmentId,
      createdAt: details.card.createdAt,
    },
    members: details.cardMemberships.map((membership) => {
      const user = usersById.get(membership.userId);
      return {
        userId: membership.userId,
        name: user?.name,
        username: user?.username,
      };
    }),
    taskLists: details.taskLists.map((taskList) => ({
      id: taskList.id,
      name: taskList.name,
      tasks: details.tasks
        .filter((task) => task.taskListId === taskList.id)
        .map((task) => ({
          id: task.id,
          name: task.name,
          isCompleted: task.isCompleted,
          assigneeUserId: task.assigneeUserId,
        })),
    })),
    comments: details.comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt,
    })),
    labels: details.cardLabels.map((cardLabel) => {
      const label = details.labels.find((l) => l.id === cardLabel.labelId);
      return {
        id: cardLabel.labelId,
        name: label?.name,
        color: label?.color,
      };
    }),
    attachments: details.attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      type: attachment.type,
      url: getAttachmentUrl(attachment),
    })),
    customFields: formatCustomFields(
      details.customFieldGroups,
      details.customFields,
      details.customFieldValues
    ),
  };
}
