// Database storage using Prisma

import { prisma } from '@venus/types';
import type { Account } from '@venus/types';

class DatabaseStorage {
  // Account operations
  async createAccount(account: { email: string; passwordHash: string }): Promise<Account> {
    const newAccount = await prisma.account.create({
      data: {
        ...account,
        email: account.email.toLowerCase(),
      },
    });

    return {
      id: newAccount.id,
      email: newAccount.email,
      passwordHash: newAccount.passwordHash,
      role: newAccount.role,
      createdAt: newAccount.createdAt,
      updatedAt: newAccount.updatedAt,
    };
  }

  async getAccountById(id: string): Promise<Account | null> {
    const account = await prisma.account.findUnique({
      where: { id },
    });

    if (!account) return null;

    return {
      id: account.id,
      email: account.email,
      passwordHash: account.passwordHash,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  async getAccountByEmail(email: string): Promise<Account | null> {
    const account = await prisma.account.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!account) return null;

    return {
      id: account.id,
      email: account.email,
      passwordHash: account.passwordHash,
      role: account.role,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  async updateAccount(id: string, updates: Partial<Pick<Account, 'email' | 'passwordHash'>>): Promise<Account | null> {
    try {
      const updatedAccount = await prisma.account.update({
        where: { id },
        data: updates,
      });

      return {
        id: updatedAccount.id,
        email: updatedAccount.email,
        passwordHash: updatedAccount.passwordHash,
        role: updatedAccount.role,
        createdAt: updatedAccount.createdAt,
        updatedAt: updatedAccount.updatedAt,
      };
    } catch (error) {
      return null;
    }
  }

  async updateAccountRole(id: string, role: string): Promise<Account | null> {
    try {
      const updatedAccount = await prisma.account.update({
        where: { id },
        data: { role },
      });

      return {
        id: updatedAccount.id,
        email: updatedAccount.email,
        passwordHash: updatedAccount.passwordHash,
        role: updatedAccount.role,
        createdAt: updatedAccount.createdAt,
        updatedAt: updatedAccount.updatedAt,
      };
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
  async getPersonasByAccountId(accountId: string) {
    return await prisma.persona.findMany({
      where: { accountId },
    });
  }

  async getProjectsByAccountId(accountId: string) {
    return await prisma.project.findMany({
      where: { accountId },
    });
  }

  async getMediaFilesByAccountId(accountId: string) {
    return await prisma.mediaFile.findMany({
      where: { accountId },
    });
  }

  async getCVGenerationsByAccountId(accountId: string) {
    return await prisma.cVGeneration.findMany({
      where: { accountId },
    });
  }

  // Session management
  async createSession(accountId: string, refreshToken: string, userAgent?: string, ipAddress?: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return await prisma.session.create({
      data: {
        accountId,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });
  }

  async getSessionByRefreshToken(refreshToken: string) {
    return await prisma.session.findUnique({
      where: { refreshToken },
      include: { account: true },
    });
  }

  async revokeSession(sessionId: string) {
    return await prisma.session.delete({
      where: { id: sessionId },
    });
  }

  async revokeAllUserSessions(accountId: string) {
    return await prisma.session.deleteMany({
      where: { accountId },
    });
  }

  async cleanupExpiredSessions() {
    return await prisma.session.deleteMany({
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

    return accounts.map((account: any) => ({
      id: account.id,
      email: account.email,
      passwordHash: account.passwordHash,
      role: account.role,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();
