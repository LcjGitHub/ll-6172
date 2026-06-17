import axios from 'axios';
import type { HousenoStyle, Favorite, FavoriteWithStyle, Material, StatisticsOverview, VisitRecord, VisitRecordInput, Tag } from './types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

/** 获取全部门牌号样式列表 */
export async function fetchHousenoStyles(): Promise<HousenoStyle[]> {
  const { data } = await api.get<HousenoStyle[]>('/houseno-styles');
  return data;
}

/** 获取单条门牌号样式详情 */
export async function fetchHousenoStyle(id: number): Promise<HousenoStyle> {
  const { data } = await api.get<HousenoStyle>(`/houseno-styles/${id}`);
  return data;
}

/** 获取收藏列表（含样式详情） */
export async function fetchFavorites(): Promise<FavoriteWithStyle[]> {
  const { data } = await api.get<FavoriteWithStyle[]>('/favorites');
  return data;
}

/** 添加收藏 */
export async function addFavorite(styleId: number): Promise<Favorite> {
  const { data } = await api.post<Favorite>('/favorites', { styleId });
  return data;
}

/** 取消收藏 */
export async function removeFavorite(styleId: number): Promise<void> {
  await api.delete(`/favorites/${styleId}`);
}

/** 获取全部材质列表 */
export async function fetchMaterials(): Promise<Material[]> {
  const { data } = await api.get<Material[]>('/materials');
  return data;
}

/** 获取单条材质详情 */
export async function fetchMaterial(id: number): Promise<Material> {
  const { data } = await api.get<Material>(`/materials/${id}`);
  return data;
}

/** 获取数据概览统计 */
export async function fetchStatisticsOverview(): Promise<StatisticsOverview> {
  const { data } = await api.get<StatisticsOverview>('/statistics/overview');
  return data;
}

/** 按样式查询探访记录列表 */
export async function fetchVisitRecords(styleId: number): Promise<VisitRecord[]> {
  const { data } = await api.get<VisitRecord[]>(`/visit-records/style/${styleId}`);
  return data;
}

/** 新增一条探访记录 */
export async function createVisitRecord(input: VisitRecordInput): Promise<VisitRecord> {
  const { data } = await api.post<VisitRecord>('/visit-records', input);
  return data;
}

/** 获取全部标签列表 */
export async function fetchTags(): Promise<Tag[]> {
  const { data } = await api.get<Tag[]>('/tags');
  return data;
}

/** 获取某样式已绑定的标签列表 */
export async function fetchStyleTags(styleId: number): Promise<Tag[]> {
  const { data } = await api.get<Tag[]>(`/houseno-styles/${styleId}/tags`);
  return data;
}

/** 为某样式绑定标签 */
export async function bindStyleTag(styleId: number, tagId: number): Promise<Tag[]> {
  const { data } = await api.post<Tag[]>(`/houseno-styles/${styleId}/tags/${tagId}`);
  return data;
}

/** 解除某样式的标签绑定 */
export async function unbindStyleTag(styleId: number, tagId: number): Promise<Tag[]> {
  const { data } = await api.delete<Tag[]>(`/houseno-styles/${styleId}/tags/${tagId}`);
  return data;
}

/** 按标签筛选获取样式列表 */
export async function fetchHousenoStylesByTag(tagId?: number): Promise<HousenoStyle[]> {
  const url = tagId ? `/houseno-styles?tagId=${tagId}` : '/houseno-styles';
  const { data } = await api.get<HousenoStyle[]>(url);
  return data;
}
