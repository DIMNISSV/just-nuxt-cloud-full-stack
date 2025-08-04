<template>
  <UApp :toaster="tc">
    <div class="bg-gray-100 min-h-screen min-w-[320px] flex flex-col">
      <header class="bg-gray-800 text-white shadow-md sticky top-0 z-40">
        <nav class="container mx-auto flex items-center justify-between p-4 flex-wrap">
          <!-- Левая часть: Лого и основные разделы -->
          <div class="flex items-center gap-6 flex-wrap">
            <NuxtLink to="/" class="text-xl font-bold">jcloud.me</NuxtLink>
            <NuxtLink to="/series" class="text-sm hover:text-blue-300">Медиатека</NuxtLink>
            <NuxtLink to="/drive" class="text-sm hover:text-blue-300">Диск</NuxtLink>
          </div>

          <!-- Центральная часть: Разделы админки (только для админов) -->
          <div v-if="user?.role === 'ADMIN'"
            class="flex items-center gap-4 text-sm font-semibold text-yellow-300 flex-wrap">
            <NuxtLink to="/admin/series" class="hover:text-yellow-100">Сериалы</NuxtLink>
            <NuxtLink to="/admin/translators" class="hover:text-yellow-100">Переводчики</NuxtLink>
            <NuxtLink to="/admin/users" class="hover:text-yellow-100">Пользователи</NuxtLink>
          </div>

          <!-- Правая часть: Меню пользователя или кнопки входа -->
          <div class="flex items-center gap-4 text-sm">
            <template v-if="isLoggedIn && user">
              <LayoutUserMenu />
            </template>
            <template v-else>
              <NuxtLink to="/account/login" class="hover:text-blue-300">Войти</NuxtLink>
              <NuxtLink to="/account/register" class="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded">Регистрация
              </NuxtLink>
            </template>
          </div>
        </nav>
      </header>

      <main class="container mx-auto p-4 md:p-6 flex-grow">
        <NuxtPage />
      </main>

      <LayoutFooter />
    </div>
  </UApp>
</template>

<script setup lang="ts">
import type { ToasterProps } from '@nuxt/ui';

const tc: ToasterProps = {
  position: 'top-left',
  duration: 5000,
  expand: true,
}

const toast = useToast()
toast.add({
  description: 'тестовый тост',
  title: 'Тестовый тост',
  duration: 10000000000
})

const { user, isLoggedIn } = useAuth();
</script>