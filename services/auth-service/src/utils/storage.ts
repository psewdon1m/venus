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

  // Utility methods
  async getAllAccounts(): Promise<Account[]> {
    const accounts = await prisma.account.findMany();

    return accounts.map((account: any) => ({
      id: account.id,
      email: account.email,
      passwordHash: account.passwordHash,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();
