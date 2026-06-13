/**
 * Project and board management tools for PLANKA MCP server.
 */
import {
  createProject,
  updateProject,
  deleteProject,
} from "../operations/projects.js";
import {
  createBoard,
  updateBoard,
  deleteBoard,
} from "../operations/boards.js";
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

export const modifyProjectsTool = defineTool(
  "modify",
  {
    name: "planka_modify_projects",
    description:
      "Create or update projects. Requires appropriate project manager permissions.",
    inputSchema: {
      type: "object" as const,
      properties: {
        action: {
          type: "string",
          enum: ["create", "update"],
          description: "Action to perform",
        },
        projectId: {
          type: "string",
          description: "Project ID (required for update)",
        },
        type: {
          type: "string",
          enum: ["private", "shared"],
          description: "Project type (required for create)",
        },
        name: {
          type: "string",
          description: "Project name",
        },
        description: {
          type: ["string", "null"],
          description: "Project description",
        },
        isHidden: {
          type: "boolean",
          description: "Hide project from default views (update only)",
        },
      },
      required: ["action"],
    },
    handler: async (params: {
      action: "create" | "update";
      projectId?: string;
      type?: "private" | "shared";
      name?: string;
      description?: string | null;
      isHidden?: boolean;
    }) => {
      try {
        if (params.action === "create") {
          if (!params.type || !params.name) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Error: type and name are required for create action",
                },
              ],
              isError: true,
            };
          }

          const project = await createProject({
            type: params.type,
            name: params.name,
            description: params.description,
          });

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    success: true,
                    project: {
                      id: project.id,
                      name: project.name,
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        if (!params.projectId) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: projectId is required for update action",
              },
            ],
            isError: true,
          };
        }

        const updates: Record<string, unknown> = {};
        if (params.name !== undefined) updates.name = params.name;
        if (params.description !== undefined)
          updates.description = params.description;
        if (params.isHidden !== undefined) updates.isHidden = params.isHidden;

        const project = await updateProject(params.projectId, updates);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  project: {
                    id: project.id,
                    name: project.name,
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
  },
  { defaultEnabled: false }
);

export const deleteProjectTool = defineTool("delete", {
  name: "planka_delete_project",
  description:
    "Delete a project. The project must have no boards. Requires project manager permissions.",
  inputSchema: {
    type: "object" as const,
    properties: {
      projectId: {
        type: "string",
        description: "Project ID to delete",
      },
    },
    required: ["projectId"],
  },
  handler: async (params: { projectId: string }) => {
    try {
      await deleteProject(params.projectId);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                message: `Project ${params.projectId} deleted`,
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

export const modifyBoardsTool = defineTool(
  "modify",
  {
    name: "planka_modify_boards",
    description:
      "Create or update boards within a project. Requires project manager permissions for create; board members can subscribe on update.",
    inputSchema: {
      type: "object" as const,
      properties: {
        action: {
          type: "string",
          enum: ["create", "update"],
          description: "Action to perform",
        },
        projectId: {
          type: "string",
          description: "Project ID (required for create)",
        },
        boardId: {
          type: "string",
          description: "Board ID (required for update)",
        },
        name: {
          type: "string",
          description: "Board name",
        },
        position: {
          type: "number",
          description: "Board position within the project",
        },
        defaultView: {
          type: "string",
          enum: ["kanban", "grid", "list"],
          description: "Default board view (update only)",
        },
        defaultCardType: {
          type: "string",
          enum: ["project", "story"],
          description: "Default card type for new cards (update only)",
        },
        isSubscribed: {
          type: "boolean",
          description: "Subscribe/unsubscribe current user to board updates",
        },
      },
      required: ["action"],
    },
    handler: async (params: {
      action: "create" | "update";
      projectId?: string;
      boardId?: string;
      name?: string;
      position?: number;
      defaultView?: "kanban" | "grid" | "list";
      defaultCardType?: "project" | "story";
      isSubscribed?: boolean;
    }) => {
      try {
        if (params.action === "create") {
          if (!params.projectId || !params.name) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Error: projectId and name are required for create action",
                },
              ],
              isError: true,
            };
          }

          const board = await createBoard({
            projectId: params.projectId,
            name: params.name,
            position: params.position,
          });

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    success: true,
                    board: {
                      id: board.id,
                      name: board.name,
                      projectId: board.projectId,
                      position: board.position,
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        if (!params.boardId) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: boardId is required for update action",
              },
            ],
            isError: true,
          };
        }

        const updates: Record<string, unknown> = {};
        if (params.name !== undefined) updates.name = params.name;
        if (params.position !== undefined) updates.position = params.position;
        if (params.defaultView !== undefined)
          updates.defaultView = params.defaultView;
        if (params.defaultCardType !== undefined)
          updates.defaultCardType = params.defaultCardType;
        if (params.isSubscribed !== undefined)
          updates.isSubscribed = params.isSubscribed;

        const board = await updateBoard(params.boardId, updates);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  board: {
                    id: board.id,
                    name: board.name,
                    projectId: board.projectId,
                    position: board.position,
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
  },
  { defaultEnabled: false }
);

export const deleteBoardTool = defineTool("delete", {
  name: "planka_delete_board",
  description:
    "Delete a board and all its contents. Requires project manager permissions.",
  inputSchema: {
    type: "object" as const,
    properties: {
      boardId: {
        type: "string",
        description: "Board ID to delete",
      },
    },
    required: ["boardId"],
  },
  handler: async (params: { boardId: string }) => {
    try {
      await deleteBoard(params.boardId);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                message: `Board ${params.boardId} deleted`,
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

export const projectBoardTools = [
  modifyProjectsTool,
  deleteProjectTool,
  modifyBoardsTool,
  deleteBoardTool,
];
