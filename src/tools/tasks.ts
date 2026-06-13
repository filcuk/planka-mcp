/**
 * Task tools for PLANKA MCP server.
 */
import {
  createTasks,
  updateTask,
  deleteTask,
  createTaskList,
  updateTaskList,
  deleteTaskList,
} from "../operations/tasks.js";
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

export const createTasksTool = defineTool("modify", {
  name: "planka_create_tasks",
  description: "Add one or more tasks (checklist items) to a card.",
  inputSchema: {
    type: "object" as const,
    properties: {
      cardId: {
        type: "string",
        description: "The card ID",
      },
      tasks: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        description: "Task names to create",
      },
    },
    required: ["cardId", "tasks"],
  },
  handler: async (params: { cardId: string; tasks: string[] }) => {
    try {
      const tasks = await createTasks({
        cardId: params.cardId,
        tasks: params.tasks.map((name) => ({ name })),
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                tasksCreated: tasks.length,
                tasks: tasks.map((task) => ({
                  id: task.id,
                  name: task.name,
                  isCompleted: task.isCompleted,
                })),
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

export const updateTaskTool = defineTool("modify", {
  name: "planka_update_task",
  description:
    "Update a task's name, completion status, position, assignee, or linked card.",
  inputSchema: {
    type: "object" as const,
    properties: {
      taskId: {
        type: "string",
        description: "The task ID",
      },
      name: {
        type: "string",
        description: "New task name",
      },
      isCompleted: {
        type: "boolean",
        description: "Mark as complete/incomplete",
      },
      position: {
        type: "number",
        description: "New position within the task list",
      },
      assigneeUserId: {
        type: ["string", "null"],
        description: "User ID to assign (null to unassign)",
      },
      linkedCardId: {
        type: ["string", "null"],
        description: "Card ID to link this task to (null to unlink)",
      },
    },
    required: ["taskId"],
  },
  handler: async (params: {
    taskId: string;
    name?: string;
    isCompleted?: boolean;
    position?: number;
    assigneeUserId?: string | null;
    linkedCardId?: string | null;
  }) => {
    try {
      const { taskId, ...updates } = params;

      const filteredUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) filteredUpdates.name = updates.name;
      if (updates.isCompleted !== undefined)
        filteredUpdates.isCompleted = updates.isCompleted;
      if (updates.position !== undefined)
        filteredUpdates.position = updates.position;
      if (updates.assigneeUserId !== undefined)
        filteredUpdates.assigneeUserId = updates.assigneeUserId;
      if (updates.linkedCardId !== undefined)
        filteredUpdates.linkedCardId = updates.linkedCardId;

      const task = await updateTask(taskId, filteredUpdates);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                task: {
                  id: task.id,
                  name: task.name,
                  isCompleted: task.isCompleted,
                  position: task.position,
                  assigneeUserId: task.assigneeUserId,
                  linkedCardId: task.linkedCardId,
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

export const deleteTaskTool = defineTool("delete", {
  name: "planka_delete_task",
  description: "Delete a task from a card.",
  inputSchema: {
    type: "object" as const,
    properties: {
      taskId: {
        type: "string",
        description: "The task ID to delete",
      },
    },
    required: ["taskId"],
  },
  handler: async (params: { taskId: string }) => {
    try {
      await deleteTask(params.taskId);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                message: `Task ${params.taskId} deleted`,
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

export const modifyTaskListsTool = defineTool("modify", {
  name: "planka_modify_task_lists",
  description:
    "Create or update named task lists (checklists) on a card.",
  inputSchema: {
    type: "object" as const,
    properties: {
      action: {
        type: "string",
        enum: ["create", "update"],
        description: "Action to perform",
      },
      cardId: {
        type: "string",
        description: "Card ID (required for create)",
      },
      taskListId: {
        type: "string",
        description: "Task list ID (required for update)",
      },
      name: {
        type: "string",
        description: "Task list name (required for create)",
      },
      position: {
        type: "number",
        description: "Task list position",
      },
      showOnFrontOfCard: {
        type: "boolean",
        description: "Show checklist summary on card front",
      },
      hideCompletedTasks: {
        type: "boolean",
        description: "Hide completed tasks in the checklist",
      },
    },
    required: ["action"],
  },
  handler: async (params: {
    action: "create" | "update";
    cardId?: string;
    taskListId?: string;
    name?: string;
    position?: number;
    showOnFrontOfCard?: boolean;
    hideCompletedTasks?: boolean;
  }) => {
    try {
      if (params.action === "create") {
        if (!params.cardId || !params.name) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: cardId and name are required for create action",
              },
            ],
            isError: true,
          };
        }

        const taskList = await createTaskList(
          params.cardId,
          params.name,
          params.position
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  taskList: {
                    id: taskList.id,
                    name: taskList.name,
                    position: taskList.position,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      if (!params.taskListId) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: taskListId is required for update action",
            },
          ],
          isError: true,
        };
      }

      const updates: Record<string, unknown> = {};
      if (params.name !== undefined) updates.name = params.name;
      if (params.position !== undefined) updates.position = params.position;
      if (params.showOnFrontOfCard !== undefined)
        updates.showOnFrontOfCard = params.showOnFrontOfCard;
      if (params.hideCompletedTasks !== undefined)
        updates.hideCompletedTasks = params.hideCompletedTasks;

      const taskList = await updateTaskList(params.taskListId, updates);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                taskList: {
                  id: taskList.id,
                  name: taskList.name,
                  position: taskList.position,
                  showOnFrontOfCard: taskList.showOnFrontOfCard,
                  hideCompletedTasks: taskList.hideCompletedTasks,
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

export const deleteTaskListTool = defineTool("delete", {
  name: "planka_delete_task_list",
  description: "Delete a task list (checklist) and all its tasks from a card.",
  inputSchema: {
    type: "object" as const,
    properties: {
      taskListId: {
        type: "string",
        description: "Task list ID to delete",
      },
    },
    required: ["taskListId"],
  },
  handler: async (params: { taskListId: string }) => {
    try {
      await deleteTaskList(params.taskListId);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                message: `Task list ${params.taskListId} deleted`,
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

export const taskTools = [
  createTasksTool,
  updateTaskTool,
  deleteTaskTool,
  modifyTaskListsTool,
  deleteTaskListTool,
];
