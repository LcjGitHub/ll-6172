<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
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
  import { fetchHousenoStyles } from '../lib/api';

  const stylesQuery = createQuery({
    queryKey: ['houseno-styles'],
    queryFn: fetchHousenoStyles,
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold text-gray-800">样式列表</h2>
  </div>

  {#if $stylesQuery.isPending}
    <div class="flex justify-center py-12">
      <Spinner size="8" />
    </div>
  {:else if $stylesQuery.isError}
    <Alert color="red">无法加载样式列表，请确认后端已启动（端口 4000）</Alert>
  {:else if ($stylesQuery.data ?? []).length === 0}
    <Alert color="yellow">暂无门牌号样式数据，请运行 npm run seed 初始化。</Alert>
  {:else}
    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <Table hoverable>
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
