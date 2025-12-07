// Database storage using Prisma

import { PrismaClient } from '@prisma/client';

import type {
  Account as PrismaAccount,
  CVGeneration,
  MediaFile,
  Persona,
  Prisma,
  Project as PrismaProject,
  Session,
} from '@prisma/client';
import type { Account } from '@venus/types';

const prisma = new PrismaClient();

const mapAccount = (record: PrismaAccount): Account => ({
  id: record.id,
  email: record.email,
  passwordHash: record.passwordHash,
  role: record.role ?? 'USER',
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

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
  async getPersonasByAccountId(accountId: string): Promise<Persona[]> {
    return prisma.persona.findMany({
      where: { accountId },
    });
  }

  async getProjectsByAccountId(accountId: string): Promise<PrismaProject[]> {
    return prisma.project.findMany({
      where: { accountId },
    });
  }

  async getMediaFilesByAccountId(accountId: string): Promise<MediaFile[]> {
    return prisma.mediaFile.findMany({
      where: { accountId },
    });
  }

  async getCVGenerationsByAccountId(accountId: string): Promise<CVGeneration[]> {
    return prisma.cVGeneration.findMany({
      where: { accountId },
    });
  }

  // Session management
  async createSession(
    accountId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<Session> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return prisma.session.create({
      data: {
        accountId,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });
  }

  async getSessionByRefreshToken(
    refreshToken: string
  ): Promise<(Session & { account: PrismaAccount }) | null> {
    return prisma.session.findUnique({
      where: { refreshToken },
      include: { account: true },
    });
  }

  async revokeSession(sessionId: string): Promise<Session> {
    return prisma.session.delete({
      where: { id: sessionId },
    });
  }

  async revokeAllUserSessions(accountId: string): Promise<Prisma.BatchPayload> {
    return prisma.session.deleteMany({
      where: { accountId },
    });
  }

  async cleanupExpiredSessions(): Promise<Prisma.BatchPayload> {
    return prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  // Utility methods
  async getAllAccounts(): Promise<Account[]> {
    const accounts = await prisma.account.findMany();

    return accounts.map((account) => mapAccount(account));
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();
