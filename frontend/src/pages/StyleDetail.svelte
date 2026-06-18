<script lang="ts">
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { navigate } from '../lib/router';
  import RouterLink from '../components/RouterLink.svelte';
  import { Badge, Spinner, Alert, Card, Button, Modal } from 'flowbite-svelte';
  import { fetchHousenoStyle, fetchFavorites, addFavorite, removeFavorite, fetchVisitRecords, createVisitRecord, fetchTags, fetchStyleTags, bindStyleTag, unbindStyleTag, updateHousenoStyle, deleteHousenoStyle } from '../lib/api';
  import type { HousenoStyle, HousenoStyleDetail, VisitRecord, Tag, HousenoStyleInput } from '../lib/types';

  interface Props {
    id: string;
  }

  let { id }: Props = $props();

  const isValidId = $derived(/^\d+$/.test(id));
  const numericId = $derived(parseInt(id, 10));

  const queryClient = useQueryClient();

  const styleQuery = createQuery({
    queryKey: ['houseno-style', id],
    queryFn: () => fetchHousenoStyle(parseInt(id, 10)),
    enabled: isValidId,
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
    queryKey: ['style-tags', id],
    queryFn: () => fetchStyleTags(parseInt(id, 10)),
    enabled: isValidId,
  });

  const boundTagIds = $derived(
    new Set(($styleTagsQuery.data ?? []).map((t) => t.id)),
  );

  const availableTags = $derived(
    ($allTagsQuery.data ?? []).filter((t) => !boundTagIds.has(t.id)),
  );

  let selectedTagId = $state<number | ''>('');

  function handleTagSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    selectedTagId = value === '' ? '' : parseInt(value, 10);
  }

  const addMutation = createMutation({
    mutationFn: () => addFavorite(parseInt(id, 10)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const removeMutation = createMutation({
    mutationFn: () => removeFavorite(parseInt(id, 10)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const bindTagMutation = createMutation({
    mutationFn: (tagId: number) => bindStyleTag(parseInt(id, 10), tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-tags', id] });
      selectedTagId = '';
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['style-tags', id] });
    },
  });

  const unbindTagMutation = createMutation({
    mutationFn: (tagId: number) => unbindStyleTag(parseInt(id, 10), tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-tags', id] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['style-tags', id] });
    },
  });

  let isEditing = $state(false);
  let editCityDistrict = $state('');
  let editMaterial = $state('');
  let editFont = $state('');
  let editNumberingRules = $state('');
  let editUnifiedReplacement = $state(false);
  let editFormError = $state('');

  function enterEditMode() {
    if (!styleData) return;
    editCityDistrict = styleData.cityDistrict;
    editMaterial = styleData.material;
    editFont = styleData.font;
    editNumberingRules = styleData.numberingRules;
    editUnifiedReplacement = styleData.unifiedReplacement;
    editFormError = '';
    isEditing = true;
  }

  function cancelEdit() {
    isEditing = false;
    editFormError = '';
  }

  const updateMutation = createMutation({
    mutationFn: (input: HousenoStyleInput) => updateHousenoStyle(parseInt(id, 10), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houseno-style', id] });
      queryClient.invalidateQueries({ queryKey: ['houseno-styles'] });
      queryClient.invalidateQueries({ queryKey: ['houseno-style-materials'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      isEditing = false;
    },
  });

  function handleUpdateSubmit() {
    editFormError = '';
    if (!editCityDistrict.trim()) {
      editFormError = '城市/街区为必填项';
      return;
    }
    if (!editMaterial.trim()) {
      editFormError = '材质为必填项';
      return;
    }
    if (!editFont.trim()) {
      editFormError = '字体为必填项';
      return;
    }
    if (!editNumberingRules.trim()) {
      editFormError = '编号规则为必填项';
      return;
    }
    $updateMutation.mutate({
      cityDistrict: editCityDistrict.trim(),
      material: editMaterial.trim(),
      font: editFont.trim(),
      numberingRules: editNumberingRules.trim(),
      unifiedReplacement: editUnifiedReplacement,
    });
  }

  let showDeleteConfirm = $state(false);

  const deleteMutation = createMutation({
    mutationFn: () => deleteHousenoStyle(parseInt(id, 10)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houseno-styles'] });
      queryClient.invalidateQueries({ queryKey: ['houseno-style-materials'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      navigate('/');
    },
  });

  function handleDelete() {
    showDeleteConfirm = false;
    $deleteMutation.mutate();
  }

  function getErrorMsg(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const resp = (err as { response?: { data?: { error?: string } } }).response;
      if (resp?.data?.error) return resp.data.error;
    }
    return '操作失败，请稍后重试';
  }

  const styleData = $derived(($styleQuery.data as HousenoStyleDetail | undefined)?.style);
  const sameMaterialStyles = $derived(($styleQuery.data as HousenoStyleDetail | undefined)?.sameMaterialStyles ?? []);

  const visitRecordsQuery = createQuery({
    queryKey: ['visit-records', id],
    queryFn: () => fetchVisitRecords(parseInt(id, 10)),
    enabled: isValidId,
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
        styleId: parseInt(id, 10),
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
    <Alert color="red" role="alert" aria-live="assertive">无效的样式 ID</Alert>
  {:else if $styleQuery.isPending}
    <div class="flex justify-center py-12">
      <Spinner size="8" />
    </div>
  {:else if $styleQuery.isError}
    <Alert color="red" role="alert" aria-live="assertive">样式不存在或后端未启动</Alert>
  {:else if styleData}
    {@const style = styleData}

    {#if $addMutation.error || $removeMutation.error || $bindTagMutation.error || $unbindTagMutation.error || $updateMutation.error || $deleteMutation.error}
      <Alert color="red" role="alert" aria-live="assertive">
        {#if $addMutation.error}
          收藏失败：{getErrorMsg($addMutation.error)}
        {:else if $removeMutation.error}
          取消收藏失败：{getErrorMsg($removeMutation.error)}
        {:else if $bindTagMutation.error}
          绑定标签失败：{getErrorMsg($bindTagMutation.error)}
        {:else if $unbindTagMutation.error}
          解除标签绑定失败：{getErrorMsg($unbindTagMutation.error)}
        {:else if $updateMutation.error}
          更新失败：{getErrorMsg($updateMutation.error)}
        {:else if $deleteMutation.error}
          删除失败：{getErrorMsg($deleteMutation.error)}
        {/if}
      </Alert>
    {/if}

    {#if $updateMutation.isSuccess}
      <Alert color="green" role="status" aria-live="polite">样式更新成功</Alert>
    {/if}

    {@const displayTitle = isEditing ? (editCityDistrict.trim() || style.cityDistrict) : style.cityDistrict}
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-800">{displayTitle}</h2>
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
        {#if !isEditing}
          <Button
            size="sm"
            color="yellow"
            onclick={enterEditMode}
          >
            编辑
          </Button>
          <Button
            size="sm"
            color="red"
            onclick={() => showDeleteConfirm = true}
            disabled={$deleteMutation.isPending}
          >
            删除
          </Button>
        {/if}
      </div>
    </div>

    {#if isEditing}
      {#if editFormError}
        <Alert color="red" class="mb-4" role="alert" aria-live="assertive">{editFormError}</Alert>
      {/if}
      <Card class="max-w-none">
        <h3 class="mb-4 text-base font-semibold text-gray-800">编辑样式</h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="editCityDistrict" class="mb-1 block text-sm font-medium text-gray-700">城市/街区 *</label>
            <input
              id="editCityDistrict"
              type="text"
              bind:value={editCityDistrict}
              class="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500"
            />
          </div>
          <div>
            <label for="editMaterial" class="mb-1 block text-sm font-medium text-gray-700">材质 *</label>
            <input
              id="editMaterial"
              type="text"
              bind:value={editMaterial}
              class="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500"
            />
          </div>
          <div>
            <label for="editFont" class="mb-1 block text-sm font-medium text-gray-700">字体 *</label>
            <input
              id="editFont"
              type="text"
              bind:value={editFont}
              class="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500"
            />
          </div>
          <div>
            <label for="editUnifiedReplacement" class="mb-1 block text-sm font-medium text-gray-700">是否统一更换</label>
            <div class="flex items-center gap-2 pt-2.5">
              <input
                id="editUnifiedReplacement"
                type="checkbox"
                bind:checked={editUnifiedReplacement}
                class="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span class="text-sm text-gray-700">{editUnifiedReplacement ? '是' : '否'}</span>
            </div>
          </div>
          <div class="sm:col-span-2">
            <label for="editNumberingRules" class="mb-1 block text-sm font-medium text-gray-700">编号规则 *</label>
            <textarea
              id="editNumberingRules"
              bind:value={editNumberingRules}
              rows="3"
              class="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-amber-500 focus:ring-amber-500"
            ></textarea>
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <Button size="sm" color="alternative" onclick={cancelEdit} disabled={$updateMutation.isPending}>
            取消
          </Button>
          <Button
            size="sm"
            color="yellow"
            onclick={handleUpdateSubmit}
            disabled={$updateMutation.isPending}
          >
            {#if $updateMutation.isPending}
              保存中...
            {:else}
              保存
            {/if}
          </Button>
        </div>
      </Card>
    {:else}
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
    {/if}

    <Modal
      bind:open={showDeleteConfirm}
      size="md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <h3 id="delete-modal-title" slot="header" class="text-lg font-semibold text-gray-800">
        确认删除
        <button
          type="button"
          aria-label="关闭删除确认弹窗"
          class="absolute end-3 top-3 rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
          onclick={() => showDeleteConfirm = false}
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </h3>
      <div class="text-center">
        <p class="mb-5 text-sm text-gray-500">
          确定要删除这个样式吗？删除后相关的收藏、探访记录和标签绑定也会被清除，此操作不可撤销。
        </p>
        <div class="flex justify-center gap-3">
          <Button color="alternative" onclick={() => showDeleteConfirm = false}>
            取消
          </Button>
          <Button color="red" onclick={handleDelete} disabled={$deleteMutation.isPending}>
            {#if $deleteMutation.isPending}
              删除中...
            {:else}
              确认删除
            {/if}
          </Button>
        </div>
      </div>
    </Modal>

    <div>
      <h3 class="mb-3 text-lg font-semibold text-gray-800">标签</h3>

      {#if $allTagsQuery.isPending || $styleTagsQuery.isPending}
        <div class="flex justify-center py-4">
          <Spinner size="6" />
        </div>
      {:else if $allTagsQuery.isError || $styleTagsQuery.isError}
        <Alert color="red" role="alert" aria-live="assertive">加载标签数据失败</Alert>
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
                  value={selectedTagId}
                  onchange={handleTagSelect}
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
        <Alert color="red" role="alert" aria-live="assertive">加载探访记录失败</Alert>
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
            <Alert color="green" class="mb-3" role="status" aria-live="polite">探访记录已添加</Alert>
          {/if}

          {#if formError}
            <Alert color="red" class="mb-3" role="alert" aria-live="assertive">{formError}</Alert>
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

    {#if sameMaterialStyles.length > 0}
      <div class="mt-8">
        <h3 class="mb-4 text-lg font-semibold text-gray-800">同材质样式</h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {#each sameMaterialStyles as rec (rec.id)}
            <Card class="cursor-pointer transition-shadow hover:shadow-md" onclick={() => navigate(`/styles/${rec.id}`)}>
              <dl class="space-y-2">
                <div>
                  <dt class="text-xs text-gray-500">城市/街区</dt>
                  <dd class="text-sm font-medium text-gray-800">{rec.cityDistrict}</dd>
                </div>
                <div>
                  <dt class="text-xs text-gray-500">字体</dt>
                  <dd class="text-sm"><Badge color="yellow">{rec.font}</Badge></dd>
                </div>
                <div>
                  <dt class="text-xs text-gray-500">是否统一更换</dt>
                  <dd class="text-sm">
                    {#if rec.unifiedReplacement}
                      <Badge color="green">是</Badge>
                    {:else}
                      <Badge color="dark">否</Badge>
                    {/if}
                  </dd>
                </div>
              </dl>
            </Card>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>
