import { NextRequest, NextResponse } from 'next/server';
import { getProject, stopProject } from '@/lib/local-deployment';

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

// DELETE /api/projects/[id] - Stop a running project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await stopProject(params.id);

    return NextResponse.json({
      success: true,
      message: 'Project stopped successfully'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to stop project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}