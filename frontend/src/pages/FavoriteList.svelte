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
  } from 'flowbite-svelte';
  import { fetchFavorites, removeFavorite } from '../lib/api';

  const queryClient = useQueryClient();

  const favoritesQuery = createQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
  });

  const removeMutation = createMutation({
    mutationFn: (styleId: number) => removeFavorite(styleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  function getErrorMsg(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const resp = (err as { response?: { data?: { error?: string } } }).response;
      if (resp?.data?.error) return resp.data.error;
    }
    return '操作失败，请稍后重试';
  }

  function handleRemove(styleId: number) {
    $removeMutation.mutate(styleId);
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold text-gray-800">⭐ 我的收藏</h2>
  </div>

  {#if $favoritesQuery.isPending}
    <div class="flex justify-center py-12">
      <Spinner size="8" />
    </div>
  {:else if $favoritesQuery.isError}
    <Alert color="red">无法加载收藏列表，请确认后端已启动（端口 4000）</Alert>
  {:else if ($favoritesQuery.data ?? []).length === 0}
    <Alert color="yellow">暂无收藏记录，去样式列表添加收藏吧！</Alert>
  {:else}
    {#if $removeMutation.error}
      <Alert color="red">
        取消收藏失败：{getErrorMsg($removeMutation.error)}
      </Alert>
    {/if}

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <Table hoverable>
        <TableHead>
          <TableHeadCell>城市/街区</TableHeadCell>
          <TableHeadCell>材质</TableHeadCell>
          <TableHeadCell>字体</TableHeadCell>
          <TableHeadCell>编号规则</TableHeadCell>
          <TableHeadCell>统一更换</TableHeadCell>
          <TableHeadCell>收藏时间</TableHeadCell>
          <TableHeadCell>操作</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each $favoritesQuery.data ?? [] as fav (fav.id)}
            <TableBodyRow>
              <TableBodyCell>
                <RouterLink
                  to="/styles/{fav.style.id}"
                  class="font-medium text-amber-700 hover:underline"
                >
                  {fav.style.cityDistrict}
                </RouterLink>
              </TableBodyCell>
              <TableBodyCell class="text-gray-600">{fav.style.material}</TableBodyCell>
              <TableBodyCell>
                <Badge color="yellow">{fav.style.font}</Badge>
              </TableBodyCell>
              <TableBodyCell class="max-w-xs truncate text-gray-600">
                {fav.style.numberingRules}
              </TableBodyCell>
              <TableBodyCell>
                {#if fav.style.unifiedReplacement}
                  <Badge color="green">是</Badge>
                {:else}
                  <Badge color="dark">否</Badge>
                {/if}
              </TableBodyCell>
              <TableBodyCell class="whitespace-nowrap text-sm text-gray-500">
                {fav.createdAt.replace('T', ' ').slice(0, 19)}
              </TableBodyCell>
              <TableBodyCell>
                <Button
                  size="xs"
                  color="red"
                  onclick={() => handleRemove(fav.styleId)}
                  disabled={$removeMutation.isPending}
                >
                  取消收藏
                </Button>
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  {/if}
</div>
