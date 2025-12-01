// Project routes - CRUD operations for projects

import type { CreateProjectRequest, Project, ProjectListResponse, ProjectResponse, UpdateProjectRequest } from '@venus/types';
import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import { prisma } from '@venus/types';

const router = Router();

// ==================================================
// Zod validation schemas
// ==================================================

const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).optional(),
    type: z.enum(['album', 'main-project']),
  }),
});

const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(100).optional(),
    content: z.any().optional(),
    status: z.enum(['draft', 'published']).optional(),
  }),
});

const projectIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

// Validation middleware
const validate = (schema: any) => {
  return (req: Request, res: Response, next: any) => {
    try {
      schema.parse(req);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
};

// ==================================================
// Routes
// ==================================================

// GET /projects - List user's projects
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { page = 1, limit = 20, status } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const offset = (pageNum - 1) * limitNum;

    const where: any = { accountId: userId };
    if (status) where.status = status;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limitNum,
      }),
      prisma.project.count({ where }),
    ]);

    const response: ProjectListResponse = {
      projects,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('List projects error', { error: (error as Error).message, userId: req.user?.userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list projects',
      },
    });
  }
});

// POST /projects - Create new project
router.post('/', authenticateToken, validate(createProjectSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const data: CreateProjectRequest = req.body;

    // Generate slug if not provided
    let finalSlug = data.slug;
    if (!finalSlug) {
      finalSlug = data.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    // Check if slug is unique for this user
    const existingProject = await prisma.project.findFirst({
      where: {
        accountId: userId,
        slug: finalSlug,
      },
    });

    if (existingProject) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'SLUG_EXISTS',
          message: 'Project with this slug already exists',
        },
      });
    }

    // Check main-project uniqueness
    if (data.type === 'main-project') {
      const existingMainProject = await prisma.project.findFirst({
        where: {
          accountId: userId,
          type: 'main-project',
        },
      });

      if (existingMainProject) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'MAIN_PROJECT_EXISTS',
            message: 'Only one main-project is allowed per account',
          },
        });
      }
    }

    // Create default placeholders based on project type
    const defaultPlaceholders = [];

    if (data.type === 'album') {
      // Full album with all placeholder types
      defaultPlaceholders.push(
        {
          id: 'cover-1',
          type: 'cover',
          order: 1,
          content: {
            image: null,
            title: data.title,
            subtitle: 'Project subtitle'
          }
        },
        {
          id: 'meta-1',
          type: 'meta',
          order: 2,
          content: {
            role: 'Designer',
            year: new Date().getFullYear(),
            industry: 'Design',
            client: 'Client Name'
          }
        },
        {
          id: 'context-1',
          type: 'context',
          order: 3,
          content: {
            problem: 'Describe the problem this project solves',
            goals: ['Goal 1', 'Goal 2']
          }
        },
        {
          id: 'role-1',
          type: 'role',
          order: 4,
          content: {
            title: 'My Role',
            description: 'Describe your role in this project',
            responsibilities: ['Responsibility 1', 'Responsibility 2']
          }
        },
        {
          id: 'process-1',
          type: 'process',
          order: 5,
          content: {
            description: 'Describe the development process',
            images: [],
            stages: [
              { title: 'Planning', description: 'Initial planning phase' },
              { title: 'Design', description: 'Design phase' },
              { title: 'Development', description: 'Implementation phase' }
            ]
          }
        },
        {
          id: 'gallery-1',
          type: 'gallery',
          order: 6,
          content: {
            images: [],
            layout: 'grid'
          }
        },
        {
          id: 'technical-1',
          type: 'technical',
          order: 7,
          content: {
            tools: ['Tool 1', 'Tool 2'],
            stack: ['Technology 1', 'Technology 2'],
            technologies: ['Tech 1', 'Tech 2']
          }
        },
        {
          id: 'results-1',
          type: 'results',
          order: 8,
          content: {
            description: 'Project outcomes and results',
            metrics: [
              { label: 'Completion', value: '100%', unit: '%' },
              { label: 'Satisfaction', value: 5, unit: '/5' }
            ]
          }
        },
        {
          id: 'credits-1',
          type: 'credits',
          order: 9,
          content: {
            team: [
              { name: 'Team Member', role: 'Role' }
            ],
            acknowledgments: 'Special thanks to...'
          }
        }
      );
    } else if (data.type === 'main-project') {
      // Main project with minimal placeholders
      defaultPlaceholders.push(
        {
          id: 'cover-1',
          type: 'cover',
          order: 1,
          content: {
            image: null,
            title: data.title,
            subtitle: 'Portfolio overview'
          }
        },
        {
          id: 'meta-1',
          type: 'meta',
          order: 2,
          content: {
            role: 'Portfolio',
            year: new Date().getFullYear(),
            type: 'personal'
          }
        },
        {
          id: 'context-1',
          type: 'context',
          order: 3,
          content: {
            brief: 'Overview of my work and expertise'
          }
        }
      );
    }

    const project = await prisma.project.create({
      data: {
        accountId: userId,
        title: data.title,
        slug: finalSlug,
        type: data.type,
        content: JSON.stringify({ placeholders: defaultPlaceholders }),
        status: 'draft',
      },
    });

    // Return formatted response
    const responseProject = {
      id: project.id,
      title: project.title,
      slug: project.slug,
      type: project.type as any,
      content: JSON.parse(project.content),
      status: project.status as any,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };

    logger.info('Project created', { projectId: project.id, userId });

    const response: ProjectResponse = { project: responseProject as any };

    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Create project error', { error: (error as Error).message, userId: req.user?.userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create project',
      },
    });
  }
});

