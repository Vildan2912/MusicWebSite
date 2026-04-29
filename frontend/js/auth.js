// js/api/auth.js
const API_URL = 'http://localhost:3000/api';
const TOKEN_KEY = 'myzon_auth_token';
const USER_KEY = 'myzon_user_data';
const USERS_KEY = 'myzon_users'; // Ключ для хранения всех зарегистрированных пользователей

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

    // Получить всех зарегистрированных пользователей
    static getUsers() {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : [];
    }

    // Сохранить пользователей
    static saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    // Найти пользователя по email
    static findUserByEmail(email) {
        const users = this.getUsers();
        return users.find(user => user.email.toLowerCase() === email.toLowerCase());
    }

    // Найти пользователя по email и паролю
    static findUserByCredentials(email, password) {
        const users = this.getUsers();
        return users.find(user => 
            user.email.toLowerCase() === email.toLowerCase() && 
            user.password === password
        );
    }

    static async login(email, password) {
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Небольшая задержка для имитации запроса
            
            // Проверяем, есть ли пользователь с такими данными
            const user = this.findUserByCredentials(email, password);
            
            if (user) {
                const mockToken = 'mock_jwt_token_' + Date.now() + '_' + user.id;
                const userData = {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role || 'listener',
                    isPremium: user.isPremium || false
                };
                
                this.setSession(mockToken, userData);
                return { success: true, data: { token: mockToken, user: userData } };
            } else {
                // Проверяем, существует ли email вообще
                const existingUser = this.findUserByEmail(email);
                if (existingUser) {
                    throw new Error('Неверный пароль');
                } else {
                    throw new Error('Пользователь с таким email не найден');
                }
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async register(userData) {
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Валидация
            if (!userData.username || !userData.email || !userData.password) {
                throw new Error('Пожалуйста, заполните все поля');
            }
            
            if (userData.password.length < 6) {
                throw new Error('Пароль должен быть не менее 6 символов');
            }
            
            if (userData.password !== userData.confirmPassword) {
                throw new Error('Пароли не совпадают');
            }
            
            // Проверяем, не зарегистрирован ли уже пользователь с таким email
            const existingUser = this.findUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('Пользователь с таким email уже зарегистрирован');
            }
            
            // Создаем нового пользователя
            const users = this.getUsers();
            const newUser = {
                id: Date.now(),
                username: userData.username.trim(),
                email: userData.email.toLowerCase().trim(),
                password: userData.password, // В реальном приложении нужно хешировать!
                role: 'listener',
                isPremium: false,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            this.saveUsers(users);
            
            return { 
                success: true, 
                data: { 
                    message: 'Регистрация прошла успешно! Теперь вы можете войти.',
                    user: {
                        id: newUser.id,
                        username: newUser.username,
                        email: newUser.email
                    }
                } 
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async logout() {
        try {
            const token = this.getToken();
            if (token) {
                // Здесь можно добавить реальный запрос к API при необходимости
            }
        } catch (error) {
            console.error('Ошибка при выходе:', error);
        } finally {
            this.clearSession();
        }
    }
}