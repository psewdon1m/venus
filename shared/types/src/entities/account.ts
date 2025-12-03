// Account entity types

export interface Account {
  id: string;
  email: string;
  passwordHash: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountInput {
  email: string;
  password: string;
}

export interface UpdateAccountInput {
  email?: string;
  password?: string;
}

export type AccountWithoutPassword = Omit<Account, 'passwordHash'>;
