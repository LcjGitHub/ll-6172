import axios from 'axios';
import type { HousenoStyle, HousenoStyleDetail, HousenoStyleInput, HousenoStyleFilter, Favorite, FavoriteWithStyle, Material, StatisticsOverview, VisitRecord, VisitRecordInput, Tag, PaginatedResult } from './types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

/** 获取门牌号样式列表（支持筛选、排序、分页） */
export async function fetchHousenoStyles(filter: HousenoStyleFilter = {}): Promise<PaginatedResult<HousenoStyle>> {
  const params = new URLSearchParams();
  if (filter.tagId !== undefined) {
    params.set('tagId', String(filter.tagId));
  }
  if (filter.material) {
    params.set('material', filter.material);
  }
  if (filter.unifiedReplacement !== undefined) {
    params.set('unifiedReplacement', String(filter.unifiedReplacement));
  }
  if (filter.keyword) {
    params.set('keyword', filter.keyword);
  }
  if (filter.sortField) {
    params.set('sortField', filter.sortField);
  }
  if (filter.sortOrder) {
    params.set('sortOrder', filter.sortOrder);
  }
  if (filter.page !== undefined) {
    params.set('page', String(filter.page));
  }
  if (filter.pageSize !== undefined) {
    params.set('pageSize', String(filter.pageSize));
  }
  const query = params.toString();
  const url = query ? `/houseno-styles?${query}` : '/houseno-styles';
  const { data } = await api.get<PaginatedResult<HousenoStyle>>(url);
  return data;
}

/** 获取门牌号样式中已存在的材质选项（用于材质筛选下拉框） */
export async function fetchHousenoStyleMaterials(): Promise<string[]> {
  const { data } = await api.get<string[]>('/houseno-styles/material-options');
  return data;
}

/** 获取单条门牌号样式详情（含同材质推荐） */
export async function fetchHousenoStyle(id: number): Promise<HousenoStyleDetail> {
  const { data } = await api.get<HousenoStyleDetail>(`/houseno-styles/${id}`);
  return data;
}

/** 创建门牌号样式 */
export async function createHousenoStyle(input: HousenoStyleInput): Promise<HousenoStyle> {
  const { data } = await api.post<HousenoStyle>('/houseno-styles', input);
  return data;
}

/** 更新门牌号样式 */
export async function updateHousenoStyle(id: number, input: HousenoStyleInput): Promise<HousenoStyle> {
  const { data } = await api.put<HousenoStyle>(`/houseno-styles/${id}`, input);
  return data;
}

/** 删除门牌号样式 */
export async function deleteHousenoStyle(id: number): Promise<void> {
  await api.delete(`/houseno-styles/${id}`);
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
export async function fetchHousenoStylesByTag(tagId?: number): Promise<PaginatedResult<HousenoStyle>> {
  return fetchHousenoStyles(tagId === undefined ? {} : { tagId });
}

/** 导出门牌号样式为 Excel 文件（支持筛选条件） */
export async function exportHousenoStyles(filter: HousenoStyleFilter = {}): Promise<void> {
  const params = new URLSearchParams();
  if (filter.tagId !== undefined) {
    params.set('tagId', String(filter.tagId));
  }
  if (filter.material) {
    params.set('material', filter.material);
  }
  if (filter.unifiedReplacement !== undefined) {
    params.set('unifiedReplacement', String(filter.unifiedReplacement));
  }
  if (filter.keyword) {
    params.set('keyword', filter.keyword);
  }
  if (filter.sortField) {
    params.set('sortField', filter.sortField);
  }
  if (filter.sortOrder) {
    params.set('sortOrder', filter.sortOrder);
  }
  const query = params.toString();
  const url = query ? `/houseno-styles/export?${query}` : '/houseno-styles/export';

  const response = await api.get(url, {
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'];
  let filename = '门牌号样式.xlsx';
  if (contentDisposition) {
    const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="([^"]+)"/);
    if (match) {
      filename = decodeURIComponent(match[1] || match[2]);
    }
  }

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
