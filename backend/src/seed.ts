import type { DbInstance } from './db';
import db from './db';

export const SEED_DATA = [
  {
    cityDistrict: '上海市 · 黄浦区外滩沿线',
    material: '铸铁烤漆',
    font: '宋体凸雕',
    numberingRules: '路名+门牌号，阿拉伯数字横排，如「中山东一路 12 号」',
    unifiedReplacement: true,
  },
  {
    cityDistrict: '北京市 · 东城区胡同',
    material: '木质刷漆',
    font: '手写楷体',
    numberingRules: '胡同名+院门序号，如「方家胡同 23 号」',
    unifiedReplacement: false,
  },
  {
    cityDistrict: '天津市 · 五大道租界区',
    material: '搪瓷白板',
    font: '黑体印刷',
    numberingRules: '英文路名+数字，中英双语，如「Chengde Rd. 18」',
    unifiedReplacement: true,
  },
  {
    cityDistrict: '广州市 · 荔湾区西关老街',
    material: '青砖嵌铜字',
    font: '隶书阴刻',
    numberingRules: '街巷名+门牌，数字用中文大写，如「逢源大街 叁号」',
    unifiedReplacement: false,
  },
  {
    cityDistrict: '成都市 · 锦江区宽窄巷子',
    material: '竹木底板',
    font: '仿宋体',
    numberingRules: '巷名+号数，数字竖排，如「宽巷子 柒号」',
    unifiedReplacement: true,
  },
];

/**
 * 向空库写入种子数据。
 * @param database - 数据库实例
 * @param force - 是否强制清空后重新插入
 */
export function seedDatabase(database: DbInstance, force = false): { styles: number } {
  let insertedStyles = 0;

  const count = database
    .prepare('SELECT COUNT(*) as count FROM houseno_styles')
    .get() as { count: number };

  if (force || count.count === 0) {
    if (force) {
      database.exec('DELETE FROM houseno_styles');
    }

    const insertStyle = database.prepare(`
      INSERT INTO houseno_styles (
        city_district, material, font, numbering_rules, unified_replacement
      ) VALUES (
        @cityDistrict, @material, @font, @numberingRules, @unifiedReplacement
      )
    `);

    const insertMany = database.transaction((items: typeof SEED_DATA) => {
      for (const item of items) {
        insertStyle.run({
          ...item,
          unifiedReplacement: item.unifiedReplacement ? 1 : 0,
        });
        insertedStyles++;
      }
    });

    insertMany(SEED_DATA);
  }

  return { styles: insertedStyles };
}

if (require.main === undefined || !process.env.DISABLE_AUTO_SEED) {
  const result = seedDatabase(db);
  if (result.styles > 0) {
    console.log(`[seed] 已插入 ${result.styles} 条门牌号样式数据`);
  }
}
