// Persona routes - CRUD operations for personas and placeholders

import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { z, type ZodTypeAny } from 'zod';

import { authenticateToken, requireAdmin, type AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

import type { NextFunction, Request, Response } from 'express';

const prisma: PrismaClient = new PrismaClient();
const router: Router = Router();

type PersonaProjectRecord = {
  id: string;
  personaId: string;
  projectId: string;
  displayOrder: number;
  isVisible: boolean;
};

type PlaceholderContent = Record<string, unknown>;

interface PersonaPlaceholder {
  id: string;
  type: string;
  order: number;
  content: PlaceholderContent;
  enabled: boolean;
}

type PersonaSettings = {
  placeholders?: PersonaPlaceholder[];
  [key: string]: unknown;
};

type PersonaUpdateData = {
  displayName?: string;
  manifest?: string | null;
  settings?: string;
};

type PersonaProjectWithProject = PersonaProjectRecord & {
  project: {
    id: string;
    title: string;
    slug: string;
    type: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

type PersonaProjectUpdateData = {
  displayOrder?: number;
  isVisible?: boolean;
};

const parsePersonaSettings = (settings: string | null | undefined): PersonaSettings => {
  if (!settings) {
    return {};
  }

  try {
    return JSON.parse(settings) as PersonaSettings;
  } catch {
    return {};
  }
};

// ==================================================
// Zod validation schemas
// ==================================================

const createPersonaSchema = z.object({
  body: z.object({
    displayName: z.string().min(1).max(100),
    manifest: z.string().optional(),
    slug: z.string().min(1).max(100).optional(),
  }),
});

const placeholderContentSchema = z.record(z.string(), z.unknown());

const updatePersonaSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    displayName: z.string().min(1).max(100).optional(),
    manifest: z.string().optional(),
    settings: z.record(z.unknown()).optional(),
  }),
});

const personaIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const createPlaceholderSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    type: z.string().min(1),
    order: z.number().int().positive().optional(),
    content: placeholderContentSchema.optional(),
  }),
});

const updatePlaceholderSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    placeholderId: z.string(),
  }),
  body: z.object({
    content: placeholderContentSchema.optional(),
    order: z.number().int().positive().optional(),
    enabled: z.boolean().optional(),
  }),
});

const placeholderIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    placeholderId: z.string(),
  }),
});

const reorderPlaceholdersSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    placeholderIds: z.array(z.string()),
  }),
});

const assignProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    projectId: z.string().uuid(),
    displayOrder: z.number().int().min(0).optional().default(0),
    isVisible: z.boolean().optional().default(true),
  }),
});

const updateProjectAssignmentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
  }),
  body: z.object({
    displayOrder: z.number().int().min(0).optional(),
    isVisible: z.boolean().optional(),
  }),
});

const projectIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
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
  handler: (req: Req, res: Response, next: NextFunction) => Promise<void | Response>
) => {
  return (req: Req, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch((error) => next(error));
  };
};

// ==================================================
// Persona CRUD Operations
// ==================================================

// GET /personas - List user's personas
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const { page = 1, limit = 20 } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100);
      const offset = (pageNum - 1) * limitNum;

      const [personas, total] = await Promise.all([
        prisma.persona.findMany({
          where: { accountId: userId },
          select: {
            id: true,
            slug: true,
            displayName: true,
            manifest: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
          skip: offset,
          take: limitNum,
        }),
        prisma.persona.count({
          where: { accountId: userId },
        }),
      ]);

      const response = {
        personas,
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
      logger.error('List personas error', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list personas',
        },
      });
    }
  })
);

// POST /personas - Create new persona
router.post(
  '/',
  authenticateToken,
  validate(createPersonaSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const data = createPersonaSchema.shape.body.parse(req.body);

      // Generate slug if not provided
      let finalSlug = data.slug;
      if (!finalSlug) {
        finalSlug = data.displayName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }

      // Check if slug is unique
      const existingPersona = await prisma.persona.findUnique({
        where: { slug: finalSlug },
      });

      if (existingPersona) {
        res.status(409).json({
          success: false,
          error: {
            code: 'SLUG_EXISTS',
            message: 'Persona with this slug already exists',
          },
        });
        return;
      }

      const persona = await prisma.persona.create({
        data: {
          accountId: userId,
          slug: finalSlug,
          displayName: data.displayName.trim(),
          manifest: data.manifest || null,
          settings: '{}',
        },
        select: {
          id: true,
          slug: true,
          displayName: true,
          manifest: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          message: 'Persona created successfully',
          persona,
        },
      });
    } catch (error) {
      logger.error('Create persona error', { error });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create persona',
        },
      });
    }
  })
);

