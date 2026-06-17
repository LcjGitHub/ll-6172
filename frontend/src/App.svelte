<script lang="ts">
  import { onMount } from 'svelte';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import RouterLink from './components/RouterLink.svelte';
  import StyleList from './pages/StyleList.svelte';
  import StyleDetail from './pages/StyleDetail.svelte';
  import FavoriteList from './pages/FavoriteList.svelte';
  import { initRouter, parseStyleId, isStyleList, isFavorites, pathname } from './lib/router';

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
          <RouterLink
            to="/favorites"
            class="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
          >
            ⭐ 收藏夹
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-6">
      {#if parseStyleId($pathname)}
        {#key parseStyleId($pathname)}
          <StyleDetail id={parseStyleId($pathname)!} />
        {/key}
      {:else if isFavorites($pathname)}
        <FavoriteList />
      {:else if isStyleList($pathname)}
        <StyleList />
      {:else}
        <StyleList />
      {/if}
    </main>
  </div>
</QueryClientProvider>
