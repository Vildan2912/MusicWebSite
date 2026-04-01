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
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (email && password.length >= 6) {
                const mockData = {
                    token: 'mock_jwt_token_' + Date.now(),
                    user: {
                        id: 1,
                        email: email,
                        username: email.split('@')[0],
                        role: 'listener'
                    }
                };
                
                this.setSession(mockData.token, mockData.user);
                return { success: true, data: mockData };
            } else {
                throw new Error('Неверный email или пароль');
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async register(userData) {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (userData.password !== userData.confirmPassword) {
                throw new Error('Пароли не совпадают');
            }

            if (userData.password.length < 6) {
                throw new Error('Пароль должен быть не менее 6 символов');
            }

            const mockData = {
                message: 'Регистрация прошла успешно!',
                user: {
                    id: Date.now(),
                    email: userData.email,
                    username: userData.username
                }
            };

            return { success: true, data: mockData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async logout() {
        try {
            const token = this.getToken();
            if (token) {
                // await fetch(`${API_URL}/logout`, {
                //     method: 'POST',
                //     headers: { 'Authorization': `Bearer ${token}` }
                // });
            }
        } catch (error) {
            console.error('Ошибка при выходе:', error);
        } finally {
            this.clearSession();
        }
    }
}