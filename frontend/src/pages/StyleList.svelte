<script lang="ts">
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
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
    Card,
  } from 'flowbite-svelte';
  import { fetchHousenoStyles, fetchHousenoStyleMaterials, fetchTags, createHousenoStyle } from '../lib/api';
  import type { HousenoStyleInput, SortField, SortOrder } from '../lib/types';

  let selectedTagId = $state<number | ''>('');
  let selectedMaterial = $state<string>('');
  let selectedUnified = $state<string>('');
  let keywordInput = $state<string>('');
  let debouncedKeyword = $state<string>('');
  let sortField = $state<SortField | undefined>(undefined);
  let sortOrder = $state<SortOrder>('asc');
  let page = $state<number>(1);
  let pageSize = $state<number>(10);

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
    page = 1;
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
    queryKey: ['houseno-styles', { tagId: selectedTagId, material: selectedMaterial, unified: selectedUnified, keyword: debouncedKeyword, sortField, sortOrder, page, pageSize }],
    queryFn: () =>
      fetchHousenoStyles({
        tagId: selectedTagId === '' ? undefined : selectedTagId,
        material: selectedMaterial || undefined,
        unifiedReplacement: selectedUnified === '' ? undefined : selectedUnified === 'true',
        keyword: debouncedKeyword || undefined,
        sortField,
        sortOrder,
        page,
        pageSize,
      }),
  });

  function handleSort(field: SortField) {
    if (sortField === field) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortOrder = 'asc';
    }
    page = 1;
  }

  function getSortIcon(field: SortField): string {
    if (sortField !== field) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  }

  const totalPages = $derived(
    $stylesQuery.data ? Math.ceil($stylesQuery.data.total / pageSize) : 0,
  );

  function goToPage(p: number) {
    if (p < 1 || p > totalPages || p === page) return;
    page = p;
  }

  const pageNumbers = $derived(() => {
    const pages: (number | string)[] = [];
    const total = totalPages;
    const current = page;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
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
    sortField = undefined;
    sortOrder = 'asc';
    page = 1;
  }

  let showCreateForm = $state(false);
  let showCreateSuccess = $state(false);
  let newCityDistrict = $state('');
  let newMaterial = $state('');
  let newFont = $state('');
  let newNumberingRules = $state('');
  let newUnifiedReplacement = $state(false);
  let createFormError = $state('');

  function resetCreateForm() {
    newCityDistrict = '';
    newMaterial = '';
    newFont = '';
    newNumberingRules = '';
    newUnifiedReplacement = false;
    createFormError = '';
  }

  const createStyleMutation = createMutation({
    mutationFn: (input: HousenoStyleInput) => createHousenoStyle(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houseno-styles'] });
      queryClient.invalidateQueries({ queryKey: ['houseno-style-materials'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      resetCreateForm();
      showCreateForm = false;
      showCreateSuccess = true;
      setTimeout(() => {
        showCreateSuccess = false;
      }, 3000);
    },
  });

  function handleCreateSubmit() {
    createFormError = '';
    if (!newCityDistrict.trim()) {
      createFormError = '城市/街区为必填项';
      return;
    }
    if (!newMaterial.trim()) {
      createFormError = '材质为必填项';
      return;
    }
    if (!newFont.trim()) {
      createFormError = '字体为必填项';
      return;
    }
    if (!newNumberingRules.trim()) {
      createFormError = '编号规则为必填项';
      return;
    }
    $createStyleMutation.mutate({
      cityDistrict: newCityDistrict.trim(),
      material: newMaterial.trim(),
      font: newFont.trim(),
      numberingRules: newNumberingRules.trim(),
      unifiedReplacement: newUnifiedReplacement,
    });
  }

  function getErrorMsg(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const resp = (err as { response?: { data?: { error?: string } } }).response;
      if (resp?.data?.error) return resp.data.error;
    }
    return '操作失败，请稍后重试';
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-lg font-semibold text-gray-800">样式列表</h2>
      <p class="mt-1 text-sm text-gray-500">支持按材质、是否统一更换、城市/街区关键字组合筛选</p>
    </div>
    <Button size="sm" color="yellow" onclick={() => showCreateForm = !showCreateForm}>
      {showCreateForm ? '取消' : '+ 新建样式'}
    </Button>
  </div>

  {#if showCreateSuccess}
    <Alert color="green" role="status" aria-live="polite">样式创建成功</Alert>
  {/if}

  {#if showCreateForm}
    {#if $createStyleMutation.error}
      <Alert color="red" role="alert" aria-live="assertive">创建失败：{getErrorMsg($createStyleMutation.error)}</Alert>
    {/if}
    {#if createFormError}
      <Alert color="red" role="alert" aria-live="assertive">{createFormError}</Alert>
    {/if}

    <Card class="max-w-none">
      <h3 class="mb-4 text-base font-semibold text-gray-800">新建样式</h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="newCityDistrict" class="mb-1 block text-sm font-medium text-gray-700">城市/街区 *</label>
          <input
            id="newCityDistrict"
            type="text"
            bind:value={newCityDistrict}
            placeholder="例如：北京市朝阳区"
            class="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500"
          />
        </div>
        <div>
          <label for="newMaterial" class="mb-1 block text-sm font-medium text-gray-700">材质 *</label>
          <input
            id="newMaterial"
            type="text"
            bind:value={newMaterial}
            placeholder="例如：亚克力"
            class="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500"
          />
        </div>
        <div>
          <label for="newFont" class="mb-1 block text-sm font-medium text-gray-700">字体 *</label>
          <input
            id="newFont"
            type="text"
            bind:value={newFont}
            placeholder="例如：黑体"
            class="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500"
          />
        </div>
        <div>
          <label for="newUnifiedReplacement" class="mb-1 block text-sm font-medium text-gray-700">是否统一更换</label>
          <div class="flex items-center gap-2 pt-2.5">
            <input
              id="newUnifiedReplacement"
              type="checkbox"
              bind:checked={newUnifiedReplacement}
              class="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <span class="text-sm text-gray-700">{newUnifiedReplacement ? '是' : '否'}</span>
          </div>
        </div>
        <div class="sm:col-span-2">
          <label for="newNumberingRules" class="mb-1 block text-sm font-medium text-gray-700">编号规则 *</label>
          <textarea
            id="newNumberingRules"
            bind:value={newNumberingRules}
            rows="3"
            placeholder="例如：按街道方向自东向西，单号在北，双号在南，每 50 米一个号段"
            class="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500"
          ></textarea>
        </div>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <Button size="sm" color="alternative" onclick={() => { showCreateForm = false; resetCreateForm(); }}>
          取消
        </Button>
        <Button
          size="sm"
          color="yellow"
          onclick={handleCreateSubmit}
          disabled={$createStyleMutation.isPending}
        >
          {#if $createStyleMutation.isPending}
            创建中...
          {:else}
            创建样式
          {/if}
        </Button>
      </div>
    </Card>
  {/if}

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
    <Alert color="red" role="alert" aria-live="assertive">无法加载样式列表，请确认后端已启动（端口 4000）</Alert>
  {:else if ($stylesQuery.data?.items ?? []).length === 0}
    <Alert color="yellow" role="status" aria-live="polite">
      {hasFilter
        ? '没有符合筛选条件的样式数据，可清除筛选后重试。'
        : '暂无门牌号样式数据，请运行 npm run seed 初始化。'}
    </Alert>
  {:else}
    <div
      id="style-result-count"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="text-sm text-gray-600"
    >
      共 {$stylesQuery.data?.total ?? 0} 条记录
      {#if hasFilter}（符合筛选条件）{/if}
    </div>
    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <Table hoverable aria-describedby="style-result-count">
        <TableHead>
          <TableHeadCell class="cursor-pointer select-none hover:bg-gray-50" onclick={() => handleSort('cityDistrict')}>
            <span class="flex items-center gap-1">
              城市/街区
              <span class="text-gray-400">{getSortIcon('cityDistrict')}</span>
            </span>
          </TableHeadCell>
          <TableHeadCell class="cursor-pointer select-none hover:bg-gray-50" onclick={() => handleSort('material')}>
            <span class="flex items-center gap-1">
              材质
              <span class="text-gray-400">{getSortIcon('material')}</span>
            </span>
          </TableHeadCell>
          <TableHeadCell>字体</TableHeadCell>
          <TableHeadCell>编号规则</TableHeadCell>
          <TableHeadCell>统一更换</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each $stylesQuery.data?.items ?? [] as style (style.id)}
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

    {#if totalPages > 1}
      <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div class="flex flex-1 justify-between sm:hidden">
          <Button size="sm" color="alternative" onclick={() => goToPage(page - 1)} disabled={page <= 1}>
            上一页
          </Button>
          <Button size="sm" color="alternative" onclick={() => goToPage(page + 1)} disabled={page >= totalPages}>
            下一页
          </Button>
        </div>
        <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              第 <span class="font-medium">{page}</span> 页，
              共 <span class="font-medium">{totalPages}</span> 页
            </p>
          </div>
          <div>
            <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onclick={() => goToPage(page - 1)}
                disabled={page <= 1}
                class="relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-medium text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
              >
                上一页
              </button>
              {#each pageNumbers() as p (p)}
                {#if p === '...'}
                  <span class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300">
                    ...
                  </span>
                {:else}
                  <button
                    onclick={() => goToPage(p as number)}
                    class="relative inline-flex items-center px-4 py-2 text-sm font-medium ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0 {p === page ? 'z-10 bg-amber-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600' : 'text-gray-500 hover:bg-gray-50'}"
                  >
                    {p}
                  </button>
                {/if}
              {/each}
              <button
                onclick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                class="relative inline-flex items-center rounded-r-md px-3 py-2 text-sm font-medium text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
              >
                下一页
              </button>
            </nav>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>
