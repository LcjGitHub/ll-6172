<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import RouterLink from '../components/RouterLink.svelte';
  import { Spinner, Alert, Card } from 'flowbite-svelte';
  import { fetchMaterials } from '../lib/api';

  const materialsQuery = createQuery({
    queryKey: ['materials'],
    queryFn: fetchMaterials,
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold text-gray-800">材质百科</h2>
  </div>

  {#if $materialsQuery.isPending}
    <div class="flex justify-center py-12">
      <Spinner size="8" />
    </div>
  {:else if $materialsQuery.isError}
    <Alert color="red">无法加载材质列表，请确认后端已启动（端口 4000）</Alert>
  {:else if ($materialsQuery.data ?? []).length === 0}
    <Alert color="yellow">暂无材质数据</Alert>
  {:else}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each $materialsQuery.data ?? [] as material (material.id)}
        <RouterLink
          to="/materials/{material.id}"
          class="block transition hover:opacity-90"
        >
          <Card class="h-full">
            <h3 class="text-lg font-semibold text-gray-800">{material.name}</h3>
            <div class="mt-2">
              <p class="text-sm text-gray-500">常见用途</p>
              <p class="mt-1 text-sm text-gray-700 line-clamp-2">{material.commonUses}</p>
            </div>
            <div class="mt-3">
              <p class="text-sm text-gray-500">保养要点</p>
              <p class="mt-1 text-sm text-gray-700 line-clamp-2">{material.careTips}</p>
            </div>
          </Card>
        </RouterLink>
      {/each}
    </div>
  {/if}
</div>
