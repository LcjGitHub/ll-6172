<script lang="ts">
  import { onMount } from 'svelte';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import RouterLink from './components/RouterLink.svelte';
  import StyleList from './pages/StyleList.svelte';
  import StyleDetail from './pages/StyleDetail.svelte';
  import FavoriteList from './pages/FavoriteList.svelte';
  import MaterialList from './pages/MaterialList.svelte';
  import MaterialDetail from './pages/MaterialDetail.svelte';
  import { initRouter, parseStyleId, isStyleList, isFavorites, parseMaterialId, isMaterialList, isMaterialDetail, pathname } from './lib/router';

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  });

  onMount(initRouter);
</script>

<QueryClientProvider client={queryClient}>
  <div class="min-h-screen bg-gray-50">
    <header class="border-b border-gray-200 bg-white shadow-sm">
      <div class="mx-auto max-w-5xl px-4 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-gray-900">🏠 老式门牌号字体图鉴</h1>
            <p class="mt-1 text-sm text-gray-500">记录各地老门牌的材质、字体与编号规则</p>
          </div>
          <div class="flex items-center gap-2">
            <RouterLink
              to="/materials"
              class="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition {isMaterialList($pathname) || parseMaterialId($pathname) ? 'border-emerald-500 bg-emerald-200 text-emerald-900' : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}"
            >
              📚 材质百科
            </RouterLink>
            <RouterLink
              to="/favorites"
              class="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition {isFavorites($pathname) ? 'border-amber-500 bg-amber-200 text-amber-900' : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'}"
            >
              ⭐ 收藏夹
            </RouterLink>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-6">
      {#if parseStyleId($pathname)}
        {#key parseStyleId($pathname)}
          <StyleDetail id={parseStyleId($pathname)!} />
        {/key}
      {:else if parseMaterialId($pathname)}
        {#key parseMaterialId($pathname)}
          <MaterialDetail id={parseMaterialId($pathname)!} />
        {/key}
      {:else if isMaterialDetail($pathname)}
        <MaterialDetail id={$pathname.replace(/^\/materials\//, '')} />
      {:else if isFavorites($pathname)}
        <FavoriteList />
      {:else if isMaterialList($pathname)}
        <MaterialList />
      {:else if isStyleList($pathname)}
        <StyleList />
      {:else}
        <StyleList />
      {/if}
    </main>
  </div>
</QueryClientProvider>
