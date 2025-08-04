import { NextRequest, NextResponse } from 'next/server';
import { getProject, stopProject } from '@/lib/local-deployment';
import fs from 'fs/promises';
import path from 'path';

// GET /api/projects/[id] - Get specific project details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = getProject(params.id);
    
    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      project
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH /api/projects/[id] - Update project (start/stop)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action } = body;

    const project = getProject(params.id);
    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    if (action === 'stop') {
      await stopProject(params.id);
      
      return NextResponse.json({
        success: true,
        message: 'Project stopped successfully'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Supported actions: stop'
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to update project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete project completely
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = getProject(params.id);
    
    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }

    // Stop the project first if it's running
    if (project.status === 'running') {
      await stopProject(params.id);
    }

    // Remove project directory
    const projectsDir = path.join(process.cwd(), 'generated-apps');
    const projectPath = path.join(projectsDir, project.name);
    
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to remove project directory: ${error}`);
      // Continue with deletion even if directory removal fails
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to delete project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}