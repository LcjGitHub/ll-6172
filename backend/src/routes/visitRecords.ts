import { Router, Request, Response } from 'express';
import db from '../db';
import type { VisitRecord } from '../types';

const router = Router();

interface VisitRecordDbRow {
  id: number;
  style_id: number;
  visit_date: string;
  location_notes: string;
  plate_visible: number;
  created_at: string;
}

function rowToVisitRecord(row: VisitRecordDbRow): VisitRecord {
  return {
    id: row.id,
    styleId: row.style_id,
    visitDate: row.visit_date,
    locationNotes: row.location_notes,
    plateVisible: row.plate_visible === 1,
    createdAt: row.created_at,
  };
}

router.get('/style/:styleId', (req: Request, res: Response) => {
  const styleId = parseInt(req.params.styleId, 10);

  if (isNaN(styleId)) {
    res.status(400).json({ error: '无效的 styleId' });
    return;
  }

  const style = db
    .prepare('SELECT id FROM houseno_styles WHERE id = ?')
    .get(styleId) as { id: number } | undefined;

  if (!style) {
    res.status(404).json({ error: '样式不存在' });
    return;
  }

  const rows = db
    .prepare('SELECT * FROM visit_records WHERE style_id = ? ORDER BY visit_date DESC, id DESC')
    .all(styleId) as VisitRecordDbRow[];

  res.json(rows.map(rowToVisitRecord));
});

router.post('/', (req: Request, res: Response) => {
  const { styleId, visitDate, locationNotes, plateVisible } = req.body;

  if (!styleId || typeof styleId !== 'number') {
    res.status(400).json({ error: 'styleId 为必填数字字段' });
    return;
  }

  if (!visitDate || typeof visitDate !== 'string') {
    res.status(400).json({ error: 'visitDate 为必填字符串字段' });
    return;
  }

  if (typeof locationNotes !== 'string') {
    res.status(400).json({ error: 'locationNotes 为必填字符串字段' });
    return;
  }

  if (typeof plateVisible !== 'boolean') {
    res.status(400).json({ error: 'plateVisible 为必填布尔字段' });
    return;
  }

  const style = db
    .prepare('SELECT id FROM houseno_styles WHERE id = ?')
    .get(styleId) as { id: number } | undefined;

  if (!style) {
    res.status(404).json({ error: '样式不存在' });
    return;
  }

  const result = db
    .prepare(
      'INSERT INTO visit_records (style_id, visit_date, location_notes, plate_visible) VALUES (?, ?, ?, ?)',
    )
    .run(styleId, visitDate, locationNotes, plateVisible ? 1 : 0);

  const row = db
    .prepare('SELECT * FROM visit_records WHERE id = ?')
    .get(result.lastInsertRowid) as VisitRecordDbRow;

  res.status(201).json(rowToVisitRecord(row));
});

export default router;
