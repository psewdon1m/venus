// Project routes - CRUD operations for projects

import type { CreateProjectRequest, Project, ProjectListResponse, ProjectResponse, UpdateProjectRequest } from '@venus/types';
import { Request, Response, Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import { prisma } from '@venus/types';

const router = Router();

// ==================================================
// Validation middleware
// ==================================================

const createProjectValidation = [
  body('title').isString().isLength({ min: 1, max: 100 }).withMessage('Title must be 1-100 characters'),
  body('slug').optional().isString().isLength({ min: 1, max: 100 }).withMessage('Slug must be 1-100 characters'),
  body('type').isIn(['album', 'main-project']).withMessage('Type must be album or main-project'),
];

const updateProjectValidation = [
  param('id').isUUID().withMessage('Invalid project ID'),
  body('title').optional().isString().isLength({ min: 1, max: 100 }).withMessage('Title must be 1-100 characters'),
  body('slug').optional().isString().isLength({ min: 1, max: 100 }).withMessage('Slug must be 1-100 characters'),
  body('content').optional(),
  body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
];

const projectIdValidation = [
  param('id').isUUID().withMessage('Invalid project ID'),
];

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
router.post('/', authenticateToken, createProjectValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array(),
        },
      });
    }

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

    // Create default placeholders
    const defaultPlaceholders = [
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
        id: 'process-1',
        type: 'process',
        order: 3,
        content: {
          description: 'Project process description',
          images: []
        }
      }
    ];

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
router.get('/:id', authenticateToken, projectIdValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid project ID',
          details: errors.array(),
        },
      });
    }

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
router.put('/:id', authenticateToken, updateProjectValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array(),
        },
      });
    }

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
router.delete('/:id', authenticateToken, projectIdValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid project ID',
          details: errors.array(),
        },
      });
    }

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

export default router;
