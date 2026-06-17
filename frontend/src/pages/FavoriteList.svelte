<script lang="ts">
  import { createQuery, createMutation, createQueryClient } from '@tanstack/svelte-query';
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

  const queryClient = createQueryClient();

  const favoritesQuery = createQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
  });

  const removeMutation = createMutation(() => ({
    mutationFn: (styleId: number) => removeFavorite(styleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  }));

  function handleRemove(styleId: number) {
    removeMutation.mutate(styleId);
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
                  <Badge color="gray">否</Badge>
                {/if}
              </TableBodyCell>
              <TableBodyCell class="whitespace-nowrap text-sm text-gray-500">
                {fav.createdAt.replace('T', ' ').slice(0, 19)}
              </TableBodyCell>
              <TableBodyCell class="flex gap-2">
                <RouterLink to="/styles/{fav.style.id}">
                  <Button size="xs" color="light">详情</Button>
                </RouterLink>
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
