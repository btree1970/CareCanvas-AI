import { NextRequest, NextResponse } from 'next/server';
import { 
  getRunningProjects, 
  getProject, 
  stopProject, 
  deployLocally 
} from '@/lib/local-deployment';

// GET /api/projects - List all running projects
export async function GET() {
  try {
    const projects = getRunningProjects();
    return NextResponse.json({
      success: true,
      projects
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/projects - Deploy a project locally
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, deploymentPackage } = body;

    if (!title || !deploymentPackage) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: title, deploymentPackage'
      }, { status: 400 });
    }

    const project = await deployLocally(title, deploymentPackage);

    return NextResponse.json({
      success: true,
      project,
      message: `Project deployed locally at ${project.url}`
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to deploy project locally',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}