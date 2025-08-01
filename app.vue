<template>
  <UApp>
    <div class="bg-gray-100 min-h-screen flex flex-col">
      <header class="bg-gray-800 text-white shadow-md sticky top-0 z-40">
        <nav class="container mx-auto flex items-center justify-between p-4 flex-wrap">
          <!-- Левая часть: Лого и основные разделы -->
          <div class="flex items-center gap-6">
            <!-- ★ ИЗМЕНЕНИЕ: Обновляем брендинг -->
            <NuxtLink to="/" class="text-xl font-bold">jCloud</NuxtLink>
            <NuxtLink to="/series" class="text-sm hover:text-blue-300">Медиатека</NuxtLink>
          </div>

          <!-- Центральная часть: Разделы админки (только для админов) -->
          <div v-if="user?.role === 'ADMIN'" class="flex items-center gap-4 text-sm font-semibold text-yellow-300">
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
const { user, isLoggedIn } = useAuth();
</script>