import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, UserRole, RegisterUserDto } from '../models/models';
import { INITIAL_DEMO_USERS } from '../data/campus-data';
import { ApiService } from './api.service';

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

export const GUEST_USER: User = {
  id: 'guest-passenger',
  email: 'guest@neust.edu.ph',
  fullName: 'Guest Passenger',
  role: 'student',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  phone: 'None',
  idNumber: 'GUEST',
  department: 'NEUST Sumacab Visitor',
  accountStatus: 'active',
  createdAt: ''
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USERS_DB_STORAGE_KEY = 'neust_bikego_users_database_v2';
  private readonly SESSION_STORAGE_KEY = 'neust_bikego_current_session_v2';

  // In-memory reactive user database & active user session
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$: Observable<User[]> = this.usersSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<User>(GUEST_USER);
  public currentUser$: Observable<User> = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  // Controls whether a non-authenticated user is exploring the app as a guest
  public isGuestBrowsing = false;

  // Controls the Auth (Login / Create Account) modal visibility and default mode
  private isAuthModalOpenSubject = new BehaviorSubject<boolean>(false);
  public isAuthModalOpen$ = this.isAuthModalOpenSubject.asObservable();

  public get isAuthModalOpen(): boolean {
    return this.isAuthModalOpenSubject.value;
  }
  public set isAuthModalOpen(val: boolean) {
    this.isAuthModalOpenSubject.next(val);
  }

  public authModalMode: 'signin' | 'register' = 'signin';

  constructor(private apiService: ApiService) {
    this.initUserDatabase();
    this.loadSessionFromStorage();
    this.syncUsersFromXampp();

    // Periodically pull newly registered accounts from XAMPP MySQL
    setInterval(() => {
      this.syncUsersFromXampp();
    }, 5000);
  }

  public syncUsersFromXampp(): void {
    this.apiService.getUsersFromXampp().subscribe(res => {
      if (!res.success || !Array.isArray(res.users) || res.users.length === 0) return;

      const current = [...this.usersSubject.value];
      let changed = false;

      for (const remote of res.users) {
        const idx = current.findIndex(
          u => u.id === remote.id || u.email.toLowerCase() === (remote.email || '').toLowerCase()
        );
        if (idx === -1) {
          current.push(remote);
          changed = true;
        } else if (
          current[idx].fullName !== remote.fullName ||
          current[idx].accountStatus !== remote.accountStatus ||
          current[idx].assignedBicycleNumber !== remote.assignedBicycleNumber
        ) {
          current[idx] = { ...current[idx], ...remote };
          changed = true;
        }
      }

      if (changed) {
        this.usersSubject.next(current);
        this.saveUsersDatabase(current);
      }
    });
  }

  public get currentUser(): User {
    return this.currentUserSubject.value;
  }

  public get role(): UserRole {
    return this.currentUser?.role || 'student';
  }

  public get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  public openAuthModal(mode: 'signin' | 'register' = 'signin'): void {
    this.authModalMode = mode;
    this.isAuthModalOpen = true;
  }

  public enterGuestMode(): void {
    this.isGuestBrowsing = true;
    this.currentUserSubject.next(GUEST_USER);
  }

  public exitGuestMode(): void {
    this.isGuestBrowsing = false;
  }

  /**
   * Initializes the persistent localStorage user database.
   * If first run, seeds with the official demo users (all with password: 'password123').
   */
  private initUserDatabase(): void {
    const raw = localStorage.getItem(this.USERS_DB_STORAGE_KEY);
    if (raw) {
      try {
        const parsed: User[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.usersSubject.next(parsed);
          return;
        }
      } catch (e) {
        console.warn('Failed parsing users database, reseeding demo users', e);
      }
    }

    // Seed initial users into database
    this.usersSubject.next([...INITIAL_DEMO_USERS]);
    this.saveUsersDatabase([...INITIAL_DEMO_USERS]);
  }

  private saveUsersDatabase(users: User[]): void {
    try {
      const mergedMap = new Map<string, User>();
      const rawExisting = localStorage.getItem(this.USERS_DB_STORAGE_KEY);
      if (rawExisting) {
        const parsedExisting: User[] = JSON.parse(rawExisting);
        if (Array.isArray(parsedExisting)) {
          for (const eu of parsedExisting) {
            if (eu && eu.id) mergedMap.set(eu.id, eu);
          }
        }
      }
      for (const u of users) {
        if (u && u.id) mergedMap.set(u.id, u);
      }
      const mergedList = Array.from(mergedMap.values());
      this.usersSubject.next(mergedList);
      localStorage.setItem(this.USERS_DB_STORAGE_KEY, JSON.stringify(mergedList));
    } catch (e) {
      this.usersSubject.next(users);
      console.error('Error saving users database to localStorage', e);
    }
  }

  private loadSessionFromStorage(): void {
    const raw =
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(this.SESSION_STORAGE_KEY) : null) ||
      localStorage.getItem(this.SESSION_STORAGE_KEY);
    if (raw) {
      try {
        const user: User = JSON.parse(raw);
        if (user && user.id) {
          const match = this.usersSubject.value.find(u => u.id === user.id) || user;
          if (!this.usersSubject.value.some(u => u.id === user.id)) {
            this.saveUsersDatabase([user, ...this.usersSubject.value]);
          }
          this.currentUserSubject.next(match);
          this.isAuthenticatedSubject.next(true);
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(match));
          }
          return;
        }
      } catch (e) {
        console.error('Error loading session from storage', e);
      }
    }

    // No active session found: User begins at Landing Page as guest
    this.currentUserSubject.next(GUEST_USER);
    this.isAuthenticatedSubject.next(false);
    this.isGuestBrowsing = false;
  }

  /**
   * Returns all registered users from the local database
   */
  public getAllUsers(): User[] {
    return this.usersSubject.value;
  }

  /**
   * Creates a new user account and saves it permanently to the database
   */
  public createAccount(dto: RegisterUserDto): AuthResponse {
    // 1. Validate required fields
    if (!dto.fullName || !dto.fullName.trim()) {
      return { success: false, message: 'Full name is required.' };
    }
    if (!dto.idNumber || !dto.idNumber.trim()) {
      return { success: false, message: 'Student ID or Employee ID Number is required.' };
    }
    if (!dto.email || !dto.email.trim()) {
      return { success: false, message: 'Valid university email is required.' };
    }
    if (!dto.password || dto.password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    const cleanEmail = dto.email.trim().toLowerCase();
    const cleanIdNumber = dto.idNumber.trim().toUpperCase();
    const currentUsers = this.usersSubject.value;

    // 2. Check for duplicate email
    const duplicateEmail = currentUsers.some(u => u.email.toLowerCase() === cleanEmail);
    if (duplicateEmail) {
      return { success: false, message: `The email "${dto.email}" is already registered. Please sign in instead.` };
    }

    // 3. Check for duplicate ID Number
    const duplicateId = currentUsers.some(u => u.idNumber.toUpperCase() === cleanIdNumber);
    if (duplicateId) {
      return { success: false, message: `ID Number "${dto.idNumber}" is already registered to another account.` };
    }

    // 4. Default avatar generator
    const defaultAvatar = dto.avatarUrl || (
      dto.role === 'driver'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        : dto.role === 'admin'
        ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
    );

    // 5. Build user record
    const newUser: User = {
      id: `${dto.role}-${Date.now()}`,
      fullName: dto.fullName.trim(),
      email: cleanEmail,
      idNumber: cleanIdNumber,
      phone: dto.phone ? dto.phone.trim() : '0917-000-0000',
      department: dto.department || 'College of Information & Communications Technology (CICT)',
      role: dto.role || 'student',
      avatarUrl: defaultAvatar,
      assignedBicycleNumber: dto.role === 'driver'
        ? (dto.assignedBicycleNumber?.trim().toUpperCase() || `PEDICAB-${Date.now().toString().slice(-3)}`)
        : dto.assignedBicycleNumber,
      accountStatus: 'active',
      password: dto.password,
      createdAt: new Date().toISOString()
    };

    // 6. Save to local database
    const updatedUsers = [newUser, ...currentUsers];
    this.saveUsersDatabase(updatedUsers);

    // 7. Sync asynchronously with XAMPP MySQL backend if active
    this.apiService.registerToXampp(dto).subscribe({
      next: (res) => {
        if (res && res.success) {
          console.log('User successfully synced with XAMPP MySQL database.');
        }
      },
      error: () => {}
    });

    // 8. Auto-login new user
    this.setSession(newUser);
    this.isAuthModalOpen = false;

    return {
      success: true,
      message: `Account created successfully! Welcome to NEUST BikeGo, ${newUser.fullName}.`,
      user: newUser
    };
  }

  /**
   * Logs in a user using either Email or Student ID Number along with password
   */
  public login(identifier: string, password: string): AuthResponse {
    if (!identifier || !identifier.trim()) {
      return { success: false, message: 'Please enter your Student ID Number or Email.' };
    }
    if (!password) {
      return { success: false, message: 'Please enter your password.' };
    }

    const clean = identifier.trim().toLowerCase();
    const user = this.usersSubject.value.find(
      u => u.email.toLowerCase() === clean || u.idNumber.toLowerCase() === clean
    );

    if (!user) {
      return { success: false, message: 'Account not found with this Student ID or Email.' };
    }

    if (user.password && user.password !== password) {
      return { success: false, message: 'Incorrect password. (For demo accounts, use: password123)' };
    }

    if (user.accountStatus === 'suspended') {
      return { success: false, message: 'This account has been suspended by campus administration.' };
    }

    this.setSession(user);
    this.isAuthModalOpen = false;

    return {
      success: true,
      message: `Welcome back, ${user.fullName}!`,
      user
    };
  }

  /**
   * Sets the active user session and persists to localStorage
   */
  public setSession(user: User): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    this.isGuestBrowsing = false;
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(user));
      }
      localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Error saving session', e);
    }
  }

  /**
   * Quick demo switcher for teachers, evaluators, and testing
   */
  public loginAsDemo(role: UserRole): User {
    const candidates = this.usersSubject.value.filter(u => u.role === role);
    const chosen = candidates[0] || INITIAL_DEMO_USERS.find(u => u.role === role)!;
    this.setSession(chosen);
    this.isAuthModalOpen = false;
    return chosen;
  }

  public switchDemoUser(role: UserRole, index = 0): void {
    const candidates = this.usersSubject.value.filter(u => u.role === role);
    const chosen = candidates[index] || candidates[0];
    if (chosen) {
      this.setSession(chosen);
    }
  }

  public switchRole(role: UserRole): void {
    const candidates = this.usersSubject.value.filter(u => u.role === role);
    const chosen = candidates[0] || INITIAL_DEMO_USERS.find(u => u.role === role);
    if (chosen) {
      this.setSession(chosen);
    } else if (this.currentUser) {
      const updated = { ...this.currentUser, role };
      this.setSession(updated);
    }
  }

  public updateProfile(partial: Partial<User>): void {
    const user = this.currentUser;
    if (!user) return;

    const updatedUser = { ...user, ...partial };
    this.currentUserSubject.next(updatedUser);

    // Update in database
    const users = this.usersSubject.value.map(u => (u.id === user.id ? updatedUser : u));
    this.saveUsersDatabase(users);

    // Update in session
    try {
      localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
    } catch (e) {}
  }

  public updateUserById(userId: string, partial: Partial<User>): void {
    const users = this.usersSubject.value.map(u => (u.id === userId ? { ...u, ...partial } : u));
    this.saveUsersDatabase(users);

    if (this.currentUser?.id === userId) {
      const updated = { ...this.currentUser, ...partial };
      this.currentUserSubject.next(updated);
      try {
        localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
    }
  }

  /**
   * Checks if an account already exists for the given email
   */
  public findUserByEmail(email: string): User | undefined {
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    return this.usersSubject.value.find(u => u.email.toLowerCase() === clean);
  }

  /**
   * Completes registration for a verified Google account with role-specific fields:
   * - Student: student number, college/department, contact number
   * - Driver: driver full name, bike/pedicab number, contact number
   */
  public registerGoogleUser(data: {
    fullName: string;
    email: string;
    role: UserRole;
    idNumber: string;
    department?: string;
    phone?: string;
    assignedBicycleNumber?: string;
    avatarUrl?: string;
  }): AuthResponse {
    const cleanEmail = data.email.trim().toLowerCase();
    const currentUsers = this.usersSubject.value;

    const existingIndex = currentUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);

    const defaultAvatar = data.avatarUrl || (
      data.role === 'driver'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    );

    const newUser: User = {
      id: existingIndex >= 0 ? currentUsers[existingIndex].id : `google-${Date.now()}`,
      fullName: data.fullName.trim(),
      email: cleanEmail,
      idNumber: data.idNumber.trim().toUpperCase(),
      role: data.role,
      phone: data.phone?.trim() || '0917-000-0000',
      department: data.department || (data.role === 'driver' ? 'NEUST Fleet & Campus Safety Transport' : 'College of Information & Communications Technology (CICT)'),
      assignedBicycleNumber: data.assignedBicycleNumber || (data.role === 'driver' ? 'BIKE-003' : undefined),
      avatarUrl: defaultAvatar,
      accountStatus: 'active',
      createdAt: existingIndex >= 0 ? currentUsers[existingIndex].createdAt : new Date().toISOString()
    };

    let updatedUsers: User[];
    if (existingIndex >= 0) {
      updatedUsers = [...currentUsers];
      updatedUsers[existingIndex] = newUser;
    } else {
      updatedUsers = [newUser, ...currentUsers];
    }

    this.saveUsersDatabase(updatedUsers);
    this.setSession(newUser);
    this.isAuthModalOpen = false;

    return {
      success: true,
      message: `Welcome to NEUST BikeGo, ${newUser.fullName}!`,
      user: newUser
    };
  }

  /**
   * Google Sign-In Integration:
   * Connects with Google account (e.g. institutional NEUST email or personal Google).
   * Automatically syncs name, email, avatar, and assigns a student or driver role.
   */
  public loginWithGoogle(customEmail?: string, role: UserRole = 'student'): AuthResponse {
    const email = (customEmail || 'maria.santos@neust.edu.ph').trim().toLowerCase();
    const currentUsers = this.usersSubject.value;

    // Check if user already exists
    const existing = currentUsers.find(u => u.email.toLowerCase() === email);

    if (existing) {
      this.setSession(existing);
      this.isAuthModalOpen = false;
      return {
        success: true,
        message: `Welcome back via Google, ${existing.fullName}!`,
        user: existing
      };
    }

    // If new user, extract name from email or default
    const namePart = email.split('@')[0].replace('.', ' ');
    const formattedName = namePart
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Google User';

    const randomId = '2026-' + Math.floor(10000 + Math.random() * 90000);

    const newUser: User = {
      id: `google-${Date.now()}`,
      fullName: formattedName,
      email: email,
      idNumber: randomId,
      phone: '0917-Google-Auth',
      department: 'College of Information & Communications Technology (CICT)',
      role: role,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      accountStatus: 'active',
      createdAt: new Date().toISOString()
    };

    const updated = [newUser, ...currentUsers];
    this.saveUsersDatabase(updated);
    this.setSession(newUser);
    this.isAuthModalOpen = false;

    return {
      success: true,
      message: `Google Account connected successfully! Welcome to NEUST BikeGo, ${newUser.fullName}.`,
      user: newUser
    };
  }

  public logout(): void {
    this.isAuthenticatedSubject.next(false);
    this.isGuestBrowsing = false;
    this.currentUserSubject.next(GUEST_USER);
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(this.SESSION_STORAGE_KEY);
      }
      localStorage.removeItem(this.SESSION_STORAGE_KEY);
    } catch (e) {}
    this.isAuthModalOpen = false;
  }
}

