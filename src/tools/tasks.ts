/**
 * Task tools for PLANKA MCP server.
 */
import {
  createTasks,
  updateTask,
  deleteTask,
  createTaskList,
  deleteTaskList,
} from "../operations/tasks.js";
import { PlankaError } from "../errors.js";

/**
 * Tool: planka_create_tasks
 * Add one or more tasks (checklist items) to a card.
 */
export const createTasksTool = {
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

/**
 * Tool: planka_update_task
 * Update a task's name or completion status.
 */
export const updateTaskTool = {
  name: "planka_update_task",
  description:
    "Update a task's name, completion status, position, or assignee.",
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
    },
    required: ["taskId"],
  },
  handler: async (params: {
    taskId: string;
    name?: string;
    isCompleted?: boolean;
    position?: number;
    assigneeUserId?: string | null;
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

/**
 * Tool: planka_delete_task
 * Delete a task from a card.
 */
export const deleteTaskTool = {
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

/**
 * Tool: planka_manage_task_lists
 * Create or delete task lists (checklists) on a card.
 */
export const manageTaskListsTool = {
  name: "planka_manage_task_lists",
  description: "Create or delete named task lists (checklists) on a card.",
  inputSchema: {
    type: "object" as const,
    properties: {
      action: {
        type: "string",
        enum: ["create", "delete"],
        description: "Action to perform",
      },
      cardId: {
        type: "string",
        description: "Card ID (required for create)",
      },
      taskListId: {
        type: "string",
        description: "Task list ID (required for delete)",
      },
      name: {
        type: "string",
        description: "Task list name (required for create)",
      },
      position: {
        type: "number",
        description: "Task list position",
      },
    },
    required: ["action"],
  },
  handler: async (params: {
    action: "create" | "delete";
    cardId?: string;
    taskListId?: string;
    name?: string;
    position?: number;
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
              text: "Error: taskListId is required for delete action",
            },
          ],
          isError: true,
        };
      }

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

export const taskTools = [
  createTasksTool,
  updateTaskTool,
  deleteTaskTool,
  manageTaskListsTool,
];
