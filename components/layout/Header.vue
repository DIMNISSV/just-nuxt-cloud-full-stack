<template>
    <header class="bg-gray-800 text-white shadow-md sticky top-0 z-50">
        <nav class="container mx-auto flex items-center justify-between p-4 flex-wrap">
            <div class="flex items-center gap-6 flex-wrap">
                <NuxtLink to="/drive">
                    <NuxtImg src="/logo.webp" class="h-8 w-auto"></NuxtImg>
                </NuxtLink>
                <NuxtLink to="/drive" class="text-sm hover:text-blue-300">Мой Диск</NuxtLink>
            </div>

            <div v-if="user?.role === 'ADMIN'"
                class="flex items-center gap-4 text-sm font-semibold text-yellow-300 flex-wrap">
                <NuxtLink to="/admin/users" class="hover:text-yellow-100">Пользователи</NuxtLink>
            </div>

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
</template>

<script setup lang="ts">
const { user, isLoggedIn } = useAuth();
</script>