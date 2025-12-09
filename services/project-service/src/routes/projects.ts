// Project routes - CRUD operations for projects

import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z, type ZodTypeAny } from 'zod';

import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

import type { AuthenticatedRequest } from '../middleware/auth';
import type { ProjectListResponse, ProjectResponse } from '@venus/types';
import type { NextFunction, Request, Response } from 'express';

const prisma: PrismaClient = new PrismaClient();
const router: Router = Router();

const projectSelect = {
  id: true,
  accountId: true,
  title: true,
  slug: true,
  type: true,
  content: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
};

type ProjectEntity = {
  id: string;
  accountId: string;
  title: string;
  slug: string;
  type: string;
  content: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

const isProjectContent = (value: unknown): value is ProjectResponse['project']['content'] => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'placeholders' in (value as Record<string, unknown>)
  );
};

const parseProjectContent = (rawContent: string): ProjectResponse['project']['content'] => {
  try {
    const parsed: unknown = JSON.parse(rawContent);
    if (isProjectContent(parsed)) {
      return parsed;
    }
  } catch {
    // ignore JSON parsing errors
  }

  return { placeholders: [] };
};

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
const validate = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        });
        return;
      }
      next(error);
    }
  };
};

const asyncHandler = <Req extends Request>(
  handler: (req: Req, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Req, res: Response, next: NextFunction): void => {
    void handler(req, res, next);
  };
};

// ==================================================
// Routes
// ==================================================

// GET /projects - List user's projects
const formatProject = (project: ProjectEntity): ProjectResponse['project'] => {
  return {
    id: project.id,
    accountId: project.accountId,
    title: project.title,
    slug: project.slug,
    type: project.type as ProjectResponse['project']['type'],
    content: parseProjectContent(project.content),
    status: project.status as ProjectResponse['project']['status'],
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    publishedAt: project.publishedAt,
  };
};

router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { page = 1, limit = 20, status } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100);
      const offset = (pageNum - 1) * limitNum;

      const where: { accountId: string; status?: string } = { accountId: userId };
      if (status) {
        where.status = status as string;
      }

      const [projects, total] = await Promise.all([
        prisma.project
          .findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            skip: offset,
            take: limitNum,
            select: projectSelect,
          })
          .then((items) => items as ProjectEntity[]),
        prisma.project.count({ where }),
      ]);

      const formattedProjects = projects.map(formatProject);

      const response: ProjectListResponse = {
        projects: formattedProjects,
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
      logger.error('List projects error', {
        error: (error as Error).message,
        userId: req.user?.userId,
      });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list projects',
        },
      });
    }
  })
);

// POST /projects - Create new project
router.post(
  '/',
  authenticateToken,
  validate(createProjectSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const data = createProjectSchema.shape.body.parse(req.body);

      // Generate slug if not provided
      let finalSlug = data.slug;
      if (!finalSlug) {
        finalSlug = data.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }

      // Check if slug is unique for this user
      const existingProject = await prisma.project.findFirst({
        where: {
          accountId: userId,
          slug: finalSlug,
        },
      });

      if (existingProject) {
        res.status(409).json({
          success: false,
          error: {
            code: 'SLUG_EXISTS',
            message: 'Project with this slug already exists',
          },
        });
        return;
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
          res.status(409).json({
            success: false,
            error: {
              code: 'MAIN_PROJECT_EXISTS',
              message: 'Only one main-project is allowed per account',
            },
          });
          return;
        }
      }

      // Create default placeholders based on project type
      type PlaceholderBlock = {
        id: string;
        type: string;
        order: number;
        content: Record<string, unknown>;
      };

      const defaultPlaceholders: PlaceholderBlock[] = [];

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
              subtitle: 'Project subtitle',
            },
          },
          {
            id: 'meta-1',
            type: 'meta',
            order: 2,
            content: {
              role: 'Designer',
              year: new Date().getFullYear(),
              industry: 'Design',
              client: 'Client Name',
            },
          },
          {
            id: 'context-1',
            type: 'context',
            order: 3,
            content: {
              problem: 'Describe the problem this project solves',
              goals: ['Goal 1', 'Goal 2'],
            },
          },
          {
            id: 'role-1',
            type: 'role',
            order: 4,
            content: {
              title: 'My Role',
              description: 'Describe your role in this project',
              responsibilities: ['Responsibility 1', 'Responsibility 2'],
            },
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
                { title: 'Development', description: 'Implementation phase' },
              ],
            },
          },
          {
            id: 'gallery-1',
            type: 'gallery',
            order: 6,
            content: {
              images: [],
              layout: 'grid',
            },
          },
          {
            id: 'technical-1',
            type: 'technical',
            order: 7,
            content: {
              tools: ['Tool 1', 'Tool 2'],
              stack: ['Technology 1', 'Technology 2'],
              technologies: ['Tech 1', 'Tech 2'],
            },
          },
          {
            id: 'results-1',
            type: 'results',
            order: 8,
            content: {
              description: 'Project outcomes and results',
              metrics: [
                { label: 'Completion', value: '100%', unit: '%' },
                { label: 'Satisfaction', value: 5, unit: '/5' },
              ],
            },
          },
          {
            id: 'credits-1',
            type: 'credits',
            order: 9,
            content: {
              team: [{ name: 'Team Member', role: 'Role' }],
              acknowledgments: 'Special thanks to...',
            },
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
              subtitle: 'Portfolio overview',
            },
          },
          {
            id: 'meta-1',
            type: 'meta',
            order: 2,
            content: {
              role: 'Portfolio',
              year: new Date().getFullYear(),
              type: 'personal',
            },
          },
          {
            id: 'context-1',
            type: 'context',
            order: 3,
            content: {
              brief: 'Overview of my work and expertise',
            },
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
        select: projectSelect,
      });

      // Return formatted response
      const formattedProject = formatProject(project);

      logger.info('Project created', { projectId: project.id, userId });

      const response: ProjectResponse = { project: formattedProject };

      res.status(201).json({
        success: true,
        data: response,
      });
    } catch (error) {
      logger.error('Create project error', {
        error: (error as Error).message,
        userId: req.user?.userId,
      });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create project',
        },
      });
    }
  })
);

