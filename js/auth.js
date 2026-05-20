// js/api/auth.js
const API_URL = 'http://localhost:3000/api';
const TOKEN_KEY = 'myzon_auth_token';
const USER_KEY = 'myzon_user_data';

class AuthService {
    static setSession(token, userData) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }

    static getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    static getUser() {
        const userData = localStorage.getItem(USER_KEY);
        return userData ? JSON.parse(userData) : null;
    }

    static isAuthenticated() {
        return !!this.getToken();
    }

    static clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    static async login(email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data.success) {
                this.setSession(data.data.token, data.data.user);
                return { success: true, data: data.data };
            }
            return { success: false, error: data.message || 'Ошибка входа' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Ошибка соединения с сервером' };
        }
    }

    static async register(userData) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: userData.username,
                    email: userData.email,
                    password: userData.password,
                    confirmPassword: userData.confirmPassword,
                    role: userData.role || 'listener'
                })
            });
            const data = await response.json();
            if (data.success) {
                return { success: true, data: data.data };
            }
            return { success: false, error: data.message || 'Ошибка регистрации' };
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: 'Ошибка соединения с сервером' };
        }
    }

    static async logout() {
        try {
            const token = this.getToken();
            if (token) {
                // Опционально: вызвать API для инвалидации токена
            }
        } catch (error) {
            console.error('Ошибка при выходе:', error);
        } finally {
            this.clearSession();
        }
    }

    // Для совместимости со старым кодом (main.js вызывает этот метод)
    static initAdmin() {
        // console.log('Backend mode: admin initialization not required');
    }

    // Для админки: получить всех пользователей
    static async getAllUsers() {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    }

    // Для админки: изменить роль пользователя
    static async changeUserRole(userId, newRole) {
        const token = this.getToken();
        const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
        });
        return response.json();
    }
}