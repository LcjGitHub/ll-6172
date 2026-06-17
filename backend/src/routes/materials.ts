import { Router, Request, Response } from 'express';
import db from '../db';
import type { Material } from '../types';

const router = Router();

interface DbRow {
  id: number;
  name: string;
  common_uses: string;
  care_tips: string;
}

function rowToMaterial(row: DbRow): Material {
  return {
    id: row.id,
    name: row.name,
    commonUses: row.common_uses,
    careTips: row.care_tips,
  };
}

router.get('/', (_req: Request, res: Response) => {
  const rows = db
    .prepare('SELECT * FROM materials ORDER BY id')
    .all() as DbRow[];
  res.json(rows.map(rowToMaterial));
});

router.get('/:id', (req: Request, res: Response) => {
  const row = db
    .prepare('SELECT * FROM materials WHERE id = ?')
    .get(req.params.id) as DbRow | undefined;

  if (!row) {
    res.status(404).json({ error: '材质不存在' });
    return;
  }

  res.json(rowToMaterial(row));
});

export default router;
