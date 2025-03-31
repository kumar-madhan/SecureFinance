import { pgTable, text, serial, integer, boolean, timestamp, numeric, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Account schema
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  accountNumber: text("account_number").notNull().unique(),
  accountType: text("account_type").notNull(), // 'checking', 'savings', 'credit'
  balance: numeric("balance").notNull().default("0"),
  creditLimit: numeric("credit_limit"), // only for credit accounts
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
});

// Transaction schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  amount: numeric("amount").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  type: text("type").notNull(), // 'deposit', 'withdrawal', 'transfer'
  recipientAccountId: integer("recipient_account_id").references(() => accounts.id),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

// Transfer schema
export const transfers = pgTable("transfers", {
  id: serial("id").primaryKey(),
  fromAccountId: integer("from_account_id").notNull().references(() => accounts.id),
  toAccountId: integer("to_account_id").notNull().references(() => accounts.id),
  amount: numeric("amount").notNull(),
  memo: text("memo"),
  date: timestamp("date").defaultNow().notNull(),
  status: text("status").notNull().default("completed"), // 'pending', 'completed', 'failed'
});

export const insertTransferSchema = createInsertSchema(transfers).omit({
  id: true,
  date: true,
  status: true,
});

// Validation schema for transfer request
export const transferRequestSchema = z.object({
  fromAccountId: z.number(),
  toAccountId: z.number(),
  amount: z.string().transform((val) => parseFloat(val)),
  memo: z.string().optional(),
});

// Validation schema for login credentials
export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transfer = typeof transfers.$inferSelect;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type TransferRequest = z.infer<typeof transferRequestSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
