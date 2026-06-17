<script lang="ts">
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import RouterLink from '../components/RouterLink.svelte';
  import { Badge, Spinner, Alert, Card, Button } from 'flowbite-svelte';
  import { fetchHousenoStyle, fetchFavorites, addFavorite, removeFavorite, fetchVisitRecords, createVisitRecord, fetchTags, fetchStyleTags, bindStyleTag, unbindStyleTag } from '../lib/api';
  import type { HousenoStyle, VisitRecord, Tag } from '../lib/types';

  interface Props {
    id: string;
  }

  let { id }: Props = $props();

  const isValidId = $derived(/^\d+$/.test(id));
  const numericId = $derived(parseInt(id, 10));

  const queryClient = useQueryClient();

  const getId = () => id;
  const getIsValidId = () => isValidId;
  const getNumericId = () => numericId;

  const styleQuery = createQuery({
    queryKey: () => ['houseno-style', getId()],
    queryFn: () => fetchHousenoStyle(parseInt(getId(), 10)),
    enabled: () => getIsValidId(),
  });

  const favoritesQuery = createQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
  });

  const isFavorited = $derived(
    ($favoritesQuery.data ?? []).some((fav) => fav.styleId === numericId),
  );

  const allTagsQuery = createQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  const styleTagsQuery = createQuery({
    queryKey: () => ['style-tags', getId()],
    queryFn: () => fetchStyleTags(getNumericId()),
    enabled: () => getIsValidId(),
  });

  const boundTagIds = $derived(
    new Set(($styleTagsQuery.data ?? []).map((t) => t.id)),
  );

  const availableTags = $derived(
    ($allTagsQuery.data ?? []).filter((t) => !boundTagIds.has(t.id)),
  );

  let selectedTagId = $state<number | ''>('');

  const addMutation = createMutation({
    mutationFn: () => addFavorite(numericId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const removeMutation = createMutation({
    mutationFn: () => removeFavorite(numericId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const bindTagMutation = createMutation({
    mutationFn: (tagId: number) => bindStyleTag(numericId, tagId),
    onSuccess: (data) => {
      queryClient.setQueryData(['style-tags', id], data);
      selectedTagId = '';
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['style-tags', id] });
    },
  });

  const unbindTagMutation = createMutation({
    mutationFn: (tagId: number) => unbindStyleTag(numericId, tagId),
    onSuccess: (data) => {
      queryClient.setQueryData(['style-tags', id], data);
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['style-tags', id] });
    },
  });

  function getErrorMsg(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const resp = (err as { response?: { data?: { error?: string } } }).response;
      if (resp?.data?.error) return resp.data.error;
    }
    return '操作失败，请稍后重试';
  }

  const styleData = $derived($styleQuery.data as HousenoStyle | undefined);

  const visitRecordsQuery = createQuery({
    queryKey: () => ['visit-records', getId()],
    queryFn: () => fetchVisitRecords(getNumericId()),
    enabled: () => getIsValidId(),
  });

  let newVisitDate = $state('');
  let newLocationNotes = $state('');
  let newPlateVisible = $state(false);
  let formError = $state('');

  function resetForm() {
    newVisitDate = '';
    newLocationNotes = '';
    newPlateVisible = false;
    formError = '';
  }

  const addVisitMutation = createMutation({
    mutationFn: () =>
      createVisitRecord({
        styleId: numericId,
        visitDate: newVisitDate,
        locationNotes: newLocationNotes,
        plateVisible: newPlateVisible,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-records', id] });
      resetForm();
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-records', id] });
    },
  });

  function handleAddVisit() {
    formError = '';
    if (!newVisitDate) {
      formError = '探访日期为必填项';
      return;
    }
    $addVisitMutation.mutate();
  }

  function handleBindTag() {
    if (selectedTagId === '') return;
    $bindTagMutation.mutate(selectedTagId);
  }

  function getBadgeColor(color: string): 'amber' | 'blue' | 'red' | 'purple' | 'green' | 'pink' | 'indigo' | 'yellow' | 'teal' | 'cyan' | 'dark' {
    const validColors = ['amber', 'blue', 'red', 'purple', 'green', 'pink', 'indigo', 'yellow', 'teal', 'cyan', 'dark'] as const;
    return (validColors.includes(color as typeof validColors[number]) ? color : 'amber') as typeof validColors[number];
  }
</script>

<div class="space-y-6">
  <RouterLink
    to="/"
    class="inline-flex items-center text-sm text-amber-700 hover:underline"
  >
    ← 返回列表
  </RouterLink>

  {#if !isValidId}
    <Alert color="red">无效的样式 ID</Alert>
  {:else if $styleQuery.isPending}
    <div class="flex justify-center py-12">
      <Spinner size="8" />
    </div>
  {:else if $styleQuery.isError}
    <Alert color="red">样式不存在或后端未启动</Alert>
  {:else if styleData}
    {@const style = styleData}

    {#if $addMutation.error || $removeMutation.error}
      <Alert color="red">
        {#if $addMutation.error}
          收藏失败：{getErrorMsg($addMutation.error)}
        {:else if $removeMutation.error}
          取消收藏失败：{getErrorMsg($removeMutation.error)}
        {/if}
      </Alert>
    {/if}

    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-800">{style.cityDistrict}</h2>
      <div class="flex items-center gap-3">
        {#if style.unifiedReplacement}
          <Badge color="green" large>已统一更换</Badge>
        {:else}
          <Badge color="dark" large>未统一更换</Badge>
        {/if}
        {#if isFavorited}
          <Button
            size="sm"
            color="red"
            onclick={() => $removeMutation.mutate()}
            disabled={$removeMutation.isPending}
          >
            ⭐ 已收藏
          </Button>
        {:else}
          <Button
            size="sm"
            color="yellow"
            onclick={() => $addMutation.mutate()}
            disabled={$addMutation.isPending}
          >
            ☆ 收藏
          </Button>
        {/if}
      </div>
    </div>

    <Card class="max-w-none">
      <dl class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <dt class="text-sm text-gray-500">城市/街区</dt>
          <dd class="mt-1 font-medium text-gray-800">{style.cityDistrict}</dd>
        </div>
        <div>
          <dt class="text-sm text-gray-500">材质</dt>
          <dd class="mt-1 font-medium text-gray-800">{style.material}</dd>
        </div>
        <div>
          <dt class="text-sm text-gray-500">字体</dt>
          <dd class="mt-1">
            <Badge color="yellow" large>{style.font}</Badge>
          </dd>
        </div>
        <div>
          <dt class="text-sm text-gray-500">是否统一更换</dt>
          <dd class="mt-1">
            {#if style.unifiedReplacement}
              <Badge color="green">是</Badge>
            {:else}
              <Badge color="dark">否</Badge>
            {/if}
          </dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-sm text-gray-500">编号规则</dt>
          <dd class="mt-1 whitespace-pre-wrap text-gray-700">{style.numberingRules}</dd>
        </div>
      </dl>
    </Card>

    <div>
      <h3 class="mb-3 text-lg font-semibold text-gray-800">标签</h3>

      {#if $allTagsQuery.isPending || $styleTagsQuery.isPending}
        <div class="flex justify-center py-4">
          <Spinner size="6" />
        </div>
      {:else if $allTagsQuery.isError || $styleTagsQuery.isError}
        <Alert color="red">加载标签数据失败</Alert>
      {:else}
        {@const boundTags = ($styleTagsQuery.data ?? []) as Tag[]}

        <Card class="max-w-none">
          <div class="space-y-4">
            <div>
              <div class="text-sm text-gray-500 mb-2">已绑定标签</div>
              {#if boundTags.length === 0}
                <p class="text-sm text-gray-400">暂无标签</p>
              {:else}
                <div class="flex flex-wrap gap-2">
                  {#each boundTags as tag (tag.id)}
                    <span class="inline-flex items-center gap-1">
                      <Badge color={getBadgeColor(tag.color)} large>
                        {tag.name}
                      </Badge>
                      <button
                        type="button"
                        onclick={() => $unbindTagMutation.mutate(tag.id)}
                        disabled={$unbindTagMutation.isPending}
                        class="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500 disabled:opacity-50"
                        title="移除标签"
                      >
                        ✕
                      </button>
                    </span>
                  {/each}
                </div>
              {/if}
            </div>

            <div class="border-t border-gray-100 pt-4">
              <div class="text-sm text-gray-500 mb-2">添加标签</div>
              <div class="flex items-center gap-2">
                <select
                  bind:value={selectedTagId}
                  class="flex-1 rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500"
                  disabled={availableTags.length === 0 || $bindTagMutation.isPending}
                >
                  <option value="">
                    {availableTags.length === 0 ? '所有标签已绑定' : '请选择要添加的标签...'}
                  </option>
                  {#each availableTags as tag (tag.id)}
                    <option value={tag.id}>{tag.name}</option>
                  {/each}
                </select>
                <Button
                  size="sm"
                  color="amber"
                  onclick={handleBindTag}
                  disabled={selectedTagId === '' || $bindTagMutation.isPending}
                >
                  {#if $bindTagMutation.isPending}
                    添加中...
                  {:else}
                    添加
                  {/if}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      {/if}
    </div>

    <div class="mt-8">
      <h3 class="mb-4 text-lg font-semibold text-gray-800">实地探访记录</h3>

      {#if $visitRecordsQuery.isPending}
        <div class="flex justify-center py-6">
          <Spinner size="6" />
        </div>
      {:else if $visitRecordsQuery.isError}
        <Alert color="red">加载探访记录失败</Alert>
      {:else}
        {@const records = ($visitRecordsQuery.data ?? []) as VisitRecord[]}

        {#if records.length === 0}
          <p class="text-sm text-gray-500">暂无探访记录</p>
        {:else}
          <div class="space-y-3">
            {#each records as record}
              <Card class="max-w-none">
                <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt class="text-sm text-gray-500">探访日期</dt>
                    <dd class="mt-1 font-medium text-gray-800">{record.visitDate}</dd>
                  </div>
                  <div>
                    <dt class="text-sm text-gray-500">是否仍可见原门牌</dt>
                    <dd class="mt-1">
                      {#if record.plateVisible}
                        <Badge color="green">是</Badge>
                      {:else}
                        <Badge color="dark">否</Badge>
                      {/if}
                    </dd>
                  </div>
                  <div class="sm:col-span-2">
                    <dt class="text-sm text-gray-500">探访地点备注</dt>
                    <dd class="mt-1 whitespace-pre-wrap text-gray-700">{record.locationNotes || '—'}</dd>
                  </div>
                </dl>
              </Card>
            {/each}
          </div>
        {/if}

        <div class="mt-6">
          <h4 class="mb-3 text-base font-medium text-gray-700">新增探访记录</h4>

          {#if $addVisitMutation.isSuccess}
            <Alert color="green" class="mb-3">探访记录已添加</Alert>
          {/if}

          {#if formError}
            <Alert color="red" class="mb-3">{formError}</Alert>
          {/if}

          <Card class="max-w-none">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label for="visitDate" class="mb-1 block text-sm font-medium text-gray-700">探访日期 *</label>
                <input
                  id="visitDate"
                  type="date"
                  bind:value={newVisitDate}
                  class="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div>
                <label for="plateVisible" class="mb-1 block text-sm font-medium text-gray-700">是否仍可见原门牌</label>
                <div class="flex items-center gap-2 pt-2.5">
                  <input
                    id="plateVisible"
                    type="checkbox"
                    bind:checked={newPlateVisible}
                    class="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span class="text-sm text-gray-700">{newPlateVisible ? '是' : '否'}</span>
                </div>
              </div>
              <div class="sm:col-span-2">
                <label for="locationNotes" class="mb-1 block text-sm font-medium text-gray-700">探访地点备注</label>
                <textarea
                  id="locationNotes"
                  bind:value={newLocationNotes}
                  rows="2"
                  class="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500"
                  placeholder="输入探访地点相关备注..."
                ></textarea>
              </div>
            </div>
            <div class="mt-4 flex justify-end">
              <Button
                size="sm"
                color="amber"
                onclick={() => handleAddVisit()}
                disabled={$addVisitMutation.isPending}
              >
                {#if $addVisitMutation.isPending}
                  提交中...
                {:else}
                  提交探访记录
                {/if}
              </Button>
            </div>
          </Card>
        </div>
      {/if}
    </div>
  {/if}
</div>
