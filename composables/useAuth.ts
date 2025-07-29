import type { User } from '~/types';

// Определяем тип для успешного ответа от /login
interface LoginResponse {
    token: string;
}

// Определяем тип для пользователя без хеша пароля
type PublicUser = Omit<User, 'passwordHash'>;

export const useAuth = () => {
    // Состояние, которое будет доступно глобально во всем приложении
    const user = useState<PublicUser | null>('user', () => null);
    const token = useCookie<string | null>('auth_token', { default: () => null });

    const isLoggedIn = computed(() => !!user.value);
    const isAdmin = computed(() => isLoggedIn && user.value?.role === 'admin');

    // Функция для входа в систему
    const login = async (username: string, password: string) => {
        const data = await $fetch<LoginResponse>('/api/v1/auth/login', {
            method: 'POST',
            body: { username, password }
        });

        if (data.token) {
            token.value = data.token;
            await fetchUser();
        }
    };

    // Функция для получения данных пользователя по токену
    const fetchUser = async () => {
        if (!token.value) return;

        try {
            // Теперь TypeScript знает, что `userData` будет иметь тип `PublicUser`
            const userData = await $fetch<PublicUser>('/api/v1/auth/me', {
                headers: {
                    // Используем computed, чтобы заголовок был реактивным
                    'Authorization': `Bearer ${token.value}`
                }
            });
            user.value = userData;
        } catch (e) {
            // Если токен невалидный, очищаем состояние
            token.value = null;
            user.value = null;
        }
    };

    // Функция для выхода
    const logout = () => {
        token.value = null;
        user.value = null;
        // Редирект на главную для лучшего UX
        navigateTo('/');
    };

    // Этот watch будет следить за состоянием токена. Если он появляется (например, после логина),
    // но данных о пользователе еще нет, он их запросит.
    watch(token, (newTokenValue) => {
        if (newTokenValue && !user.value) {
            fetchUser();
        }
    }, { immediate: true }); // immediate: true заставляет его сработать при первой загрузке

    return {
        user,
        token,
        isLoggedIn,
        isAdmin,
        login,
        fetchUser,
        logout
    };
}