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
  import type { HousenoStyleInput } from '../lib/types';

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
  {:else if ($stylesQuery.data ?? []).length === 0}
    <Alert color="yellow" role="status" aria-live="polite">
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
