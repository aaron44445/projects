import { getProjects, createProject } from "@/lib/projects";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(getProjects());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const project = createProject(body);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