// GET /personas/:id - Get persona details
router.get(
  '/:id',
  authenticateToken,
  validate(personaIdSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const personaId = req.params.id;

      const persona = await prisma.persona.findFirst({
        where: {
          id: personaId,
          accountId: userId, // Only owner can view
        },
        select: {
          id: true,
          slug: true,
          displayName: true,
          manifest: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
          personaProjects: {
            include: {
              project: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  type: true,
                  status: true,
                },
              },
            },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      if (!persona) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Persona not found',
          },
        });
      }

      res.json({
        success: true,
        data: {
          persona,
        },
      });
      return;
    } catch (error) {
      logger.error('Get persona error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get persona',
        },
      });
      return;
    }
  })
);

// PUT /personas/:id - Update persona
router.put(
  '/:id',
  authenticateToken,
  validate(updatePersonaSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const personaId = req.params.id;
      const data = updatePersonaSchema.shape.body.parse(req.body);

      const persona = await prisma.persona.findFirst({
        where: {
          id: personaId,
          accountId: userId, // Only owner can update
        },
      });

      if (!persona) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Persona not found',
          },
        });
      }

      const updateData: PersonaUpdateData = {};
      if (data.displayName !== undefined) {
        updateData.displayName = data.displayName.trim();
      }

      if (data.manifest !== undefined) {
        updateData.manifest = data.manifest;
      }

      if (data.settings !== undefined) {
        updateData.settings =
          typeof data.settings === 'string' ? data.settings : JSON.stringify(data.settings);
      }

      const updatedPersona = await prisma.persona.update({
        where: { id: personaId },
        data: updateData,
        select: {
          id: true,
          slug: true,
          displayName: true,
          manifest: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        data: {
          message: 'Persona updated successfully',
          persona: updatedPersona,
        },
      });
    } catch (error) {
      logger.error('Update persona error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update persona',
        },
      });
    }
  })
);

// DELETE /personas/:id - Delete persona
router.delete(
  '/:id',
  authenticateToken,
  validate(personaIdSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const personaId = req.params.id;

      const persona = await prisma.persona.findFirst({
        where: {
          id: personaId,
          accountId: userId, // Only owner can delete
        },
      });

      if (!persona) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Persona not found',
          },
        });
      }

      await prisma.persona.delete({
        where: { id: personaId },
      });

      res.json({
        success: true,
        data: {
          message: 'Persona deleted successfully',
        },
      });
    } catch (error) {
      logger.error('Delete persona error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete persona',
        },
      });
    }
  })
);

// ==================================================
// Placeholder Operations
// ==================================================

// GET /personas/:id/placeholders - List persona placeholders
router.get(
  '/:id/placeholders',
  authenticateToken,
  validate(personaIdSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const personaId = req.params.id;

      // Verify persona ownership
      const persona = await prisma.persona.findFirst({
        where: {
          id: personaId,
          accountId: userId,
        },
      });

      if (!persona) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Persona not found',
          },
        });
      }

      // Get placeholders from persona settings
      const settings = parsePersonaSettings(persona.settings);
      const placeholders: PersonaPlaceholder[] = settings.placeholders ?? [];

      res.json({
        success: true,
        data: {
          placeholders,
          meta: { total: placeholders.length },
        },
      });
    } catch (error) {
      logger.error('List placeholders error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list placeholders',
        },
      });
    }
  })
);

