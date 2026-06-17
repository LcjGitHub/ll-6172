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
      style_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (style_id) REFERENCES houseno_styles(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_favorites_style_id ON favorites(style_id)
  `);

  return db;
}

const db = createDatabase(process.env.TEST_DB_PATH);

export default db;
