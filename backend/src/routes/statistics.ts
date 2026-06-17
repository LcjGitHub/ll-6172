import { Router, Request, Response } from 'express';
import db from '../db';
import type { StatisticsOverview, MaterialDistribution, ReplacementStatus } from '../types';

const router = Router();

interface MaterialCountRow {
  material: string;
  count: number;
}

interface ReplacementCountRow {
  unified_replacement: number;
  count: number;
}

/** GET /api/statistics/overview — 获取数据概览统计 */
router.get('/overview', (_req: Request, res: Response) => {
  const totalStyles = db
    .prepare('SELECT COUNT(*) as count FROM houseno_styles')
    .get() as { count: number };

  const materialRows = db
    .prepare(
      'SELECT material, COUNT(*) as count FROM houseno_styles GROUP BY material ORDER BY count DESC',
    )
    .all() as MaterialCountRow[];

  const materialDistribution: MaterialDistribution[] = materialRows.map((row) => ({
    material: row.material,
    count: row.count,
  }));

  const replacementRows = db
    .prepare(
      'SELECT unified_replacement, COUNT(*) as count FROM houseno_styles GROUP BY unified_replacement',
    )
    .all() as ReplacementCountRow[];

  const replacementStatus: ReplacementStatus = {
    unified: 0,
    notUnified: 0,
  };

  for (const row of replacementRows) {
    if (row.unified_replacement === 1) {
      replacementStatus.unified = row.count;
    } else {
      replacementStatus.notUnified = row.count;
    }
  }

  const overview: StatisticsOverview = {
    totalStyles: totalStyles.count,
    materialDistribution,
    replacementStatus,
  };

  res.json(overview);
});

export default router;
