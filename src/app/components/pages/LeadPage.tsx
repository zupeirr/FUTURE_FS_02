import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../Layout';
import { api, Lead, User } from '../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/cards';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Plus, Search, LayoutGrid, LayoutList, Kanban, Trash2, Edit, Eye, Download, Upload } from 'lucide-react';
import { cn } from '../ui/utils';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'In Progress', 'Converted', 'Lost'] as const;

const STATUS_COLORS = {
    New: 'bg-blue-100 text-blue-800 border-blue-200',
    Contacted: 'bg-purple-100 text-purple-800 border-purple-200',
    Qualified: 'bg-green-100 text-green-800 border-green-200',
    'In Progress': 'bg-orange-100 text-orange-800 border-orange-200',
    Converted: 'bg-green-200 text-green-900 border-green-300',
    Lost: 'bg-red-100 text-red-800 border-red-200',
};

type ViewMode = 'table' | 'card' | 'kanban';

export function LeadPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [userFilter, setUserFilter] = useState<string>('all');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    const [bulkAction, setBulkAction] = useState<'delete' | 'status' | null>(null);
    const [bulkStatus, setBulkStatus] = useState<Lead['status']>('New');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const navigate = useNavigate();

    useEffect(() => {
        loadLeads();
        loadUsers();
    }, []);

    useEffect(() => {
        filterLeads();
    }, [leads, searchQuery, statusFilter, userFilter]);

    async function loadUsers() {
        try {
            const { users } = await api.getUsers();
            setUsers(users);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    async function loadLeads() {
        try {
            const { leads } = await api.getLeads();
            setLeads(leads);
        } catch (error) {
            console.error('Failed to load leads:', error);
        } finally {
            setLoading(false);
        }
    }

    function filterLeads() {
        let filtered = leads;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (lead) =>
                    lead.name.toLowerCase().includes(query) ||
                    lead.email.toLowerCase().includes(query) ||
                    lead.company?.toLowerCase().includes(query)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter((lead) => lead.status === statusFilter);
        }

        if (userFilter !== 'all') {
            // handle both camelCase and snake_case depending on backend response
            filtered = filtered.filter((lead) => lead.assignedTo === userFilter || (lead as any).assigned_to === userFilter);
        }

        setFilteredLeads(filtered);
    }

    async function handleBulkAction() {
        if (selectedLeads.size === 0) return;

        try {
            const leadIds = Array.from(selectedLeads);

            if (bulkAction === 'delete') {
                await api.bulkDeleteLeads(leadIds);
            } else if (bulkAction === 'status') {
                await api.bulkUpdateStatus(leadIds, bulkStatus);
            }

            await loadLeads();
            setSelectedLeads(new Set());
            setShowBulkDialog(false);
            setBulkAction(null);
        } catch (error) {
            console.error('Bulk action failed:', error);
        }
    }

    function toggleSelectAll() {
        if (selectedLeads.size === filteredLeads.length) {
            setSelectedLeads(new Set());
        } else {
            setSelectedLeads(new Set(filteredLeads.map((l) => l.id)));
        }
    }

    function handleExportCSV() {
        if (leads.length === 0) return;
        const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Created At'];
        const rows = leads.map(lead => [
            `"${lead.name || ''}"`,
            `"${lead.email || ''}"`,
            `"${lead.phone || ''}"`,
            `"${lead.company || ''}"`,
            `"${lead.status || ''}"`,
            `"${lead.source || ''}"`,
            `"${new Date(lead.createdAt).toISOString()}"`
        ]);
        const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'leads_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            // skip header
            let imported = 0;
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                // Basic CSV parse (Name, Email, Phone, Company, Status, Source)
                const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
                if (cols.length >= 2) {
                    try {
                        await api.createLead({
                            name: cols[0] || 'Unknown',
                            email: cols[1],
                            phone: cols[2] || '',
                            company: cols[3] || '',
                            status: (cols[4] as any) || 'New',
                            source: cols[5] || 'import',
                            notes: ''
                        });
                        imported++;
                    } catch (err) {
                        console.error('Failed to import row', i, err);
                    }
                }
            }
            await loadLeads();
            if (fileInputRef.current) fileInputRef.current.value = '';
            alert(`Successfully imported ${imported} leads.`);
        };
        reader.readAsText(file);
    }

    function toggleSelect(id: string) {
        const newSelected = new Set(selectedLeads);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedLeads(newSelected);
    }

    return (
        <Layout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
                        <p className="text-gray-500 mt-1">Manage your leads and contacts</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleExportCSV}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <input
                            type="file"
                            accept=".csv"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleImportCSV}
                        />
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="h-4 w-4 mr-2" />
                            Import
                        </Button>
                        <Button onClick={() => setShowCreateDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Lead
                        </Button>
                    </div>
                </div>

                {/* Filters and View Controls */}
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search leads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full lg:w-48">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {LEAD_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={userFilter} onValueChange={setUserFilter}>
                        <SelectTrigger className="w-full lg:w-48">
                            <SelectValue placeholder="Filter by assigned user" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            {users.map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                    {u.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                        <Button
                            variant={viewMode === 'table' ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setViewMode('table')}
                        >
                            <LayoutList className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'card' ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setViewMode('card')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'kanban' ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setViewMode('kanban')}
                        >
                            <Kanban className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedLeads.size > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">
                            {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setBulkAction('status');
                                    setShowBulkDialog(true);
                                }}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Update Status
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setBulkAction('delete');
                                    setShowBulkDialog(true);
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-gray-500">Loading...</div>
                    </div>
                ) : viewMode === 'table' ? (
                    <TableView
                        leads={filteredLeads}
                        selectedLeads={selectedLeads}
                        onToggleSelect={toggleSelect}
                        onToggleSelectAll={toggleSelectAll}
                        onView={(id) => navigate(`/leads/${id}`)}
                    />
                ) : viewMode === 'card' ? (
                    <CardView leads={filteredLeads} onView={(id) => navigate(`/leads/${id}`)} />
                ) : (
                    <KanbanView leads={filteredLeads} onView={(id) => navigate(`/leads/${id}`)} onUpdate={loadLeads} />
                )}
            </div>

            <CreateLeadDialog
                open={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                onSuccess={() => {
                    setShowCreateDialog(false);
                    loadLeads();
                }}
            />

            <BulkActionDialog
                open={showBulkDialog}
                action={bulkAction}
                count={selectedLeads.size}
                status={bulkStatus}
                onStatusChange={setBulkStatus}
                onConfirm={handleBulkAction}
                onClose={() => {
                    setShowBulkDialog(false);
                    setBulkAction(null);
                }}
            />
        </Layout>
    );
}

