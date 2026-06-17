/** 门牌号字体样式 */
export interface HousenoStyle {
  id: number;
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

/** 收藏记录（含关联样式详情） */
export interface FavoriteWithStyle extends Favorite {
  style: HousenoStyle;
}
