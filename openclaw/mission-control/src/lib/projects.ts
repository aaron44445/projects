import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import type { Project } from "./types";

const DATA_PATH = join(process.cwd(), "data", "projects.json");

export function getProjects(): Project[] {
  if (!existsSync(DATA_PATH)) return [];
  const raw = readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

export function getProject(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

export function saveProjects(projects: Project[]): void {
  const dir = dirname(DATA_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(projects, null, 2));
}

export function createProject(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Project {
  const projects = getProjects();
  const newProject: Project = {
    ...project,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projects.push(newProject);
  saveProjects(projects);
  return newProject;
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() };
  saveProjects(projects);
  return projects[idx];
}

export function deleteProject(id: string): boolean {
  const projects = getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) return false;
  saveProjects(filtered);
  return true;
}
