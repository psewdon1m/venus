// Database storage using Prisma

import { PrismaClient } from '@prisma/client';

import type { Account } from '@venus/types';

type AccountRecord = {
  id: string;
  email: string;
  passwordHash: string;
  role: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type SessionRecord = {
  id: string;
  accountId: string;
  refreshToken: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
  createdAt: Date;
};

type BatchResult = {
  count: number;
};

type PersonaRecord = {
  id: string;
  accountId: string;
  slug: string;
  publicSlug: string | null;
  displayName: string;
  manifest: string | null;
  settings: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ProjectRecord = {
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

type MediaFileRecord = {
  id: string;
  accountId: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  metadata: string;
  createdAt: Date;
};

type CVGenerationRecord = {
  id: string;
  accountId: string;
  personaId: string;
  content: string;
  pdfUrl: string;
  createdAt: Date;
};

const prisma: PrismaClient = new PrismaClient();

const mapAccount = (record: AccountRecord): Account => ({
  id: record.id,
  email: record.email,
  passwordHash: record.passwordHash,
  role: record.role ?? 'USER',
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

type SessionWithAccount = SessionRecord & { account: Account };

class DatabaseStorage {
  // Account operations
  async createAccount(account: { email: string; passwordHash: string }): Promise<Account> {
    const newAccount = await prisma.account.create({
      data: {
        ...account,
        email: account.email.toLowerCase(),
      },
    });

    return mapAccount(newAccount);
  }

  async getAccountById(id: string): Promise<Account | null> {
    const account = await prisma.account.findUnique({
      where: { id },
    });

    if (!account) return null;

    return mapAccount(account);
  }

  async getAccountByEmail(email: string): Promise<Account | null> {
    const account = await prisma.account.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!account) return null;

    return mapAccount(account);
  }

  async updateAccount(
    id: string,
    updates: Partial<Pick<Account, 'email' | 'passwordHash'>>
  ): Promise<Account | null> {
    try {
      const updatedAccount = await prisma.account.update({
        where: { id },
        data: updates,
      });

      return mapAccount(updatedAccount);
    } catch (error) {
      return null;
    }
  }

  async updateAccountRole(id: string, role: NonNullable<Account['role']>): Promise<Account | null> {
    try {
      const updatedAccount = await prisma.account.update({
        where: { id },
        data: { role },
      });

      return mapAccount(updatedAccount);
    } catch (error) {
      return null;
    }
  }

  async deleteAccount(id: string): Promise<boolean> {
    try {
      await prisma.account.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // GDPR compliance methods
  getPersonasByAccountId(accountId: string): Promise<PersonaRecord[]> {
    return prisma.persona.findMany({
      where: { accountId },
    }) as Promise<PersonaRecord[]>;
  }

  getProjectsByAccountId(accountId: string): Promise<ProjectRecord[]> {
    return prisma.project.findMany({
      where: { accountId },
    }) as Promise<ProjectRecord[]>;
  }

  getMediaFilesByAccountId(accountId: string): Promise<MediaFileRecord[]> {
    return prisma.mediaFile.findMany({
      where: { accountId },
    }) as Promise<MediaFileRecord[]>;
  }

  getCVGenerationsByAccountId(accountId: string): Promise<CVGenerationRecord[]> {
    return prisma.cVGeneration.findMany({
      where: { accountId },
    }) as Promise<CVGenerationRecord[]>;
  }

  // Session management
  createSession(
    accountId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<SessionRecord> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return prisma.session.create({
      data: {
        accountId,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt,
      },
    }) as Promise<SessionRecord>;
  }

  async getSessionByRefreshToken(refreshToken: string): Promise<SessionWithAccount | null> {
    const session = await prisma.session.findUnique({
      where: { refreshToken },
    });
    if (!session) {
      return null;
    }

    const account = await prisma.account.findUnique({
      where: { id: session.accountId },
    });
    if (!account) {
      return null;
    }

    return { ...(session as SessionRecord), account: mapAccount(account as AccountRecord) };
  }

  revokeSession(sessionId: string): Promise<SessionRecord> {
    return prisma.session.delete({
      where: { id: sessionId },
    }) as Promise<SessionRecord>;
  }

  revokeAllUserSessions(accountId: string): Promise<BatchResult> {
    return prisma.session.deleteMany({
      where: { accountId },
    }) as Promise<BatchResult>;
  }

  cleanupExpiredSessions(): Promise<BatchResult> {
    return prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    }) as Promise<BatchResult>;
  }

  // Utility methods
  async getAllAccounts(): Promise<Account[]> {
    const accounts = await prisma.account.findMany();

    return accounts.map((account) => mapAccount(account));
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();
