import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface DbInstance extends Database.Database {}

/**
 * 创建或打开 SQLite 数据库并初始化表结构。
 * @param customPath - 可选自定义数据库路径
 */
export function createDatabase(customPath?: string): DbInstance {
  let dbPath: string;

  if (customPath) {
    dbPath = customPath;
  } else {
    const DATA_DIR = path.resolve(__dirname, '../data');
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    dbPath = path.join(DATA_DIR, 'houseno.db');
  }

  const db = new Database(dbPath);

  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS houseno_styles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_district TEXT NOT NULL,
      material TEXT NOT NULL,
      font TEXT NOT NULL,
      numbering_rules TEXT NOT NULL,
      unified_replacement INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      style_id INTEGER NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (style_id) REFERENCES houseno_styles(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_style_id ON favorites(style_id)
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      common_uses TEXT NOT NULL,
      care_tips TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_materials_name ON materials(name)
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS visit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      style_id INTEGER NOT NULL,
      visit_date TEXT NOT NULL,
      location_notes TEXT NOT NULL DEFAULT '',
      plate_visible INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (style_id) REFERENCES houseno_styles(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_visit_records_style_id ON visit_records(style_id)
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT 'amber',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name ON tags(name)
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS style_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      style_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (style_id) REFERENCES houseno_styles(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE(style_id, tag_id)
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_style_tags_style_id ON style_tags(style_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_style_tags_tag_id ON style_tags(tag_id)
  `);

  return db;
}

const db = createDatabase(process.env.TEST_DB_PATH);

export default db;
