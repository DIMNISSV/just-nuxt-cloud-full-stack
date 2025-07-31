<template>
    <div class="relative" ref="menuRef">
        <button @click="isOpen = !isOpen" class="flex items-center gap-2 hover:text-blue-300">
            <span>{{ user?.username }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clip-rule="evenodd" />
            </svg>
        </button>

        <div v-if="isOpen" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 text-gray-800">
            <NuxtLink to="/account/profile" class="block px-4 py-2 text-sm hover:bg-gray-100">Профиль</NuxtLink>
            <NuxtLink to="/account/storage" class="block px-4 py-2 text-sm hover:bg-gray-100">Моё хранилище</NuxtLink>
            <div class="border-t my-1"></div>
            <button @click="handleLogout"
                class="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                Выйти
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onClickOutside } from '@vueuse/core';

const { user, logout } = useAuth();
const isOpen = ref(false);
const menuRef = ref(null);

// Закрываем меню при клике вне его
onClickOutside(menuRef, () => isOpen.value = false);

const handleLogout = () => {
    isOpen.value = false;
    logout();
};
</script>