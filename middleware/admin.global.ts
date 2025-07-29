export default defineNuxtRouteMiddleware((to, from) => {
    // Проверяем все роуты, начинающиеся с /admin/
    if (to.path.startsWith('/admin')) {
        const { user, isLoggedIn } = useAuth();

        // Сначала проверяем, залогинен ли пользователь вообще
        if (!isLoggedIn.value) {
            return navigateTo(`/account/login?redirectTo=${to.fullPath}`);
        }

        // Затем проверяем, является ли он админом
        if (user.value?.role !== 'admin') {
            // Если не админ, показываем ошибку "Доступ запрещен"
            return abortNavigation(
                createError({ statusCode: 403, statusMessage: 'Доступ запрещен' })
            );
        }
    }
});