/** 门牌号字体样式 */
export interface HousenoStyle {
  id: number;
  cityDistrict: string;
  material: string;
  font: string;
  numberingRules: string;
  unifiedReplacement: boolean;
}

/** 创建/更新门牌号样式时的输入 */
export interface HousenoStyleInput {
  cityDistrict: string;
  material: string;
  font: string;
  numberingRules: string;
  unifiedReplacement: boolean;
}

/** 收藏记录 */
export interface Favorite {
  id: number;
  styleId: number;
  createdAt: string;
}

/** 收藏记录（含关联的样式详情） */
export interface FavoriteWithStyle extends Favorite {
  style: HousenoStyle;
}

/** 材质百科 */
export interface Material {
  id: number;
  name: string;
  commonUses: string;
  careTips: string;
}