function TableView({
    leads,
    selectedLeads,
    onToggleSelect,
    onToggleSelectAll,
    onView,
}: {
    leads: Lead[];
    selectedLeads: Set<string>;
    onToggleSelect: (id: string) => void;
    onToggleSelectAll: () => void;
    onView: (id: string) => void;
}) {
    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12">
                            <Checkbox
                                checked={leads.length > 0 && selectedLeads.size === leads.length}
                                onCheckedChange={onToggleSelectAll}
                            />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                                No leads found
                            </TableCell>
                        </TableRow>
                    ) : (
                        leads.map((lead) => (
                            <TableRow key={lead.id} className="cursor-pointer hover:bg-gray-50">
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedLeads.has(lead.id)}
                                        onCheckedChange={() => onToggleSelect(lead.id)}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{lead.name}</TableCell>
                                <TableCell>{lead.email}</TableCell>
                                <TableCell>{lead.company || '-'}</TableCell>
                                <TableCell>
                                    <Badge className={STATUS_COLORS[lead.status]}>{lead.status}</Badge>
                                </TableCell>
                                <TableCell>{lead.source}</TableCell>
                                <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => onView(lead.id)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}

function CardView({ leads, onView }: { leads: Lead[]; onView: (id: string) => void }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {leads.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-8">No leads found</div>
            ) : (
                leads.map((lead) => (
                    <Card
                        key={lead.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => onView(lead.id)}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg truncate">{lead.name}</CardTitle>
                                    <p className="text-sm text-gray-500 truncate mt-1">{lead.email}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {lead.company && (
                                <p className="text-sm text-gray-600 truncate">{lead.company}</p>
                            )}
                            <div className="flex items-center justify-between">
                                <Badge className={STATUS_COLORS[lead.status]}>{lead.status}</Badge>
                                <span className="text-xs text-gray-500">{lead.source}</span>
                            </div>
                            <p className="text-xs text-gray-400">
                                {new Date(lead.createdAt).toLocaleDateString()}
                            </p>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
}

function DraggableLeadCard({ lead, onView }: { lead: Lead; onView: (id: string) => void }) {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'LEAD_CARD',
        item: { id: lead.id },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div ref={drag as any} style={{ opacity: isDragging ? 0.5 : 1 }}>
            <Card
                className="cursor-pointer hover:shadow-md transition-shadow mb-2"
                onClick={() => onView(lead.id)}
            >
                <CardContent className="p-3">
                    <p className="font-medium text-sm truncate">{lead.name}</p>
                    <p className="text-xs text-gray-500 truncate mt-1">{lead.email}</p>
                    {lead.company && (
                        <p className="text-xs text-gray-400 truncate mt-1">{lead.company}</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function KanbanColumn({ status, leads, onView, onDrop }: { status: string; leads: Lead[]; onView: (id: string) => void; onDrop: (leadId: string, status: Lead['status']) => void }) {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'LEAD_CARD',
        drop: (item: { id: string }) => onDrop(item.id, status as Lead['status']),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    return (
        <div className="flex flex-col h-full">
            <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
                <h3 className="font-semibold text-sm text-gray-900">{status}</h3>
                <p className="text-xs text-gray-500 mt-1">{leads.length} leads</p>
            </div>
            <div
                ref={drop as any}
                className={cn(
                    "space-y-2 flex-1 rounded-lg p-2 min-h-[200px] transition-colors",
                    isOver ? "bg-gray-100 border-2 border-dashed border-gray-300" : "bg-gray-50"
                )}
            >
                {leads.map((lead) => (
                    <DraggableLeadCard key={lead.id} lead={lead} onView={onView} />
                ))}
            </div>
        </div>
    );
}

function KanbanView({
    leads,
    onView,
    onUpdate,
}: {
    leads: Lead[];
    onView: (id: string) => void;
    onUpdate: () => void;
}) {
    async function handleStatusChange(leadId: string, newStatus: Lead['status']) {
        try {
            await api.updateLead(leadId, { status: newStatus });
            onUpdate();
        } catch (error) {
            console.error('Failed to update lead status:', error);
        }
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
                {LEAD_STATUSES.map((status) => {
                    const statusLeads = leads.filter((lead) => lead.status === status);
                    return (
                        <KanbanColumn
                            key={status}
                            status={status}
                            leads={statusLeads}
                            onView={onView}
                            onDrop={handleStatusChange}
                        />
                    );
                })}
            </div>
        </DndProvider>
    );
}

function CreateLeadDialog({
    open,
    onClose,
    onSuccess,
}: {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        source: 'manual',
        status: 'New' as Lead['status'],
        assignedTo: '',
        followUpDate: '',
        notes: '',
    });
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            await api.createLead(formData);
            onSuccess();
            setFormData({
                name: '',
                email: '',
                phone: '',
                company: '',
                source: 'manual',
                status: 'New',
                assignedTo: '',
                followUpDate: '',
                notes: '',
            });
        } catch (error) {
            console.error('Failed to create lead:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Lead</DialogTitle>
                    <DialogDescription>Create a new lead in your CRM</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input
                                id="company"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="source">Source</Label>
                            <Input
                                id="source"
                                value={formData.source}
                                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, status: value as Lead['status'] })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LEAD_STATUSES.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="assignedTo">Assigned To</Label>
                            <Input
                                id="assignedTo"
                                type="email"
                                placeholder="User Email"
                                value={formData.assignedTo}
                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="followUpDate">Follow-up Date</Label>
                            <Input
                                id="followUpDate"
                                type="date"
                                value={formData.followUpDate}
                                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Lead'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function BulkActionDialog({
    open,
    action,
    count,
    status,
    onStatusChange,
    onConfirm,
    onClose,
}: {
    open: boolean;
    action: 'delete' | 'status' | null;
    count: number;
    status: Lead['status'];
    onStatusChange: (status: Lead['status']) => void;
    onConfirm: () => void;
    onClose: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {action === 'delete' ? 'Delete Leads' : 'Update Lead Status'}
                    </DialogTitle>
                    <DialogDescription>
                        {action === 'delete'
                            ? `Are you sure you want to delete ${count} lead${count !== 1 ? 's' : ''}?`
                            : `Update the status of ${count} lead${count !== 1 ? 's' : ''}`}
                    </DialogDescription>
                </DialogHeader>

                {action === 'status' && (
                    <div className="space-y-2">
                        <Label>New Status</Label>
                        <Select value={status} onValueChange={(v) => onStatusChange(v as Lead['status'])}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {LEAD_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant={action === 'delete' ? 'destructive' : 'default'}
                        onClick={onConfirm}
                    >
                        {action === 'delete' ? 'Delete' : 'Update'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
