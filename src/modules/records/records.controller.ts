import { Request, Response, NextFunction } from "express";
import { RecordsService } from "./records.service";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  CreateRecordInput,
  CreateRecordSchema,
  FilterSchema,
  UpdateRecordInput,
  UpdateRecordSchema,
} from "./records.schema";

const recordsService = new RecordsService();

export class RecordsController {
  async getRecords(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const filters = FilterSchema.parse(req.query);
      const records = await recordsService.getRecords(filters);

      res.status(200).json({
        message: "Records retrieved successfully",
        ...records,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecordById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const record = await recordsService.getRecordById(id);

      res.status(200).json({
        message: "Record retrieved successfully",
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async createRecord(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const data: CreateRecordInput = CreateRecordSchema.parse(req.body);
      const record = await recordsService.createRecord(data, req.user.userId);

      res.status(201).json({
        message: "Record created successfully",
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRecord(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateRecordInput = UpdateRecordSchema.parse(req.body);
      const record = await recordsService.updateRecord(id, data);

      res.status(200).json({
        message: "Record updated successfully",
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRecord(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const result = await recordsService.deleteRecord(id);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDeletedRecords(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const records = await recordsService.getDeletedRecords();

      res.status(200).json({
        message: "Deleted records retrieved successfully",
        data: records,
      });
    } catch (error) {
      next(error);
    }
  }

  async restoreRecord(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const record = await recordsService.restoreRecord(id);

      res.status(200).json({
        message: "Record restored successfully",
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }
}
