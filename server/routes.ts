import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { transferRequestSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up authentication routes
  setupAuth(app);

  // Get user accounts
  app.get("/api/accounts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userAccounts = await storage.getUserAccounts(req.user.id);
      res.json(userAccounts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching accounts" });
    }
  });

  // Get account details
  app.get("/api/accounts/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      // Ensure user can only access their own accounts
      if (account.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Error fetching account" });
    }
  });

  // Get user transactions
  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const transactions = await storage.getUserTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  // Get account transactions
  app.get("/api/accounts/:id/transactions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      // Ensure user can only access their own accounts
      if (account.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const transactions = await storage.getAccountTransactions(accountId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  // Create money transfer
  app.post("/api/transfers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Validate transfer request data
      const result = transferRequestSchema.safeParse(req.body);
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const transferRequest = result.data;
      
      // Ensure user can only transfer from their own accounts
      const fromAccount = await storage.getAccount(transferRequest.fromAccountId);
      if (!fromAccount || fromAccount.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to transfer from this account" });
      }
      
      // Execute transfer
      const transfer = await storage.executeTransfer(transferRequest);
      res.status(201).json(transfer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      res.status(400).json({ message: errorMessage });
    }
  });

  // Get user transfers
  app.get("/api/transfers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const transfers = await storage.getUserTransfers(req.user.id);
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transfers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