// GET /projects/:id - Get project details
router.get(
  '/:id',
  authenticateToken,
  validate(projectIdSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const projectId = req.params.id;

      const project = await prisma.project
        .findFirst({
          where: {
            id: projectId,
            accountId: userId, // Only owner can view
          },
          select: projectSelect,
        })
        .then((record) => (record as ProjectEntity | null));

      if (!project) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Project not found',
          },
        });
        return;
      }

      const response: ProjectResponse = { project: formatProject(project) };

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      logger.error('Get project error', {
        error: (error as Error).message,
        projectId: req.params.id,
        userId: req.user?.userId,
      });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get project',
        },
      });
    }
  })
);

// PUT /projects/:id - Update project
router.put(
  '/:id',
  authenticateToken,
  validate(updateProjectSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const projectId = req.params.id;
      const data = updateProjectSchema.shape.body.parse(req.body);

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          accountId: userId, // Only owner can update
        },
      });

      if (!project) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Project not found',
          },
        });
        return;
      }

      const updatedProject = await prisma.project
        .update({
          where: { id: projectId },
          data: {
            title: data.title,
            slug: data.slug,
            content: data.content ? JSON.stringify(data.content) : undefined,
            status: data.status,
          },
          select: projectSelect,
        })
        .then((record) => record as ProjectEntity);

      logger.info('Project updated', { projectId, userId });

      const response: ProjectResponse = { project: formatProject(updatedProject) };

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      logger.error('Update project error', {
        error: (error as Error).message,
        projectId: req.params.id,
        userId: req.user?.userId,
      });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update project',
        },
      });
    }
  })
);

// DELETE /projects/:id - Delete project
router.delete(
  '/:id',
  authenticateToken,
  validate(projectIdSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Project not found',
          },
        });
        return;
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
      logger.error('Delete project error', {
        error: (error as Error).message,
        projectId: req.params.id,
        userId: req.user?.userId,
      });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete project',
        },
      });
    }
  })
);

// ==================================================
// Admin Operations (require admin role)
// ==================================================

// GET /admin/projects - List all projects (admin only)
router.get(
  '/admin/projects',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      // Check if user is admin
      if (req.user!.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
        });
        return;
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
      logger.error('Admin list projects error', { error: (error as Error).message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list projects',
        },
      });
    }
  })
);

// DELETE /admin/projects/:id - Delete any project (admin only)
router.delete(
  '/admin/projects/:id',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      // Check if user is admin
      if (req.user!.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
        });
        return;
      }

      const projectId = req.params.id;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Project not found',
          },
        });
        return;
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
      logger.error('Admin delete project error', { error: (error as Error).message });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete project',
        },
      });
    }
  })
);

export default router;