// GET /projects/:id - Get project details
router.get('/:id', authenticateToken, validate(projectIdSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const projectId = req.params.id;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        accountId: userId, // Only owner can view
      },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        content: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Project not found',
        },
      });
    }

    const response: ProjectResponse = { project };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Get project error', { error: (error as Error).message, projectId: req.params.id, userId: req.user?.userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get project',
      },
    });
  }
});

// PUT /projects/:id - Update project
router.put('/:id', authenticateToken, validate(updateProjectSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const projectId = req.params.id;
    const data: UpdateProjectRequest = req.body;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        accountId: userId, // Only owner can update
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Project not found',
        },
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        status: data.status,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        content: true,
        status: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info('Project updated', { projectId, userId });

    const response: ProjectResponse = { project: updatedProject };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Update project error', { error: (error as Error).message, projectId: req.params.id, userId: req.user?.userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update project',
      },
    });
  }
});

// DELETE /projects/:id - Delete project
router.delete('/:id', authenticateToken, validate(projectIdSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const projectId = req.params.id;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        accountId: userId, // Only owner can delete
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Project not found',
        },
      });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    logger.info('Project deleted', { projectId, userId });

    res.json({
      success: true,
      data: {
        message: 'Project deleted successfully',
      },
    });
  } catch (error) {
    logger.error('Delete project error', { error: (error as Error).message, projectId: req.params.id, userId: req.user?.userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete project',
      },
    });
  }
});

// ==================================================
// Admin Operations (require admin role)
// ==================================================

// GET /admin/projects - List all projects (admin only)
router.get('/admin/projects', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
    }

    const projects = await prisma.project.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        status: true,
        accountId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { projects },
    });
  } catch (error) {
    logger.error('Admin list projects error', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list projects',
      },
    });
  }
});

// DELETE /admin/projects/:id - Delete any project (admin only)
router.delete('/admin/projects/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
    }

    const projectId = req.params.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Project not found',
        },
      });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    logger.info('Project deleted by admin', { adminId: req.user!.userId, projectId });

    res.json({
      success: true,
      data: {
        message: 'Project deleted successfully',
      },
    });
  } catch (error) {
    logger.error('Admin delete project error', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete project',
      },
    });
  }
});

export default router;
