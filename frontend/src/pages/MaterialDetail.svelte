<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import RouterLink from '../components/RouterLink.svelte';
  import { Spinner, Alert, Card } from 'flowbite-svelte';
  import { fetchMaterial } from '../lib/api';
  import type { Material } from '../lib/types';

  interface Props {
    id: string;
  }

  let { id }: Props = $props();

  const isValidId = $derived(/^\d+$/.test(id));

  const materialQuery = createQuery({
    queryKey: ['material', id],
    queryFn: () => fetchMaterial(parseInt(id, 10)),
    enabled: isValidId,
  });

  const materialData = $derived($materialQuery.data as Material | undefined);
</script>

<div class="space-y-6">
  <RouterLink
    to="/materials"
    class="inline-flex items-center text-sm text-emerald-700 hover:underline"
  >
    ← 返回材质列表
  </RouterLink>

  {#if !isValidId}
    <Alert color="red">无效的材质 ID</Alert>
  {:else if $materialQuery.isPending}
    <div class="flex justify-center py-12">
      <Spinner size="8" />
    </div>
  {:else if $materialQuery.isError}
    <Alert color="red">未找到该材质</Alert>
  {:else if materialData}
    {@const material = materialData}

    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-800">{material.name}</h2>
    </div>

    <Card class="max-w-none">
      <dl class="space-y-6">
        <div>
          <dt class="text-sm text-gray-500">常见用途</dt>
          <dd class="mt-1 whitespace-pre-wrap text-gray-700">{material.commonUses}</dd>
        </div>
        <div>
          <dt class="text-sm text-gray-500">保养要点</dt>
          <dd class="mt-1 whitespace-pre-wrap text-gray-700">{material.careTips}</dd>
        </div>
      </dl>
    </Card>
  {/if}
</div>
