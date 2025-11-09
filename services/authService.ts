// Fix: Import User from types.ts instead of App.tsx
import { User } from '../types';

const CURRENT_USER_KEY = 'pronunciation_coach_user';
const ACTIVATED_USERS_KEY = 'pronunciation_coach_activated_users';
const ALL_USERS_KEY = 'pronunciation_coach_all_users';
const ACTIVATION_CODES_KEY = 'pronunciation_coach_codes';

// --- User and Code Storage Management (using localStorage) ---
// In a real app, this logic would be on a secure server.

type UserStore = {
  [identifier: string]: { password: string };
};

type ActivatedUserStore = {
  [identifier: string]: { expiryTimestamp: number };
};

export type UsedCodeInfo = {
  userIdentifier: string;
  activationTimestamp: number;
};

// The concept of 'available' codes is removed. We only track used codes.
export type ActivationCodeStore = {
  used: { [code: string]: UsedCodeInfo };
};


const getUsers = (): UserStore => {
  try {
    const data = localStorage.getItem(ALL_USERS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const setUsers = (users: UserStore) => {
  localStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));
};

const getActivatedUsers = (): ActivatedUserStore => {
  try {
    const data = localStorage.getItem(ACTIVATED_USERS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const setActivatedUsers = (users: ActivatedUserStore) => {
  localStorage.setItem(ACTIVATED_USERS_KEY, JSON.stringify(users));
};

const getActivationCodes = (): ActivationCodeStore => {
    try {
        const data = localStorage.getItem(ACTIVATION_CODES_KEY);
        // If no codes exist, initialize with an empty store.
        if (!data) {
            const initialCodes: ActivationCodeStore = {
                used: {},
            };
            localStorage.setItem(ACTIVATION_CODES_KEY, JSON.stringify(initialCodes));
            return initialCodes;
        }
        // Ensure the loaded data has the 'used' property.
        const parsedData = JSON.parse(data);
        return parsedData.used ? parsedData : { used: {} };
    } catch {
        // Fallback with a clean slate if parsing fails.
        return { used: {} };
    }
}

const setActivationCodes = (codes: ActivationCodeStore) => {
    localStorage.setItem(ACTIVATION_CODES_KEY, JSON.stringify(codes));
}

// --- Exported Functions ---

/**
 * Returns all activation codes. Now only returns used codes.
 * (Admin function)
 */
export const getAllActivationCodes = (): ActivationCodeStore => {
    return getActivationCodes();
}

/**
 * Registers a new user.
 */
export const register = async (identifier: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const users = getUsers();
            if (users[identifier]) {
                reject(new Error('该手机号已被注册。'));
                return;
            }
            users[identifier] = { password };
            setUsers(users);

            const user: User = { identifier };
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            resolve(user);
        }, 500);
    });
};


/**
 * Logs in a user.
 */
export const login = async (identifier: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getUsers();
      if (users[identifier] && users[identifier].password === password) {
        const user: User = { identifier };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        resolve(user);
      } else {
        reject(new Error('手机号或密码不正确。'));
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
 * Checks if a user has activated their account and their subscription is not expired.
 */
export const isUserActivated = (identifier: string): boolean => {
  const activatedUsers = getActivatedUsers();
  const userData = activatedUsers[identifier];
  if (!userData) {
    return false;
  }
  
  const now = new Date().getTime();
  return userData.expiryTimestamp > now;
};

/**
 * Verifies an activation code based on its format (length) and whether it has been used before.
 * 3-digit codes give 1 month access.
 * 4-digit codes give 1 year access.
 * Codes can only be used once.
 */
export const verifyActivationCode = async (identifier: string, code: string): Promise<boolean> => {
   return new Promise((resolve) => {
    setTimeout(() => {
        // Validate format first
        if (!/^\d{3,4}$/.test(code)) {
            resolve(false);
            return;
        }

        const codes = getActivationCodes();
        
        // Code must NOT be in the used list.
        if (codes.used[code]) {
            resolve(false);
            return;
        }

        const activatedUsers = getActivatedUsers();
        const activationTime = new Date();
        let expiryDate: Date;

        if (code.length === 3) { // 1-month subscription
            expiryDate = new Date(activationTime);
            expiryDate.setMonth(activationTime.getMonth() + 1);
        } else { // 1-year subscription (4-digit)
            expiryDate = new Date(activationTime);
            expiryDate.setFullYear(activationTime.getFullYear() + 1);
        }

        // Activate user and set expiry date
        activatedUsers[identifier] = { expiryTimestamp: expiryDate.getTime() };
        setActivatedUsers(activatedUsers);

        // Add code to the 'used' list and record user info
        codes.used[code] = {
            userIdentifier: identifier,
            activationTimestamp: activationTime.getTime(),
        };
        setActivationCodes(codes);
        
        resolve(true);
    }, 500); // Simulate network delay
   });
};