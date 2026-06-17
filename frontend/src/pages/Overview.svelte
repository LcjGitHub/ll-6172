<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { Card, Spinner, Alert } from 'flowbite-svelte';
  import { fetchStatisticsOverview } from '../lib/api';
  import type { MaterialDistribution } from '../lib/types';

  const statisticsQuery = createQuery({
    queryKey: ['statistics-overview'],
    queryFn: fetchStatisticsOverview,
  });

  function getMaxMaterialCount(items: MaterialDistribution[]): number {
    if (items.length === 0) return 0;
    return items.reduce((max, item) => Math.max(max, item.count), 0);
  }

  function getMaterialBarWidth(item: MaterialDistribution, maxCount: number): string {
    if (maxCount === 0) return '0%';
    return `${(item.count / maxCount) * 100}%`;
  }

  function getMaterialPercentage(item: MaterialDistribution, maxCount: number): string {
    if (maxCount === 0) return '0';
    return `${((item.count / maxCount) * 100).toFixed(1)}`;
  }

  function getReplacementBarWidth(value: number, total: number): string {
    if (total === 0) return '0%';
    return `${(value / total) * 100}%`;
  }

  function getReplacementPercentage(value: number, total: number): string {
    if (total === 0) return '0';
    return `${((value / total) * 100).toFixed(1)}`;
  }

  const materialColors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-purple-500',
    'bg-cyan-500',
    'bg-orange-500',
    'bg-indigo-500',
  ];
</script>

<div class="space-y-6">
  {#if $statisticsQuery.isPending}
    <div class="flex justify-center py-12">
      <Spinner size="8" />
    </div>
  {:else if $statisticsQuery.isError}
    <Alert color="red">无法加载统计数据，请确认后端已启动（端口 4000）</Alert>
  {:else}
    <div
      class="grid grid-cols-1 gap-4 md:grid-cols-3"
      role="region"
      aria-label="核心数据统计卡片，共三项：样式总数、已统一更换数量、未统一更换数量"
    >
      <Card class="text-center">
        <div
          class="text-4xl font-bold text-blue-600"
          aria-label={`样式总数，共 ${$statisticsQuery.data?.totalStyles ?? 0} 个`}
        >
          {$statisticsQuery.data?.totalStyles ?? 0}
        </div>
        <div class="mt-2 text-sm text-gray-600">样式总数</div>
      </Card>
      <Card class="text-center">
        <div
          class="text-4xl font-bold text-emerald-600"
          aria-label={`已统一更换，共 ${$statisticsQuery.data?.replacementStatus.unified ?? 0} 个，占比 ${getReplacementPercentage($statisticsQuery.data?.replacementStatus.unified ?? 0, $statisticsQuery.data?.totalStyles ?? 0)} 百分比`}
        >
          {$statisticsQuery.data?.replacementStatus.unified ?? 0}
        </div>
        <div class="mt-2 text-sm text-gray-600">已统一更换</div>
      </Card>
      <Card class="text-center">
        <div
          class="text-4xl font-bold text-rose-600"
          aria-label={`未统一更换，共 ${$statisticsQuery.data?.replacementStatus.notUnified ?? 0} 个，占比 ${getReplacementPercentage($statisticsQuery.data?.replacementStatus.notUnified ?? 0, $statisticsQuery.data?.totalStyles ?? 0)} 百分比`}
        >
          {$statisticsQuery.data?.replacementStatus.notUnified ?? 0}
        </div>
        <div class="mt-2 text-sm text-gray-600">未统一更换</div>
      </Card>
    </div>

    <Card role="region" aria-label="各材质数量分布条形图">
      <h3 class="mb-4 text-base font-semibold text-gray-800">各材质数量分布</h3>
      <div class="space-y-3" role="list">
        {#each $statisticsQuery.data?.materialDistribution ?? [] as item, index}
          <div class="space-y-1" role="listitem">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-700">{item.material}</span>
              <span class="font-medium text-gray-900" aria-label={`${item.material}，共 ${item.count} 个`}>{item.count}</span>
            </div>
            <div
              class="h-4 w-full overflow-hidden rounded-full bg-gray-100"
              role="img"
              aria-label={`${item.material} 数量为 ${item.count}，为最大值的 ${getMaterialPercentage(item, getMaxMaterialCount($statisticsQuery.data?.materialDistribution ?? []))} 百分比`}
            >
              <div
                class="h-full rounded-full {materialColors[index % materialColors.length]}"
                style="width: {getMaterialBarWidth(item, getMaxMaterialCount($statisticsQuery.data?.materialDistribution ?? []))}"
              ></div>
            </div>
          </div>
        {/each}
        {#if ($statisticsQuery.data?.materialDistribution ?? []).length === 0}
          <div class="py-4 text-center text-sm text-gray-500">暂无材质数据</div>
        {/if}
      </div>
    </Card>

    <Card role="region" aria-label="统一更换状态对比条形图">
      <h3 class="mb-4 text-base font-semibold text-gray-800">统一更换状态对比</h3>
      <div class="space-y-4" role="list">
        <div class="space-y-1" role="listitem">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-700">已统一更换</span>
            <span class="font-medium text-emerald-700">{$statisticsQuery.data?.replacementStatus.unified ?? 0}</span>
          </div>
          <div
            class="h-6 w-full overflow-hidden rounded-full bg-gray-100"
            role="img"
            aria-label={`已统一更换数量为 ${$statisticsQuery.data?.replacementStatus.unified ?? 0}，占总数的 ${getReplacementPercentage($statisticsQuery.data?.replacementStatus.unified ?? 0, $statisticsQuery.data?.totalStyles ?? 0)} 百分比`}
          >
            <div
              class="h-full rounded-full bg-emerald-500"
              style="width: {getReplacementBarWidth($statisticsQuery.data?.replacementStatus.unified ?? 0, $statisticsQuery.data?.totalStyles ?? 0)}"
            ></div>
          </div>
        </div>
        <div class="space-y-1" role="listitem">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-700">未统一更换</span>
            <span class="font-medium text-rose-700">{$statisticsQuery.data?.replacementStatus.notUnified ?? 0}</span>
          </div>
          <div
            class="h-6 w-full overflow-hidden rounded-full bg-gray-100"
            role="img"
            aria-label={`未统一更换数量为 ${$statisticsQuery.data?.replacementStatus.notUnified ?? 0}，占总数的 ${getReplacementPercentage($statisticsQuery.data?.replacementStatus.notUnified ?? 0, $statisticsQuery.data?.totalStyles ?? 0)} 百分比`}
          >
            <div
              class="h-full rounded-full bg-rose-500"
              style="width: {getReplacementBarWidth($statisticsQuery.data?.replacementStatus.notUnified ?? 0, $statisticsQuery.data?.totalStyles ?? 0)}"
            ></div>
          </div>
        </div>
      </div>
    </Card>
  {/if}
</div>
