// Persona routes - CRUD operations for personas and placeholders

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '@venus/types';

const router = Router();

// ==================================================
// Persona CRUD Operations
// ==================================================

// GET /personas - List user's personas
router.get('/', authenticateToken, async (req, res) => {
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
    console.error('List personas error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list personas',
      },
    });
  }
});

// POST /personas - Create new persona
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { displayName, manifest, slug } = req.body;

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Display name is required and must be a non-empty string',
        },
      });
    }

    // Generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = displayName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    // Check if slug is unique
    const existingPersona = await prisma.persona.findUnique({
      where: { slug: finalSlug },
    });

    if (existingPersona) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'SLUG_EXISTS',
          message: 'Persona with this slug already exists',
        },
      });
    }

    const persona = await prisma.persona.create({
      data: {
        accountId: userId,
        slug: finalSlug,
        displayName: displayName.trim(),
        manifest: manifest || null,
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
    console.error('Create persona error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create persona',
      },
    });
  }
});

// GET /personas/:id - Get persona details
router.get('/:id', (req, res) => {
  const { id } = req.params;
  // TODO: Implement persona retrieval
  res.json({
    success: true,
    data: {
      persona: { id, name: 'Sample Persona', description: 'Sample description' }
    }
  });
});

// PUT /personas/:id - Update persona
router.put('/:id', (req, res) => {
  const { id } = req.params;
  // TODO: Implement persona update
  res.json({
    success: true,
    data: {
      message: 'Persona updated successfully',
      persona: { id, name: 'Updated Persona' }
    }
  });
});

// DELETE /personas/:id - Delete persona
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  // TODO: Implement persona deletion
  res.json({
    success: true,
    data: { message: 'Persona deleted successfully' }
  });
});

// ==================================================
// Placeholder Operations
// ==================================================

// GET /personas/:id/placeholders - List persona placeholders
router.get('/:id/placeholders', (req, res) => {
  const { id } = req.params;
  // TODO: Implement placeholder listing
  res.json({
    success: true,
    data: {
      placeholders: [],
      meta: { total: 0 }
    }
  });
});

// POST /personas/:id/placeholders - Add placeholder to persona
router.post('/:id/placeholders', (req, res) => {
  const { id } = req.params;
  // TODO: Implement placeholder creation
  res.status(201).json({
    success: true,
    data: {
      message: 'Placeholder added successfully',
      placeholder: { id: 'temp-placeholder-id', type: 'project', order: 1 }
    }
  });
});

// PUT /personas/:id/placeholders/:placeholderId - Update placeholder
router.put('/:id/placeholders/:placeholderId', (req, res) => {
  const { id, placeholderId } = req.params;
  // TODO: Implement placeholder update
  res.json({
    success: true,
    data: {
      message: 'Placeholder updated successfully',
      placeholder: { id: placeholderId, type: 'project', order: 1 }
    }
  });
});

// DELETE /personas/:id/placeholders/:placeholderId - Remove placeholder
router.delete('/:id/placeholders/:placeholderId', (req, res) => {
  const { id, placeholderId } = req.params;
  // TODO: Implement placeholder deletion
  res.json({
    success: true,
    data: { message: 'Placeholder removed successfully' }
  });
});

// POST /personas/:id/placeholders/reorder - Reorder placeholders
router.post('/:id/placeholders/reorder', (req, res) => {
  const { id } = req.params;
  // TODO: Implement placeholder reordering
  res.json({
    success: true,
    data: { message: 'Placeholders reordered successfully' }
  });
});

// ==================================================
// Public Operations
// ==================================================

// GET /public/:slug - Get public persona by slug
router.get('/public/:slug', (req, res) => {
  const { slug } = req.params;
  // TODO: Implement public persona retrieval
  res.json({
    success: true,
    data: {
      persona: { id: 'public-id', slug, name: 'Public Persona', isPublic: true }
    }
  });
});

// POST /personas/:id/publish - Make persona public
router.post('/:id/publish', (req, res) => {
  const { id } = req.params;
  // TODO: Implement persona publishing
  res.json({
    success: true,
    data: {
      message: 'Persona published successfully',
      persona: { id, isPublic: true, slug: 'generated-slug' }
    }
  });
});

export default router;
