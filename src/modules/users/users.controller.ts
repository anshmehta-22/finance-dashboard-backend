import { Request, Response, NextFunction } from "express";
import { UsersService } from "./users.service";
import {
  CreateUserInput,
  UpdateRoleInput,
  UpdateStatusInput,
} from "./users.schema";

const usersService = new UsersService();

export class UsersController {
  async getAllUsers(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const users = await usersService.getAllUsers();

      res.status(200).json({
        message: "Users retrieved successfully",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const user = await usersService.getUserById(id);

      res.status(200).json({
        message: "User retrieved successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data: CreateUserInput = req.body;
      const user = await usersService.createUser(data);

      res.status(201).json({
        message: "User created successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRole(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateRoleInput = req.body;
      const user = await usersService.updateRole(id, data.role);

      res.status(200).json({
        message: "User role updated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateStatusInput = req.body;
      const user = await usersService.toggleStatus(id, data.isActive);

      res.status(200).json({
        message: "User status updated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
