<script lang="ts">
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import RouterLink from '../components/RouterLink.svelte';
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Badge,
    Spinner,
    Alert,
    Button,
  } from 'flowbite-svelte';
  import { fetchHousenoStylesByTag, fetchTags } from '../lib/api';
  import type { Tag } from '../lib/types';

  const queryClient = useQueryClient();

  let selectedTagId = $state<number | ''>('');

  const tagsQuery = createQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  const stylesQuery = createQuery({
    queryKey: ['houseno-styles', selectedTagId],
    queryFn: () => fetchHousenoStylesByTag(selectedTagId === '' ? undefined : selectedTagId),
  });

  function handleTagChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    selectedTagId = value === '' ? '' : parseInt(value, 10);
    queryClient.invalidateQueries({ queryKey: ['houseno-styles'] });
  }
</script>

<div class="space-y-6">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <h2 class="text-lg font-semibold text-gray-800">样式列表</h2>
    <div class="flex items-center gap-2">
      <label for="tagFilter" class="text-sm font-medium text-gray-700 whitespace-nowrap">按标签筛选：</label>
      {#if $tagsQuery.isPending}
        <Spinner size="4" />
      {:else}
        <select
          id="tagFilter"
          value={selectedTagId}
          onchange={handleTagChange}
          class="rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500 min-w-[180px]"
        >
          <option value="">全部标签</option>
          {#each ($tagsQuery.data ?? []) as tag (tag.id)}
            <option value={tag.id}>{tag.name}</option>
          {/each}
        </select>
        {#if selectedTagId !== ''}
          <Button
            size="xs"
            color="gray"
            onclick={() => {
              selectedTagId = '';
              queryClient.invalidateQueries({ queryKey: ['houseno-styles'] });
            }}
          >
            清除筛选
          </Button>
        {/if}
      {/if}
    </div>
  </div>

  {#if $stylesQuery.isPending}
    <div class="flex justify-center py-12">
      <Spinner size="8" />
    </div>
  {:else if $stylesQuery.isError}
    <Alert color="red">无法加载样式列表，请确认后端已启动（端口 4000）</Alert>
  {:else if ($stylesQuery.data ?? []).length === 0}
    <Alert color="yellow">
      {selectedTagId === ''
        ? '暂无门牌号样式数据，请运行 npm run seed 初始化。'
        : '所选标签下暂无样式数据。'}
    </Alert>
  {:else}
    {#if selectedTagId !== '' && $tagsQuery.data}
      {@const selectedTag = ($tagsQuery.data as Tag[]).find((t) => t.id === selectedTagId)}
      {#if selectedTag}
        <div class="text-sm text-gray-600">
          当前筛选标签：<Badge color={selectedTag.color as any}>{selectedTag.name}</Badge>
          ，共 {($stylesQuery.data ?? []).length} 条结果
        </div>
      {/if}
    {/if}
    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <Table hoverable>
        <TableHead>
          <TableHeadCell>城市/街区</TableHeadCell>
          <TableHeadCell>材质</TableHeadCell>
          <TableHeadCell>字体</TableHeadCell>
          <TableHeadCell>编号规则</TableHeadCell>
          <TableHeadCell>统一更换</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each $stylesQuery.data ?? [] as style (style.id)}
            <TableBodyRow>
              <TableBodyCell>
                <RouterLink
                  to="/styles/{style.id}"
                  class="font-medium text-amber-700 hover:underline"
                >
                  {style.cityDistrict}
                </RouterLink>
              </TableBodyCell>
              <TableBodyCell class="text-gray-600">{style.material}</TableBodyCell>
              <TableBodyCell>
                <Badge color="yellow">{style.font}</Badge>
              </TableBodyCell>
              <TableBodyCell class="max-w-xs truncate text-gray-600">
                {style.numberingRules}
              </TableBodyCell>
              <TableBodyCell>
                {#if style.unifiedReplacement}
                  <Badge color="green">是</Badge>
                {:else}
                  <Badge color="dark">否</Badge>
                {/if}
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  {/if}
</div>
