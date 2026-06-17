import axios from 'axios';
import type { HousenoStyle, Favorite, FavoriteWithStyle } from './types';

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
