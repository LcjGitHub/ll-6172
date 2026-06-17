import { Router, Request, Response } from 'express';
import db from '../db';
import type { HousenoStyle } from '../types';

const router = Router();

interface DbRow {
  id: number;
  city_district: string;
  material: string;
  font: string;
  numbering_rules: string;
  unified_replacement: number;
}

/**
 * 将数据库行映射为 API 响应对象。
 * @param row - 数据库行
 */
function rowToStyle(row: DbRow): HousenoStyle {
  return {
    id: row.id,
    cityDistrict: row.city_district,
    material: row.material,
    font: row.font,
    numberingRules: row.numbering_rules,
    unifiedReplacement: row.unified_replacement === 1,
  };
}

/** GET /api/houseno-styles — 获取门牌号样式列表 */
router.get('/', (_req: Request, res: Response) => {
  const rows = db
    .prepare('SELECT * FROM houseno_styles ORDER BY id')
    .all() as DbRow[];
  res.json(rows.map(rowToStyle));
});

/** GET /api/houseno-styles/:id — 获取单条门牌号样式详情 */
router.get('/:id', (req: Request, res: Response) => {
  const row = db
    .prepare('SELECT * FROM houseno_styles WHERE id = ?')
    .get(req.params.id) as DbRow | undefined;

  if (!row) {
    res.status(404).json({ error: '门牌号样式不存在' });
    return;
  }

  res.json(rowToStyle(row));
});

export default router;