// POST /personas/:id/placeholders - Add placeholder to persona
router.post(
  '/:id/placeholders',
  authenticateToken,
  validate(createPlaceholderSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const personaId = req.params.id;
      const { type, order, content } = createPlaceholderSchema.shape.body.parse(req.body);

      if (!type || typeof type !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Placeholder type is required',
          },
        });
      }

      // Verify persona ownership
      const persona = await prisma.persona.findFirst({
        where: {
          id: personaId,
          accountId: userId,
        },
      });

      if (!persona) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Persona not found',
          },
        });
        return;
      }

      // Get current settings
      const settings = parsePersonaSettings(persona.settings);
      const placeholders = settings.placeholders ?? [];

      // Generate unique ID
      const placeholderId = `placeholder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create new placeholder
      const newPlaceholder: PersonaPlaceholder = {
        id: placeholderId,
        type,
        order: order || placeholders.length + 1,
        content: content || {},
        enabled: true,
      };

      // Add to placeholders array
      placeholders.push(newPlaceholder);

      // Save updated settings
      await prisma.persona.update({
        where: { id: personaId },
        data: {
          settings: JSON.stringify({ ...settings, placeholders }),
        },
      });

      res.status(201).json({
        success: true,
        data: {
          message: 'Placeholder added successfully',
          placeholder: newPlaceholder,
        },
      });
    } catch (error) {
      logger.error('Add placeholder error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to add placeholder',
        },
      });
    }
  })
);

// PUT /personas/:id/placeholders/:placeholderId - Update placeholder
router.put(
  '/:id/placeholders/:placeholderId',
  authenticateToken,
  validate(updatePlaceholderSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const personaId = req.params.id;
      const placeholderId = req.params.placeholderId;
      const { content, order, enabled } = updatePlaceholderSchema.shape.body.parse(req.body);

      // Verify persona ownership
      const persona = await prisma.persona.findFirst({
        where: {
          id: personaId,
          accountId: userId,
        },
      });

      if (!persona) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Persona not found',
          },
        });
        return;
      }

      // Get current content
      const currentContent = parsePersonaSettings(persona.settings);
      const placeholders: PersonaPlaceholder[] = currentContent.placeholders ?? [];

      // Find and update placeholder
      const placeholderIndex = placeholders.findIndex(
        (placeholder) => placeholder.id === placeholderId
      );
      if (placeholderIndex === -1) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PLACEHOLDER_NOT_FOUND',
            message: 'Placeholder not found',
          },
        });
      }

      // Update placeholder
      const existingPlaceholder = placeholders[placeholderIndex];
      if (!existingPlaceholder) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PLACEHOLDER_NOT_FOUND',
            message: 'Placeholder not found',
          },
        });
      }

      const updatedPlaceholder: PersonaPlaceholder = {
        ...existingPlaceholder,
        content: content !== undefined ? content : existingPlaceholder.content,
        order: order !== undefined ? order : existingPlaceholder.order,
        enabled: enabled !== undefined ? enabled : existingPlaceholder.enabled,
      };

      placeholders[placeholderIndex] = updatedPlaceholder;

      // Save updated settings
      await prisma.persona.update({
        where: { id: personaId },
        data: {
          settings: JSON.stringify({ ...currentContent, placeholders }),
        },
      });

      res.json({
        success: true,
        data: {
          message: 'Placeholder updated successfully',
          placeholder: updatedPlaceholder,
        },
      });
    } catch (error) {
      logger.error('Update placeholder error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update placeholder',
        },
      });
    }
  })
);

// DELETE /personas/:id/placeholders/:placeholderId - Remove placeholder
router.delete(
  '/:id/placeholders/:placeholderId',
  authenticateToken,
  validate(placeholderIdSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const personaId = req.params.id;
      const placeholderId = req.params.placeholderId;

      // Verify persona ownership
      const persona = await prisma.persona.findFirst({
        where: {
          id: personaId,
          accountId: userId,
        },
      });

      if (!persona) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Persona not found',
          },
        });
        return;
      }

      // Get current settings
      const settings = parsePersonaSettings(persona.settings);
      const placeholders: PersonaPlaceholder[] = settings.placeholders ?? [];

      // Find and remove placeholder
      const placeholderIndex = placeholders.findIndex(
        (placeholder) => placeholder.id === placeholderId
      );
      if (placeholderIndex === -1) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PLACEHOLDER_NOT_FOUND',
            message: 'Placeholder not found',
          },
        });
      }

      // Remove placeholder
      placeholders.splice(placeholderIndex, 1);

      // Save updated settings
      await prisma.persona.update({
        where: { id: personaId },
        data: {
          settings: JSON.stringify({ ...settings, placeholders }),
        },
      });

      res.json({
        success: true,
        data: { message: 'Placeholder removed successfully' },
      });
    } catch (error) {
      logger.error('Remove placeholder error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to remove placeholder',
        },
      });
    }
  })
);

// POST /personas/:id/placeholders/reorder - Reorder placeholders
router.post(
  '/:id/placeholders/reorder',
  authenticateToken,
  validate(reorderPlaceholdersSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const personaId = req.params.id;
      const { placeholderIds } = reorderPlaceholdersSchema.shape.body.parse(req.body);

      if (!Array.isArray(placeholderIds)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'placeholderIds must be an array',
          },
        });
      }

      // Verify persona ownership
      const persona = await prisma.persona.findFirst({
        where: {
          id: personaId,
          accountId: userId,
        },
      });

      if (!persona) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Persona not found',
          },
        });
      }

      // Get current settings
      const settings = parsePersonaSettings(persona.settings);
      const placeholders: PersonaPlaceholder[] = settings.placeholders ?? [];

      // Reorder placeholders based on provided order
      const reorderedPlaceholders = placeholderIds.map((id: string, index: number) => {
        const placeholder = placeholders.find((entry) => entry.id === id);
        if (!placeholder) {
          throw new Error(`Placeholder with id ${id} not found`);
        }
        return { ...placeholder, order: index + 1 };
      });

      // Save updated settings
      await prisma.persona.update({
        where: { id: personaId },
        data: {
          settings: JSON.stringify({ ...settings, placeholders: reorderedPlaceholders }),
        },
      });

      res.json({
        success: true,
        data: {
          message: 'Placeholders reordered successfully',
          placeholders: reorderedPlaceholders,
        },
      });
    } catch (error) {
      logger.error('Reorder placeholders error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to reorder placeholders',
        },
      });
    }
  })
);

// ==================================================
// Public Operations
// ==================================================

// GET /public/:slug - Get public persona by slug (commented out - schema doesn't support public personas)
// router.get('/public/:slug', async (req, res) => {
//   // Implementation commented out due to missing schema fields (isPublic, publicSlug, personaProjects)
// });

// POST /personas/:id/publish - Make persona public (commented out - schema doesn't support public personas)
// router.post('/:id/publish', authenticateToken, async (req: AuthenticatedRequest, res) => {
//   // Implementation commented out due to missing schema fields (isPublic, publicSlug)
// });

// ==================================================
// Persona-Project Assignment Operations
// ==================================================

// GET /personas/:id/projects - Get projects assigned to persona
router.get(
  '/:id/projects',
  authenticateToken,
  validate(personaIdSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const personaId = req.params.id;

      // Verify persona ownership
      const persona = await prisma.persona.findFirst({
        where: {
          id: personaId,
          accountId: userId,
        },
      });

      if (!persona) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Persona not found',
          },
        });
      }

      const personaProjects = (await prisma.personaProject.findMany({
        where: { personaId },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { displayOrder: 'asc' },
      })) as PersonaProjectWithProject[];

      const projects = personaProjects.map((pp) => ({
        ...pp.project,
        personaProjectId: pp.id,
        displayOrder: pp.displayOrder,
        isVisible: pp.isVisible,
      }));

      res.json({
        success: true,
        data: {
          projects,
          meta: { total: projects.length },
        },
      });
    } catch (error) {
      logger.error('Get persona projects error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get persona projects',
        },
      });
    }
  })
);

// POST /personas/:id/projects - Assign project to persona
router.post(
  '/:id/projects',
  authenticateToken,
  validate(assignProjectSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const personaId = req.params.id;
      const {
        projectId,
        displayOrder = 0,
        isVisible = true,
      } = assignProjectSchema.shape.body.parse(req.body);

      if (!personaId || !projectId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Persona ID and Project ID are required',
          },
        });
      }

      // Verify persona ownership
      const persona = await prisma.persona.findFirst({
        where: {
          id: personaId,
          accountId: userId,
        },
      });

      if (!persona) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Persona not found',
          },
        });
      }

      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          accountId: userId,
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

      // Check if already assigned
      const existing = await prisma.personaProject.findUnique({
        where: {
          personaId_projectId: {
            personaId,
            projectId,
          },
        },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'ALREADY_ASSIGNED',
            message: 'Project is already assigned to this persona',
          },
        });
      }

      const personaProject = await prisma.personaProject.create({
        data: {
          personaId,
          projectId,
          displayOrder,
          isVisible,
        },
      });

      // Get created assignment with project details
      const createdWithProject = await prisma.personaProject.findUnique({
        where: { id: personaProject.id },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
              status: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: {
          message: 'Project assigned to persona successfully',
          assignment: {
            id: personaProject.id,
            personaId: personaProject.personaId,
            projectId: personaProject.projectId,
            displayOrder: personaProject.displayOrder,
            isVisible: personaProject.isVisible,
            project: createdWithProject!.project,
          },
        },
      });
    } catch (error) {
      logger.error('Assign project to persona error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to assign project to persona',
        },
      });
    }
  })
);

// PUT /personas/:id/projects/:projectId - Update project assignment
router.put(
  '/:id/projects/:projectId',
  authenticateToken,
  validate(updateProjectAssignmentSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const { id: personaId, projectId } = req.params;
      const { displayOrder, isVisible } = updateProjectAssignmentSchema.shape.body.parse(req.body);

      if (!personaId || !projectId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid persona or project ID',
          },
        });
      }

      // Verify persona ownership
      const persona = await prisma.persona.findFirst({
        where: {
          id: personaId,
          accountId: userId,
        },
      });

      if (!persona) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Persona not found',
          },
        });
      }

      const personaProject = await prisma.personaProject.findFirst({
        where: {
          personaId,
          projectId,
        },
      });

      if (!personaProject) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Project assignment not found',
          },
        });
      }

      const updateData: PersonaProjectUpdateData = {};
      if (displayOrder !== undefined) {
        updateData.displayOrder = displayOrder;
      }
      if (isVisible !== undefined) {
        updateData.isVisible = isVisible;
      }

      const updated = await prisma.personaProject.update({
        where: { id: personaProject.id },
        data: updateData,
      });

      // Get updated assignment with project details
      const updatedWithProject = await prisma.personaProject.findUnique({
        where: { id: updated.id },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              slug: true,
              type: true,
              status: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: {
          message: 'Project assignment updated successfully',
          assignment: {
            id: updated.id,
            personaId: updated.personaId,
            projectId: updated.projectId,
            displayOrder: updated.displayOrder,
            isVisible: updated.isVisible,
            project: updatedWithProject!.project,
          },
        },
      });
    } catch (error) {
      logger.error('Update project assignment error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update project assignment',
        },
      });
    }
  })
);

// DELETE /personas/:id/projects/:projectId - Remove project from persona
router.delete(
  '/:id/projects/:projectId',
  authenticateToken,
  validate(projectIdSchema),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const { id: personaId, projectId } = req.params;

      // Verify persona ownership
      const persona = await prisma.persona.findFirst({
        where: {
          id: personaId,
          accountId: userId,
        },
      });

      if (!persona) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Persona not found',
          },
        });
      }

      const personaProject = await prisma.personaProject.findFirst({
        where: {
          personaId,
          projectId,
        },
      });

      if (!personaProject) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Project assignment not found',
          },
        });
      }

      await prisma.personaProject.delete({
        where: { id: personaProject.id },
      });

      res.json({
        success: true,
        data: {
          message: 'Project removed from persona successfully',
        },
      });
    } catch (error) {
      logger.error('Remove project from persona error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to remove project from persona',
        },
      });
    }
  })
);

// ==================================================
// Admin Operations (require admin role)
// ==================================================

// GET /admin/personas - List all personas (admin only)
router.get(
  '/admin/personas',
  requireAdmin,
  asyncHandler(async (_req: AuthenticatedRequest, res) => {
    try {
      const personas = await prisma.persona.findMany({
        select: {
          id: true,
          slug: true,
          displayName: true,
          manifest: true,
          accountId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        data: { personas },
      });
    } catch (error) {
      logger.error('Admin list personas error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list personas',
        },
      });
    }
  })
);

// DELETE /admin/personas/:id - Delete any persona (admin only)
router.delete(
  '/admin/personas/:id',
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    try {
      const personaId = req.params.id;

      const persona = await prisma.persona.findUnique({
        where: { id: personaId },
      });

      if (!persona) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Persona not found',
          },
        });
      }

      await prisma.persona.delete({
        where: { id: personaId },
      });

      logger.info('Persona deleted by admin', { adminId: req.user!.userId, personaId });

      res.json({
        success: true,
        data: {
          message: 'Persona deleted successfully',
        },
      });
    } catch (error) {
      logger.error('Admin delete persona error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete persona',
        },
      });
    }
  })
);

export default router;
