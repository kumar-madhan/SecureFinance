import { 
  users, accounts, transactions, transfers,
  type User, type InsertUser, 
  type Account, type InsertAccount,
  type Transaction, type InsertTransaction,
  type Transfer, type InsertTransfer,
  type TransferRequest
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import connectPg from "connect-pg-simple";
import { eq, or, and, desc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User-related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Account-related methods
  getAccount(id: number): Promise<Account | undefined>;
  getAccountByNumber(accountNumber: string): Promise<Account | undefined>;
  getUserAccounts(userId: number): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccountBalance(id: number, amount: number): Promise<Account>;
  
  // Transaction-related methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getAccountTransactions(accountId: number): Promise<Transaction[]>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  // Transfer-related methods
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;
  getUserTransfers(userId: number): Promise<Transfer[]>;
  executeTransfer(transferRequest: TransferRequest): Promise<Transfer>;
  
  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private accounts: Map<number, Account>;
  private transactions: Map<number, Transaction>;
  private transfers: Map<number, Transfer>;
  sessionStore: any;
  currentUserId: number;
  currentAccountId: number;
  currentTransactionId: number;
  currentTransferId: number;

  constructor() {
    this.users = new Map();
    this.accounts = new Map();
    this.transactions = new Map();
    this.transfers = new Map();
    this.currentUserId = 1;
    this.currentAccountId = 1;
    this.currentTransactionId = 1;
    this.currentTransferId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  // Account methods
  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async getAccountByNumber(accountNumber: string): Promise<Account | undefined> {
    return Array.from(this.accounts.values()).find(
      (account) => account.accountNumber === accountNumber,
    );
  }

  async getUserAccounts(userId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(
      (account) => account.userId === userId,
    );
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const id = this.currentAccountId++;
    const account: Account = { 
      ...insertAccount, 
      id, 
      balance: insertAccount.balance ?? "0", 
      createdAt: new Date(),
      creditLimit: insertAccount.creditLimit ?? null
    };
    this.accounts.set(id, account);
    return account;
  }

  async updateAccountBalance(id: number, amount: number): Promise<Account> {
    const account = await this.getAccount(id);
    if (!account) {
      throw new Error(`Account with id ${id} not found`);
    }
    
    const currentBalance = parseFloat(account.balance.toString());
    const newBalance = (currentBalance + amount).toFixed(2);
    
    const updatedAccount: Account = {
      ...account,
      balance: newBalance,
    };
    
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      date: insertTransaction.date || new Date(),
      recipientAccountId: insertTransaction.recipientAccountId || null
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getAccountTransactions(accountId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.accountId === accountId || tx.recipientAccountId === accountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    const userAccounts = await this.getUserAccounts(userId);
    const accountIds = userAccounts.map(account => account.id);
    
    return Array.from(this.transactions.values())
      .filter(tx => 
        accountIds.includes(tx.accountId) || 
        (tx.recipientAccountId && accountIds.includes(tx.recipientAccountId))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Transfer methods
  async createTransfer(insertTransfer: InsertTransfer): Promise<Transfer> {
    const id = this.currentTransferId++;
    const transfer: Transfer = { 
      ...insertTransfer, 
      id, 
      date: new Date(), 
      status: 'completed',
      memo: insertTransfer.memo ?? null
    };
    this.transfers.set(id, transfer);
    return transfer;
  }

  async getUserTransfers(userId: number): Promise<Transfer[]> {
    const userAccounts = await this.getUserAccounts(userId);
    const accountIds = userAccounts.map(account => account.id);
    
    return Array.from(this.transfers.values())
      .filter(transfer => 
        accountIds.includes(transfer.fromAccountId) || 
        accountIds.includes(transfer.toAccountId)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async executeTransfer(transferRequest: TransferRequest): Promise<Transfer> {
    const { fromAccountId, toAccountId, amount, memo } = transferRequest;
    
    // Verify both accounts exist
    const fromAccount = await this.getAccount(fromAccountId);
    const toAccount = await this.getAccount(toAccountId);
    
    if (!fromAccount || !toAccount) {
      throw new Error("One or both accounts not found");
    }
    
    // Check sufficient balance
    const currentBalance = parseFloat(fromAccount.balance.toString());
    if (currentBalance < amount) {
      throw new Error("Insufficient funds");
    }
    
    // Create transfer record
    const transfer = await this.createTransfer({
      fromAccountId,
      toAccountId,
      amount: amount.toString(),
      memo: memo || "",
    });
    
    // Update account balances
    await this.updateAccountBalance(fromAccountId, -amount);
    await this.updateAccountBalance(toAccountId, amount);
    
    // Create transaction records
    await this.createTransaction({
      accountId: fromAccountId,
      amount: (-amount).toString(),
      description: `Transfer to account ${toAccount.accountNumber}`,
      category: "Transfer",
      date: new Date(),
      type: "transfer",
      recipientAccountId: toAccountId,
    });
    
    await this.createTransaction({
      accountId: toAccountId,
      amount: amount.toString(),
      description: `Transfer from account ${fromAccount.accountNumber}`,
      category: "Transfer",
      date: new Date(),
      type: "transfer",
      recipientAccountId: null,
    });
    
    return transfer;
  }
}

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  sessionStore: any;
  
  constructor() {
    const connectionString = process.env.DATABASE_URL || "";
    const queryClient = postgres(connectionString);
    this.db = drizzle(queryClient);
    
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString,
      },
      createTableIfMissing: true
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values({
      ...insertUser,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  // Account methods
  async getAccount(id: number): Promise<Account | undefined> {
    const result = await this.db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
    return result[0];
  }

  async getAccountByNumber(accountNumber: string): Promise<Account | undefined> {
    const result = await this.db.select().from(accounts)
      .where(eq(accounts.accountNumber, accountNumber))
      .limit(1);
    return result[0];
  }

  async getUserAccounts(userId: number): Promise<Account[]> {
    return await this.db.select().from(accounts).where(eq(accounts.userId, userId));
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const result = await this.db.insert(accounts).values({
      ...insertAccount,
      balance: insertAccount.balance ?? "0",
      createdAt: new Date(),
      creditLimit: insertAccount.creditLimit ?? null
    }).returning();
    return result[0];
  }

  async updateAccountBalance(id: number, amount: number): Promise<Account> {
    const account = await this.getAccount(id);
    if (!account) {
      throw new Error(`Account with id ${id} not found`);
    }
    
    const currentBalance = parseFloat(account.balance.toString());
    const newBalance = (currentBalance + amount).toFixed(2);
    
    const result = await this.db.update(accounts)
      .set({ balance: newBalance })
      .where(eq(accounts.id, id))
      .returning();
    
    return result[0];
  }

  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await this.db.insert(transactions).values({
      ...insertTransaction,
      date: insertTransaction.date || new Date(),
      recipientAccountId: insertTransaction.recipientAccountId || null
    }).returning();
    return result[0];
  }

  async getAccountTransactions(accountId: number): Promise<Transaction[]> {
    return await this.db.select().from(transactions)
      .where(
        or(
          eq(transactions.accountId, accountId),
          eq(transactions.recipientAccountId, accountId)
        )
      )
      .orderBy(desc(transactions.date));
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    const userAccounts = await this.getUserAccounts(userId);
    const accountIds = userAccounts.map(account => account.id);
    
    if (accountIds.length === 0) {
      return [];
    }
    
    return await this.db.select().from(transactions)
      .where(
        or(
          ...accountIds.map(id => eq(transactions.accountId, id)),
          ...accountIds.map(id => eq(transactions.recipientAccountId, id))
        )
      )
      .orderBy(desc(transactions.date));
  }

  // Transfer methods
  async createTransfer(insertTransfer: InsertTransfer): Promise<Transfer> {
    const result = await this.db.insert(transfers).values({
      ...insertTransfer,
      date: new Date(),
      status: 'completed',
      memo: insertTransfer.memo ?? null
    }).returning();
    return result[0];
  }

  async getUserTransfers(userId: number): Promise<Transfer[]> {
    const userAccounts = await this.getUserAccounts(userId);
    const accountIds = userAccounts.map(account => account.id);
    
    if (accountIds.length === 0) {
      return [];
    }
    
    return await this.db.select().from(transfers)
      .where(
        or(
          ...accountIds.map(id => eq(transfers.fromAccountId, id)),
          ...accountIds.map(id => eq(transfers.toAccountId, id))
        )
      )
      .orderBy(desc(transfers.date));
  }

  async executeTransfer(transferRequest: TransferRequest): Promise<Transfer> {
    const { fromAccountId, toAccountId, amount, memo } = transferRequest;
    
    // Verify both accounts exist
    const fromAccount = await this.getAccount(fromAccountId);
    const toAccount = await this.getAccount(toAccountId);
    
    if (!fromAccount || !toAccount) {
      throw new Error("One or both accounts not found");
    }
    
    // Check sufficient balance
    const currentBalance = parseFloat(fromAccount.balance.toString());
    if (currentBalance < amount) {
      throw new Error("Insufficient funds");
    }
    
    // Create transfer record
    const transfer = await this.createTransfer({
      fromAccountId,
      toAccountId,
      amount: amount.toString(),
      memo: memo || "",
    });
    
    // Update account balances
    await this.updateAccountBalance(fromAccountId, -amount);
    await this.updateAccountBalance(toAccountId, amount);
    
    // Create transaction records
    await this.createTransaction({
      accountId: fromAccountId,
      amount: (-amount).toString(),
      description: `Transfer to account ${toAccount.accountNumber}`,
      category: "Transfer",
      date: new Date(),
      type: "transfer",
      recipientAccountId: toAccountId,
    });
    
    await this.createTransaction({
      accountId: toAccountId,
      amount: amount.toString(),
      description: `Transfer from account ${fromAccount.accountNumber}`,
      category: "Transfer",
      date: new Date(),
      type: "transfer",
      recipientAccountId: null,
    });
    
    return transfer;
  }
}

// Choose storage implementation based on environment
export const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();
