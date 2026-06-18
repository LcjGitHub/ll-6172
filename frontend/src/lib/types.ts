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

/** 门牌号样式列表筛选条件 */
export interface HousenoStyleFilter {
  /** 按标签精确筛选 */
  tagId?: number;
  /** 按材质精确筛选 */
  material?: string;
  /** 按是否统一更换筛选 */
  unifiedReplacement?: boolean;
  /** 按城市/街区关键字模糊搜索 */
  keyword?: string;
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

/** 材质百科 */
export interface Material {
  id: number;
  name: string;
  commonUses: string;
  careTips: string;
}

/** 材质数量分布 */
export interface MaterialDistribution {
  material: string;
  count: number;
}

/** 统一更换状态对比 */
export interface ReplacementStatus {
  unified: number;
  notUnified: number;
}

/** 实地探访记录 */
export interface VisitRecord {
  id: number;
  styleId: number;
  visitDate: string;
  locationNotes: string;
  plateVisible: boolean;
  createdAt: string;
}

/** 新增探访记录时的输入 */
export interface VisitRecordInput {
  styleId: number;
  visitDate: string;
  locationNotes: string;
  plateVisible: boolean;
}

/** 数据概览统计 */
export interface StatisticsOverview {
  totalStyles: number;
  materialDistribution: MaterialDistribution[];
  replacementStatus: ReplacementStatus;
}

/** 标签 */
export interface Tag {
  id: number;
  name: string;
  color: string;
  createdAt: string;
}
