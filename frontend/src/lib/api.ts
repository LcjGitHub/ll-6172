import axios from 'axios';
import type { HousenoStyle, Favorite, FavoriteWithStyle, Material, StatisticsOverview, VisitRecord, VisitRecordInput } from './types';

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
