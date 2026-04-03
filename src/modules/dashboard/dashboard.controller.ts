import { Response, NextFunction } from "express";
import { DashboardService } from "./dashboard.service";
import { AuthRequest } from "../../middleware/auth.middleware";

const dashboardService = new DashboardService();

export class DashboardController {
  async getSummary(
    _req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await dashboardService.getSummary();

      res.status(200).json({
        message: "Dashboard summary retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByCategory(
    _req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await dashboardService.getByCategory();

      res.status(200).json({
        message: "Category breakdown retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTrends(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const period = req.query.period === "weekly" ? "weekly" : "monthly";
      const data = await dashboardService.getTrends(period);

      res.status(200).json({
        message: "Dashboard trends retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentActivity(
    _req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await dashboardService.getRecentActivity();

      res.status(200).json({
        message: "Recent activity retrieved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
