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

const BOARD_FETCH_CONCURRENCY = 5;

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
 * Run async work over items with a fixed concurrency limit.
 */
async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await fn(items[index]);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
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

async function fetchBoardLists(board: Board): Promise<{
  board: Board;
  lists: List[];
}> {
  const boardResponse = await plankaClient.get<unknown>(
    `/api/boards/${board.id}`
  );
  const included = (boardResponse as Record<string, unknown>).included as
    | Record<string, unknown>
    | undefined;
  const lists = included?.lists
    ? z.array(ListSchema).parse(included.lists)
    : [];

  return {
    board,
    lists: lists.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  };
}

/**
 * Get the full structure: projects -> boards -> lists.
 * Board fetches run with bounded concurrency (no lighter lists-only endpoint exists).
 */
export async function getStructure(projectId?: string): Promise<ProjectStructure[]> {
  const { projects, boards } = await getProjects();

  const targetProjects = projectId
    ? projects.filter((p) => p.id === projectId)
    : projects;

  const boardsToFetch = targetProjects.flatMap((project) =>
    boards.filter((b) => b.projectId === project.id)
  );

  const boardsWithLists = await mapPool(
    boardsToFetch,
    BOARD_FETCH_CONCURRENCY,
    fetchBoardLists
  );

  const boardsByProject = new Map<string, ProjectStructure["boards"]>();
  for (const entry of boardsWithLists) {
    const list = boardsByProject.get(entry.board.projectId) || [];
    list.push(entry);
    boardsByProject.set(entry.board.projectId, list);
  }

  return targetProjects.map((project) => ({
    project,
    boards: (boardsByProject.get(project.id) || []).sort(
      (a, b) => a.board.position - b.board.position
    ),
  }));
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
