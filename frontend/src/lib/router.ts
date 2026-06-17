import { get, writable } from 'svelte/store';

/** 当前路径 */
export const pathname = writable<string>(
  typeof window !== 'undefined' ? window.location.pathname : '/',
);

/**
 * 初始化浏览器路由监听。
 * @returns 清理函数
 */
export function initRouter(): () => void {
  const onPopState = () => {
    pathname.set(window.location.pathname);
  };

  window.addEventListener('popstate', onPopState);
  return () => window.removeEventListener('popstate', onPopState);
}

/**
 * 编程式导航。
 * @param to - 目标路径
 */
export function navigate(to: string): void {
  if (get(pathname) === to) return;
  window.history.pushState({}, '', to);
  pathname.set(to);
}

/**
 * 从路径解析样式编号。
 * @param path - 当前路径
 */
export function parseStyleId(path: string): string | null {
  const match = path.match(/^\/styles\/(\d+)$/);
  return match ? match[1] : null;
}

/**
 * 判断是否为样式列表页。
 * @param path - 当前路径
 */
export function isStyleList(path: string): boolean {
  return path === '/' || path === '/styles';
}

/**
 * 判断是否为收藏列表页。
 * @param path - 当前路径
 */
export function isFavorites(path: string): boolean {
  return path === '/favorites';
}

/**
 * 从路径解析材质编号。
 * @param path - 当前路径
 */
export function parseMaterialId(path: string): string | null {
  const match = path.match(/^\/materials\/(\d+)$/);
  return match ? match[1] : null;
}

/**
 * 判断是否为材质列表页。
 * @param path - 当前路径
 */
export function isMaterialList(path: string): boolean {
  return path === '/materials';
}

/**
 * 判断是否为材质详情路径（含无效编号）。
 * @param path - 当前路径
 */
export function isMaterialDetail(path: string): boolean {
  return /^\/materials\/.+/.test(path);
}

/**
 * 判断是否为数据概览页。
 * @param path - 当前路径
 */
export function isOverview(path: string): boolean {
  return path === '/overview';
}
