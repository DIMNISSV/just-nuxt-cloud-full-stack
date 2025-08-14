import type { User } from '~/types';


interface LoginResponse {
    token: string;
}


type PublicUser = Omit<User, 'passwordHash'>;

export const useAuth = () => {

    const user = useState<PublicUser | null>('user', () => null);
    const token = useCookie<string | null>('auth_token', { default: () => null });

    const isLoggedIn = computed(() => !!user.value);
    const isAdmin = computed(() => isLoggedIn && user.value?.role === 'ADMIN');


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


    const fetchUser = async () => {
        if (!token.value) return;

        try {

            const userData = await $fetch<PublicUser>('/api/v1/auth/me', {
                headers: {

                    'Authorization': `Bearer ${token.value}`
                }
            });
            user.value = userData;
        } catch (e) {

            token.value = null;
            user.value = null;
        }
    };


    const logout = () => {
        token.value = null;
        user.value = null;

        navigateTo('/');
    };



    watch(token, (newTokenValue) => {
        if (newTokenValue && !user.value) {
            fetchUser();
        }
    }, { immediate: true });

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