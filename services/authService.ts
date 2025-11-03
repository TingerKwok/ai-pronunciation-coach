import { User } from '../App';

const CURRENT_USER_KEY = 'pronunciation_coach_user';
const ACTIVATED_USERS_KEY = 'pronunciation_coach_activated_users';

// --- Mock Data ---
// In a real app, this would be a database.
const MOCK_USERS: { [identifier: string]: string } = {
  'user@example.com': 'password123',
  'test@test.com': 'test',
};

// Activation codes would be single-use and managed server-side.
const MOCK_ACTIVATION_CODES = ['PRO123', 'COACH456', 'SPEAK789'];

// --- Helper Functions ---
const getActivatedUsers = (): string[] => {
  const data = localStorage.getItem(ACTIVATED_USERS_KEY);
  return data ? JSON.parse(data) : [];
};

const setActivatedUsers = (users: string[]) => {
  localStorage.setItem(ACTIVATED_USERS_KEY, JSON.stringify(users));
};

// --- Exported Functions ---

/**
 * Simulates a user login.
 * In a real app, this would make an API call to a server.
 */
export const login = async (identifier: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (MOCK_USERS[identifier] && MOCK_USERS[identifier] === password) {
        const user: User = { identifier };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        resolve(user);
      } else {
        reject(new Error('邮箱或密码不正确。'));
      }
    }, 500); // Simulate network delay
  });
};

/**
 * Logs the current user out.
 */
export const logout = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

/**
 * Gets the currently logged-in user from session storage.
 */
export const getCurrentUser = (): User | null => {
  const userData = localStorage.getItem(CURRENT_USER_KEY);
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (e) {
      console.error('Error parsing user data from localStorage', e);
      return null;
    }
  }
  return null;
};

/**
 * Checks if a user has activated their account.
 */
export const isUserActivated = (identifier: string): boolean => {
  const activatedUsers = getActivatedUsers();
  return activatedUsers.includes(identifier);
};

/**
 * Verifies an activation code and activates the user if the code is valid.
 */
export const verifyActivationCode = async (identifier: string, code: string): Promise<boolean> => {
   return new Promise((resolve) => {
    setTimeout(() => {
        // In a real app, you'd make an API call to your server to validate this.
        // The server would check if the code is valid and not already used.
        if (MOCK_ACTIVATION_CODES.includes(code)) {
            const activatedUsers = getActivatedUsers();
            if (!activatedUsers.includes(identifier)) {
                activatedUsers.push(identifier);
                setActivatedUsers(activatedUsers);
            }
            // For this mock, we don't "use up" the code, but a real app would.
            resolve(true);
        } else {
            resolve(false);
        }
    }, 500); // Simulate network delay
   });
};
