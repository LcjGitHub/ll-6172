import { Router, Request, Response } from 'express';
import db from '../db';
import type { Tag } from '../types';

const router = Router();

interface DbRow {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

function rowToTag(row: DbRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
  };
}

router.get('/', (_req: Request, res: Response) => {
  const rows = db
    .prepare('SELECT * FROM tags ORDER BY id')
    .all() as DbRow[];
  res.json(rows.map(rowToTag));
});

export default router;
