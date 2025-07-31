<template>
    <footer class="bg-gray-800 text-gray-400 mt-12">
        <div class="container mx-auto px-4 py-8">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <h3 class="font-bold text-white mb-2">Навигация</h3>
                    <ul class="space-y-1 text-sm">
                        <li>
                            <NuxtLink to="/" class="hover:text-white">Главная</NuxtLink>
                        </li>
                        <li>
                            <NuxtLink to="/series" class="hover:text-white">Сериалы</NuxtLink>
                        </li>
                    </ul>
                </div>
                <div>
                    <h3 class="font-bold text-white mb-2">Аккаунт</h3>
                    <ul class="space-y-1 text-sm">
                        <li>
                            <NuxtLink to="/account/profile" class="hover:text-white">Профиль</NuxtLink>
                        </li>
                        <li>
                            <NuxtLink to="/account/storage" class="hover:text-white">Моё хранилище</NuxtLink>
                        </li>
                    </ul>
                </div>
                <div>
                    <h3 class="font-bold text-white mb-2">Инструменты</h3>
                    <ul class="space-y-1 text-sm">
                        <li>
                            <NuxtLink to="/admin/series" class="hover:text-white">Управление</NuxtLink>
                        </li>
                    </ul>
                </div>
                <div>
                    <h3 class="font-bold text-white mb-2">Информация</h3>
                    <ul class="space-y-1 text-sm">
                        <li><a href="#" class="hover:text-white">О проекте</a></li>
                        <li><a href="#" class="hover:text-white">Правила</a></li>
                        <li><a href="#" class="hover:text-white">Контакты</a></li>
                    </ul>
                </div>
            </div>
            <div class="mt-8 border-t border-gray-700 pt-4 text-center text-xs">
                MediaServer Mockup © {{ new Date().getFullYear() }}
            </div>
        </div>
    </footer>
</template>