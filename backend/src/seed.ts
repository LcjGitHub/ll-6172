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

export const MATERIAL_SEED_DATA = [
  {
    name: '铸铁',
    commonUses: '老式门牌号、街道牌、公共标识牌，具有强烈的历史感和耐久性',
    careTips: '定期用软布擦拭除尘，避免潮湿环境以防生锈；如出现锈迹，可用细砂纸轻轻打磨后喷涂防锈漆',
  },
  {
    name: '实木',
    commonUses: '传统民居门牌、庭院标识、老字号店铺招牌，自然质感温暖',
    careTips: '避免阳光直射和雨淋，定期涂刷木蜡油或清漆保养；保持干燥，防止霉变和虫蛀',
  },
  {
    name: '搪瓷',
    commonUses: '近代租界区门牌号、路牌、号码牌，色彩鲜明且易清洁',
    careTips: '用软布蘸温和清洁剂擦拭，避免硬物刮划表面；防止撞击导致瓷面脱落',
  },
  {
    name: '黄铜',
    commonUses: '高档住宅门牌、别墅标识、艺术门牌，具有尊贵的金属质感',
    careTips: '使用专用黄铜清洁剂定期抛光，避免接触酸性物质；氧化变暗时可用柠檬加盐擦拭',
  },
  {
    name: '石材',
    commonUses: '历史建筑门牌、纪念性标识、永久性铭牌，庄重且经久耐用',
    careTips: '定期用清水冲洗，避免强酸强碱腐蚀；表面如有污渍可用中性清洁剂配合软刷清理',
  },
];

/**
 * 向空库写入种子数据。
 * @param database - 数据库实例
 * @param force - 是否强制清空后重新插入
 */
export function seedDatabase(database: DbInstance, force = false): { styles: number; materials: number } {
  let insertedStyles = 0;
  let insertedMaterials = 0;

  const styleCount = database
    .prepare('SELECT COUNT(*) as count FROM houseno_styles')
    .get() as { count: number };

  if (force || styleCount.count === 0) {
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

    const insertManyStyles = database.transaction((items: typeof SEED_DATA) => {
      for (const item of items) {
        insertStyle.run({
          ...item,
          unifiedReplacement: item.unifiedReplacement ? 1 : 0,
        });
        insertedStyles++;
      }
    });

    insertManyStyles(SEED_DATA);
  }

  const materialCount = database
    .prepare('SELECT COUNT(*) as count FROM materials')
    .get() as { count: number };

  if (force || materialCount.count === 0) {
    if (force) {
      database.exec('DELETE FROM materials');
    }

    const insertMaterial = database.prepare(`
      INSERT INTO materials (
        name, common_uses, care_tips
      ) VALUES (
        @name, @commonUses, @careTips
      )
    `);

    const insertManyMaterials = database.transaction((items: typeof MATERIAL_SEED_DATA) => {
      for (const item of items) {
        insertMaterial.run(item);
        insertedMaterials++;
      }
    });

    insertManyMaterials(MATERIAL_SEED_DATA);
  }

  return { styles: insertedStyles, materials: insertedMaterials };
}

if (require.main === undefined || !process.env.DISABLE_AUTO_SEED) {
  const result = seedDatabase(db);
  if (result.styles > 0) {
    console.log(`[seed] 已插入 ${result.styles} 条门牌号样式数据`);
  }
  if (result.materials > 0) {
    console.log(`[seed] 已插入 ${result.materials} 条材质百科数据`);
  }
}
