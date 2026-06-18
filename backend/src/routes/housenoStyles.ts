import { Router, Request, Response } from 'express';
import db from '../db';
import type { HousenoStyle, Tag } from '../types';

const router = Router();

interface DbRow {
  id: number;
  city_district: string;
  material: string;
  font: string;
  numbering_rules: string;
  unified_replacement: number;
}

interface TagDbRow {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

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

function rowToTag(row: TagDbRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
  };
}

router.get('/', (req: Request, res: Response) => {
  const tagId = req.query.tagId;
  const material = req.query.material;
  const unifiedReplacement = req.query.unifiedReplacement;
  const keyword = req.query.keyword;

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let joinStyleTags = false;

  if (tagId !== undefined && tagId !== '') {
    joinStyleTags = true;
    conditions.push('st.tag_id = ?');
    params.push(Number(tagId));
  }

  if (material !== undefined && material !== '') {
    conditions.push('hs.material = ?');
    params.push(String(material));
  }

  if (unifiedReplacement !== undefined && unifiedReplacement !== '') {
    conditions.push('hs.unified_replacement = ?');
    params.push(String(unifiedReplacement) === 'true' ? 1 : 0);
  }

  if (keyword !== undefined && keyword !== '') {
    conditions.push('hs.city_district LIKE ?');
    params.push(`%${String(keyword)}%`);
  }

  let sql = 'SELECT hs.* FROM houseno_styles hs';
  if (joinStyleTags) {
    sql += ' INNER JOIN style_tags st ON hs.id = st.style_id';
  }
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ' ORDER BY hs.id';

  const rows = db.prepare(sql).all(...params) as DbRow[];
  res.json(rows.map(rowToStyle));
});

router.get('/material-options', (_req: Request, res: Response) => {
  const rows = db
    .prepare('SELECT DISTINCT material FROM houseno_styles WHERE material IS NOT NULL ORDER BY material')
    .all() as { material: string }[];
  res.json(rows.map((row) => row.material));
});

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

router.get('/:id/tags', (req: Request, res: Response) => {
  const styleId = parseInt(req.params.id, 10);

  const style = db
    .prepare('SELECT id FROM houseno_styles WHERE id = ?')
    .get(styleId) as { id: number } | undefined;

  if (!style) {
    res.status(404).json({ error: '门牌号样式不存在' });
    return;
  }

  const rows = db
    .prepare(`
      SELECT t.* FROM tags t
      INNER JOIN style_tags st ON t.id = st.tag_id
      WHERE st.style_id = ?
      ORDER BY t.id
    `)
    .all(styleId) as TagDbRow[];

  res.json(rows.map(rowToTag));
});

router.post('/:id/tags/:tagId', (req: Request, res: Response) => {
  const styleId = parseInt(req.params.id, 10);
  const tagId = parseInt(req.params.tagId, 10);

  const style = db
    .prepare('SELECT id FROM houseno_styles WHERE id = ?')
    .get(styleId) as { id: number } | undefined;

  if (!style) {
    res.status(404).json({ error: '门牌号样式不存在' });
    return;
  }

  const tag = db
    .prepare('SELECT id FROM tags WHERE id = ?')
    .get(tagId) as { id: number } | undefined;

  if (!tag) {
    res.status(404).json({ error: '标签不存在' });
    return;
  }

  try {
    db.prepare(`
      INSERT OR IGNORE INTO style_tags (style_id, tag_id)
      VALUES (?, ?)
    `).run(styleId, tagId);

    const rows = db
      .prepare(`
        SELECT t.* FROM tags t
        INNER JOIN style_tags st ON t.id = st.tag_id
        WHERE st.style_id = ?
        ORDER BY t.id
      `)
      .all(styleId) as TagDbRow[];

    res.json(rows.map(rowToTag));
  } catch (err) {
    res.status(500).json({ error: '绑定标签失败' });
  }
});

router.delete('/:id/tags/:tagId', (req: Request, res: Response) => {
  const styleId = parseInt(req.params.id, 10);
  const tagId = parseInt(req.params.tagId, 10);

  const style = db
    .prepare('SELECT id FROM houseno_styles WHERE id = ?')
    .get(styleId) as { id: number } | undefined;

  if (!style) {
    res.status(404).json({ error: '门牌号样式不存在' });
    return;
  }

  try {
    db.prepare(`
      DELETE FROM style_tags WHERE style_id = ? AND tag_id = ?
    `).run(styleId, tagId);

    const rows = db
      .prepare(`
        SELECT t.* FROM tags t
        INNER JOIN style_tags st ON t.id = st.tag_id
        WHERE st.style_id = ?
        ORDER BY t.id
      `)
      .all(styleId) as TagDbRow[];

    res.json(rows.map(rowToTag));
  } catch (err) {
    res.status(500).json({ error: '解除标签绑定失败' });
  }
});

export default router;
