// import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const API_BASE_URL = 'http://localhost:5000';

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    source: string;
    status: 'New' | 'Contacted' | 'Qualified' | 'In Progress' | 'Converted' | 'Lost';
    notes: string;
    createdAt: string;
    updatedAt: string;
    followUpDate: string | null;
    assignedTo: string | null;
    userId: string;
    createdBy: string;
}

export interface Activity {
    id: string;
    leadId: string;
    userId: string;
    userEmail?: string;
    type: string;
    description: string;
    createdAt: string;
}

export interface Stats {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    inProgress: number;
    converted: number;
    lost: number;
    conversionRate: number;
}

class ApiClient {
    private accessToken: string | null = null;

    setAccessToken(token: string | null) {
        this.accessToken = token;
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }

    getAccessToken(): string | null {
        if (!this.accessToken) {
            this.accessToken = localStorage.getItem('access_token');
        }
        return this.accessToken;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const token = this.getAccessToken();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Auth endpoints
    async signup(email: string, password: string, name: string): Promise<{ user: User }> {
        return this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });
    }

    async signin(email: string, password: string): Promise<{ access_token: string; user: User }> {
        const result = await this.request<{ access_token: string; user: User }>('/auth/signin', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.setAccessToken(result.access_token);
        return result;
    }

    async getSession(): Promise<{ user: User }> {
        return this.request('/auth/session');
    }

    async getUsers(): Promise<{ users: User[] }> {
        return this.request('/auth/users');
    }

    logout() {
        this.setAccessToken(null);
    }

    // Leads endpoints
    async getLeads(): Promise<{ leads: Lead[] }> {
        return this.request('/leads');
    }

    async getLead(id: string): Promise<{ lead: Lead }> {
        return this.request(`/leads/${id}`);
    }

    async createLead(lead: Partial<Lead>): Promise<{ lead: Lead }> {
        return this.request('/leads', {
            method: 'POST',
            body: JSON.stringify(lead),
        });
    }

    async updateLead(id: string, updates: Partial<Lead>): Promise<{ lead: Lead }> {
        return this.request(`/leads/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async deleteLead(id: string): Promise<{ success: boolean }> {
        return this.request(`/leads/${id}`, {
            method: 'DELETE',
        });
    }

    async bulkDeleteLeads(leadIds: string[]): Promise<{ success: boolean; deleted: number }> {
        return this.request('/leads/bulk-delete', {
            method: 'POST',
            body: JSON.stringify({ leadIds }),
        });
    }

    async bulkUpdateStatus(
        leadIds: string[],
        status: Lead['status']
    ): Promise<{ success: boolean; updated: number }> {
        return this.request('/leads/bulk-update-status', {
            method: 'POST',
            body: JSON.stringify({ leadIds, status }),
        });
    }

    // Activities endpoints
    async getActivities(leadId: string): Promise<{ activities: Activity[] }> {
        return this.request(`/leads/${leadId}/activities`);
    }

    async addActivity(
        leadId: string,
        type: string,
        description: string
    ): Promise<{ activity: Activity }> {
        return this.request(`/leads/${leadId}/activities`, {
            method: 'POST',
            body: JSON.stringify({ type, description }),
        });
    }

    // Stats endpoint
    async getStats(): Promise<{ stats: Stats }> {
        return this.request('/leads/stats');
    }

    // API Keys
    async generateApiKey(): Promise<{ apiKey: string }> {
        return this.request('/apikeys/generate', {
            method: 'POST',
        });
    }

    async getApiKey(): Promise<{ apiKey: string | null }> {
        return this.request('/apikeys');
    }
}

export const api = new ApiClient();
