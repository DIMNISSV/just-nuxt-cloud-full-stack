<template>
    <div class="max-w-md mx-auto mt-10">
        <div class="p-8 border rounded-lg bg-white shadow-md">
            <h1 class="text-2xl font-bold mb-6 text-center">Вход в систему</h1>
            <form @submit.prevent="handleLogin" class="space-y-6">
                <div>
                    <label for="username" class="block text-sm font-medium text-gray-700">Имя пользователя</label>
                    <input type="text" id="username" v-model="form.username" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">Пароль</label>
                    <input type="password" id="password" v-model="form.password" required
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>

                <div v-if="error" class="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                    {{ error }}
                </div>

                <div>
                    <button type="submit" :disabled="isLoading"
                        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                        {{ isLoading ? 'Вход...' : 'Войти' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import guest from '~/middleware/guest';

definePageMeta({
    middleware: guest
});

const form = reactive({
    username: '',
    password: '',
});
const isLoading = ref(false);
const error = ref<string | null>(null);

const { login } = useAuth();

async function handleLogin() {
    isLoading.value = true;
    error.value = null;
    try {
        await login(form.username, form.password);
        // Перенаправляем на запрашиваемую страницу или в профиль
        const redirectTo = useRoute().query.redirectTo as string || '/account/profile';
        await navigateTo(redirectTo);
    } catch (e: any) {
        error.value = e.data?.message || 'Произошла ошибка при входе.';
    } finally {
        isLoading.value = false;
    }
}
</script>