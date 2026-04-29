export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'In Progress' | 'Converted' | 'Lost';

export const LEAD_STATUSES: LeadStatus[] = [
    'New',
    'Contacted',
    'Qualified',
    'In Progress',
    'Converted',
    'Lost',
];

export function getStatusColor(status: string): string {
    switch (status) {
        case 'New':
            return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
        case 'Contacted':
            return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
        case 'Qualified':
            return 'bg-green-100 text-green-800 hover:bg-green-100';
        case 'In Progress':
            return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
        case 'Converted':
            return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
        case 'Lost':
            return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
        default:
            return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
}

export function getStatusIcon(status: string): string {
    switch (status) {
        case 'New':
            return '🆕';
        case 'Contacted':
            return '📞';
        case 'Qualified':
            return '✅';
        case 'In Progress':
            return '🔄';
        case 'Converted':
            return '🎉';
        case 'Lost':
            return '❌';
        default:
            return '•';
    }
}
