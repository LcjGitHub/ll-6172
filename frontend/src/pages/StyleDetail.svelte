<script lang="ts">
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import RouterLink from '../components/RouterLink.svelte';
  import { Badge, Spinner, Alert, Card, Button } from 'flowbite-svelte';
  import { fetchHousenoStyle, fetchFavorites, addFavorite, removeFavorite } from '../lib/api';
  import type { HousenoStyle } from '../lib/types';

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

  const addMutation = createMutation({
    mutationFn: () => addFavorite(numericId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const removeMutation = createMutation({
    mutationFn: () => removeFavorite(numericId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const styleData = $derived($styleQuery.data as HousenoStyle | undefined);
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
  {/if}
</div>
