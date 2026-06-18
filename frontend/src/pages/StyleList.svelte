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
  import { fetchHousenoStyles, fetchHousenoStyleMaterials, fetchTags } from '../lib/api';

  let selectedTagId = $state<number | ''>('');
  let selectedMaterial = $state<string>('');
  let selectedUnified = $state<string>('');
  let keywordInput = $state<string>('');
  let debouncedKeyword = $state<string>('');

  $effect(() => {
    const value = keywordInput;
    const timer = setTimeout(() => {
      debouncedKeyword = value.trim();
    }, 300);
    return () => clearTimeout(timer);
  });

  const queryClient = useQueryClient();

  let invalidateFirstRun = true;
  $effect(() => {
    const filters = [selectedTagId, selectedMaterial, selectedUnified, debouncedKeyword];
    if (invalidateFirstRun) {
      invalidateFirstRun = false;
      return;
    }
    void filters;
    queryClient.resetQueries({ queryKey: ['houseno-styles'] });
  });

  const hasFilter = $derived(
    selectedTagId !== '' ||
      selectedMaterial !== '' ||
      selectedUnified !== '' ||
      debouncedKeyword !== '',
  );

  const tagsQuery = createQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  const materialsQuery = createQuery({
    queryKey: ['houseno-style-materials'],
    queryFn: fetchHousenoStyleMaterials,
  });

  const stylesQuery = createQuery({
    queryKey: ['houseno-styles'],
    queryFn: () =>
      fetchHousenoStyles({
        tagId: selectedTagId === '' ? undefined : selectedTagId,
        material: selectedMaterial || undefined,
        unifiedReplacement: selectedUnified === '' ? undefined : selectedUnified === 'true',
        keyword: debouncedKeyword || undefined,
      }),
  });

  function handleTagChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    selectedTagId = value === '' ? '' : parseInt(value, 10);
  }

  function clearFilters() {
    selectedTagId = '';
    selectedMaterial = '';
    selectedUnified = '';
    keywordInput = '';
    debouncedKeyword = '';
  }
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-lg font-semibold text-gray-800">样式列表</h2>
    <p class="mt-1 text-sm text-gray-500">支持按材质、是否统一更换、城市/街区关键字组合筛选</p>
  </div>

  <div class="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div class="flex flex-col gap-1">
      <label for="tagFilter" class="text-xs font-medium text-gray-600">标签</label>
      <select
        id="tagFilter"
        value={selectedTagId}
        onchange={handleTagChange}
        class="rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500 min-w-[160px]"
      >
        <option value="">全部标签</option>
        {#each ($tagsQuery.data ?? []) as tag (tag.id)}
          <option value={tag.id}>{tag.name}</option>
        {/each}
      </select>
    </div>

    <div class="flex flex-col gap-1">
      <label for="materialFilter" class="text-xs font-medium text-gray-600">材质</label>
      <select
        id="materialFilter"
        bind:value={selectedMaterial}
        class="rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500 min-w-[160px]"
      >
        <option value="">全部材质</option>
        {#each ($materialsQuery.data ?? []) as material (material)}
          <option value={material}>{material}</option>
        {/each}
      </select>
    </div>

    <div class="flex flex-col gap-1">
      <label for="unifiedFilter" class="text-xs font-medium text-gray-600">统一更换</label>
      <select
        id="unifiedFilter"
        bind:value={selectedUnified}
        class="rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500 min-w-[140px]"
      >
        <option value="">全部</option>
        <option value="true">是</option>
        <option value="false">否</option>
      </select>
    </div>

    <div class="flex min-w-[200px] flex-1 flex-col gap-1">
      <label for="keywordFilter" class="text-xs font-medium text-gray-600">城市/街区搜索</label>
      <input
        id="keywordFilter"
        type="text"
        bind:value={keywordInput}
        placeholder="输入城市或街区关键字"
        class="rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500"
      />
    </div>

    {#if hasFilter}
      <Button size="sm" color="alternative" onclick={clearFilters}>清除筛选</Button>
    {/if}
  </div>

  {#if $stylesQuery.isPending}
    <div role="status" aria-live="polite" class="flex justify-center py-12">
      <Spinner size="8" />
      <span class="sr-only">正在加载样式数据</span>
    </div>
  {:else if $stylesQuery.isError}
    <Alert color="red">无法加载样式列表，请确认后端已启动（端口 4000）</Alert>
  {:else if ($stylesQuery.data ?? []).length === 0}
    <Alert color="yellow">
      {hasFilter
        ? '没有符合筛选条件的样式数据，可清除筛选后重试。'
        : '暂无门牌号样式数据，请运行 npm run seed 初始化。'}
    </Alert>
  {:else}
    {#if hasFilter}
      <div
        id="style-result-count"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        class="text-sm text-gray-600"
      >
        共 {($stylesQuery.data ?? []).length} 条符合筛选条件的结果
      </div>
    {/if}
    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <Table hoverable aria-describedby={hasFilter ? 'style-result-count' : undefined}>
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
