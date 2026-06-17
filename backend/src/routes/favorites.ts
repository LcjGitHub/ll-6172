import { Router, Request, Response } from 'express';
import db from '../db';
import type { Favorite, FavoriteWithStyle, HousenoStyle } from '../types';

const router = Router();

interface FavoriteDbRow {
  id: number;
  style_id: number;
  created_at: string;
}

interface StyleDbRow {
  id: number;
  city_district: string;
  material: string;
  font: string;
  numbering_rules: string;
  unified_replacement: number;
}

function rowToFavorite(row: FavoriteDbRow): Favorite {
  const createdAt = typeof row.created_at === 'number'
    ? new Date(row.created_at * 1000).toISOString().replace('T', ' ').slice(0, 19)
    : row.created_at;
  return {
    id: row.id,
    styleId: row.style_id,
    createdAt,
  };
}

function rowToStyle(row: StyleDbRow): HousenoStyle {
  return {
    id: row.id,
    cityDistrict: row.city_district,
    material: row.material,
    font: row.font,
    numberingRules: row.numbering_rules,
    unifiedReplacement: row.unified_replacement === 1,
  };
}

/** GET /api/favorites — 获取收藏列表（含样式详情） */
router.get('/', (_req: Request, res: Response) => {
  const rows = db
    .prepare(
      `SELECT f.id, f.style_id, f.created_at,
              s.id as s_id, s.city_district, s.material, s.font, s.numbering_rules, s.unified_replacement
       FROM favorites f
       JOIN houseno_styles s ON f.style_id = s.id
       ORDER BY f.created_at DESC`,
    )
    .all() as (FavoriteDbRow & {
    s_id: number;
    city_district: string;
    material: string;
    font: string;
    numbering_rules: string;
    unified_replacement: number;
  })[];

  const result: FavoriteWithStyle[] = rows.map((row) => ({
    id: row.id,
    styleId: row.style_id,
    createdAt: row.created_at,
    style: {
      id: row.s_id,
      cityDistrict: row.city_district,
      material: row.material,
      font: row.font,
      numberingRules: row.numbering_rules,
      unifiedReplacement: row.unified_replacement === 1,
    },
  }));

  res.json(result);
});

/** POST /api/favorites — 添加收藏 */
router.post('/', (req: Request, res: Response) => {
  const { styleId } = req.body;

  if (!styleId || typeof styleId !== 'number') {
    res.status(400).json({ error: 'styleId 为必填数字字段' });
    return;
  }

  const style = db
    .prepare('SELECT id FROM houseno_styles WHERE id = ?')
    .get(styleId) as { id: number } | undefined;

  if (!style) {
    res.status(404).json({ error: '样式不存在' });
    return;
  }

  const existing = db
    .prepare('SELECT id FROM favorites WHERE style_id = ?')
    .get(styleId) as { id: number } | undefined;

  if (existing) {
    res.status(409).json({ error: '该样式已在收藏夹中' });
    return;
  }

  const result = db
    .prepare('INSERT INTO favorites (style_id) VALUES (?)')
    .run(styleId);

  const row = db
    .prepare('SELECT * FROM favorites WHERE id = ?')
    .get(result.lastInsertRowid) as FavoriteDbRow;

  res.status(201).json(rowToFavorite(row));
});

/** DELETE /api/favorites/:styleId — 取消收藏 */
router.delete('/:styleId', (req: Request, res: Response) => {
  const styleId = parseInt(req.params.styleId, 10);

  if (isNaN(styleId)) {
    res.status(400).json({ error: '无效的 styleId' });
    return;
  }

  const existing = db
    .prepare('SELECT id FROM favorites WHERE style_id = ?')
    .get(styleId) as { id: number } | undefined;

  if (!existing) {
    res.status(404).json({ error: '该样式未在收藏夹中' });
    return;
  }

  db.prepare('DELETE FROM favorites WHERE style_id = ?').run(styleId);

  res.json({ success: true });
});

export default router;
