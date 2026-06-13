/**
 * Project operations for PLANKA API.
 */
import { plankaClient } from "../client.js";
import { Project, Board, List, ListSchema } from "../schemas/entities.js";
import { ProjectsResponse, ProjectsIncludedSchema, ProjectResponse } from "../schemas/responses.js";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  CreateProjectInput,
  UpdateProjectInput,
} from "../schemas/requests.js";
import { z } from "zod";

/**
 * Full project structure with boards and lists.
 */
export interface ProjectStructure {
  project: Project;
  boards: Array<{
    board: Board;
    lists: List[];
  }>;
}

/**
 * Get all projects with their boards.
 */
export async function getProjects(): Promise<{
  projects: Project[];
  boards: Board[];
}> {
  const response = await plankaClient.get<unknown>("/api/projects");
  const parsed = ProjectsResponse.parse(response);
  const included = ProjectsIncludedSchema.parse(
    (response as Record<string, unknown>).included || {}
  );

  return {
    projects: parsed.items,
    boards: included.boards || [],
  };
}

/**
 * Get the full structure: projects -> boards -> lists.
 */
export async function getStructure(projectId?: string): Promise<ProjectStructure[]> {
  const { projects, boards } = await getProjects();

  // Filter to specific project if requested
  const targetProjects = projectId
    ? projects.filter((p) => p.id === projectId)
    : projects;

  const structures: ProjectStructure[] = [];

  for (const project of targetProjects) {
    const projectBoards = boards.filter((b) => b.projectId === project.id);
    const boardsWithLists: ProjectStructure["boards"] = [];

    for (const board of projectBoards) {
      // Get board details to get lists
      const boardResponse = await plankaClient.get<unknown>(
        `/api/boards/${board.id}`
      );
      const included = (boardResponse as Record<string, unknown>).included as
        | Record<string, unknown>
        | undefined;
      const lists = included?.lists
        ? z.array(ListSchema).parse(included.lists)
        : [];

      boardsWithLists.push({
        board,
        lists: lists.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
      });
    }

    structures.push({
      project,
      boards: boardsWithLists.sort(
        (a, b) => a.board.position - b.board.position
      ),
    });
  }

  return structures;
}

/**
 * Create a project. The current user becomes a project manager.
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  const validated = CreateProjectSchema.parse(input);

  const response = await plankaClient.post<unknown>("/api/projects", {
    type: validated.type,
    name: validated.name,
    description: validated.description,
  });

  const parsed = ProjectResponse.parse(response);
  return parsed.item;
}

/**
 * Update a project.
 */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
): Promise<Project> {
  const validated = UpdateProjectSchema.parse(input);

  const response = await plankaClient.patch<unknown>(
    `/api/projects/${projectId}`,
    validated
  );

  const parsed = ProjectResponse.parse(response);
  return parsed.item;
}

/**
 * Delete a project (must have no boards).
 */
export async function deleteProject(projectId: string): Promise<void> {
  await plankaClient.delete(`/api/projects/${projectId}`);
}
