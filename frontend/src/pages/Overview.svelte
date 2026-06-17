<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { Card, Spinner, Alert } from 'flowbite-svelte';
  import { fetchStatisticsOverview } from '../lib/api';
  import type { MaterialDistribution } from '../lib/types';

  const statisticsQuery = createQuery({
    queryKey: ['statistics-overview'],
    queryFn: fetchStatisticsOverview,
  });

  function getMaterialBarWidth(item: MaterialDistribution, total: number): string {
    if (total === 0) return '0%';
    return `${(item.count / total) * 100}%`;
  }

  function getReplacementBarWidth(value: number, total: number): string {
    if (total === 0) return '0%';
    return `${(value / total) * 100}%`;
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
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold text-gray-800">📊 数据概览</h2>
  </div>

  {#if $statisticsQuery.isPending}
    <div class="flex justify-center py-12">
      <Spinner size="8" />
    </div>
  {:else if $statisticsQuery.isError}
    <Alert color="red">无法加载统计数据，请确认后端已启动（端口 4000）</Alert>
  {:else}
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card class="text-center">
        <div class="text-4xl font-bold text-blue-600">{$statisticsQuery.data?.totalStyles ?? 0}</div>
        <div class="mt-2 text-sm text-gray-600">样式总数</div>
      </Card>
      <Card class="text-center">
        <div class="text-4xl font-bold text-emerald-600">{$statisticsQuery.data?.replacementStatus.unified ?? 0}</div>
        <div class="mt-2 text-sm text-gray-600">已统一更换</div>
      </Card>
      <Card class="text-center">
        <div class="text-4xl font-bold text-rose-600">{$statisticsQuery.data?.replacementStatus.notUnified ?? 0}</div>
        <div class="mt-2 text-sm text-gray-600">未统一更换</div>
      </Card>
    </div>

    <Card>
      <h3 class="mb-4 text-base font-semibold text-gray-800">各材质数量分布</h3>
      <div class="space-y-3">
        {#each $statisticsQuery.data?.materialDistribution ?? [] as item, index}
          <div class="space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-700">{item.material}</span>
              <span class="font-medium text-gray-900">{item.count}</span>
            </div>
            <div class="h-4 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                class="h-full rounded-full {materialColors[index % materialColors.length]}"
                style="width: {getMaterialBarWidth(item, $statisticsQuery.data?.totalStyles ?? 0)}"
              ></div>
            </div>
          </div>
        {/each}
        {#if ($statisticsQuery.data?.materialDistribution ?? []).length === 0}
          <div class="py-4 text-center text-sm text-gray-500">暂无材质数据</div>
        {/if}
      </div>
    </Card>

    <Card>
      <h3 class="mb-4 text-base font-semibold text-gray-800">统一更换状态对比</h3>
      <div class="space-y-4">
        <div class="space-y-1">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-700">已统一更换</span>
            <span class="font-medium text-emerald-700">{$statisticsQuery.data?.replacementStatus.unified ?? 0}</span>
          </div>
          <div class="h-6 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              class="h-full rounded-full bg-emerald-500"
              style="width: {getReplacementBarWidth($statisticsQuery.data?.replacementStatus.unified ?? 0, $statisticsQuery.data?.totalStyles ?? 0)}"
            ></div>
          </div>
        </div>
        <div class="space-y-1">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-700">未统一更换</span>
            <span class="font-medium text-rose-700">{$statisticsQuery.data?.replacementStatus.notUnified ?? 0}</span>
          </div>
          <div class="h-6 w-full overflow-hidden rounded-full bg-gray-100">
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
