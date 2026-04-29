import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Layout } from '../Layout';
import { api, Lead, Activity } from '../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
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
import { Card, CardContent, CardHeader, CardTitle } from '../ui/cards';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Mail,
    Phone,
    Building2,
    Calendar,
    User,
    FileText,
    MessageSquare,
    Save,
    X,
    Paperclip,
} from 'lucide-react';

const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'In Progress', 'Converted', 'Lost'] as const;

const STATUS_COLORS = {
    New: 'bg-blue-100 text-blue-800 border-blue-200',
    Contacted: 'bg-purple-100 text-purple-800 border-purple-200',
    Qualified: 'bg-green-100 text-green-800 border-green-200',
    'In Progress': 'bg-orange-100 text-orange-800 border-orange-200',
    Converted: 'bg-green-200 text-green-900 border-green-300',
    Lost: 'bg-red-100 text-red-800 border-red-200',
};

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    created: FileText,
    note: MessageSquare,
    status_change: Edit,
    email: Mail,
    call: Phone,
};

export function LeadDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [lead, setLead] = useState<Lead | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [users, setUsers] = useState<import('../lib/api').User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showNoteDialog, setShowNoteDialog] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [noteType, setNoteType] = useState('note');
    const [noteAttachment, setNoteAttachment] = useState<File | null>(null);

    const [formData, setFormData] = useState<Partial<Lead>>({});

    useEffect(() => {
        if (id) {
            loadLead();
            loadActivities();
            loadUsers();
        }
    }, [id]);

    async function loadUsers() {
        try {
            const { users } = await api.getUsers();
            setUsers(users);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    async function loadLead() {
        try {
            const { lead } = await api.getLead(id!);
            setLead(lead);
            setFormData(lead);
        } catch (error) {
            console.error('Failed to load lead:', error);
            navigate('/leads');
        } finally {
            setLoading(false);
        }
    }

    async function loadActivities() {
        try {
            const { activities } = await api.getActivities(id!);
            setActivities(activities.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ));
        } catch (error) {
            console.error('Failed to load activities:', error);
        }
    }

    async function handleSave() {
        if (!lead) return;

        try {
            await api.updateLead(lead.id, formData);
            setEditing(false);
            loadLead();
            loadActivities();
        } catch (error) {
            console.error('Failed to update lead:', error);
        }
    }

    async function handleDelete() {
        if (!lead) return;

        try {
            await api.deleteLead(lead.id);
            navigate('/leads');
        } catch (error) {
            console.error('Failed to delete lead:', error);
        }
    }

    async function handleAddNote() {
        if (!noteText.trim() && !noteAttachment) return;

        try {
            const content = noteText + (noteAttachment ? `\n\n[Attached File: ${noteAttachment.name}]` : '');
            await api.addActivity(id!, noteType, content);
            setNoteText('');
            setNoteAttachment(null);
            setShowNoteDialog(false);
            loadActivities();
        } catch (error) {
            console.error('Failed to add note:', error);
        }
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </Layout>
        );
    }

    if (!lead) {
        return null;
    }

    return (
        <Layout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{lead.name}</h1>
                            <p className="text-gray-500 mt-1">{lead.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {editing ? (
                            <>
                                <Button variant="outline" onClick={() => setEditing(false)}>
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </Button>
                                <Button onClick={handleSave}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" onClick={() => setEditing(true)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                                <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Lead Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lead Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {editing ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Name</Label>
                                                <Input
                                                    id="name"
                                                    value={formData.name || ''}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email || ''}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone</Label>
                                                <Input
                                                    id="phone"
                                                    value={formData.phone || ''}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="company">Company</Label>
                                                <Input
                                                    id="company"
                                                    value={formData.company || ''}
                                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="source">Source</Label>
                                                <Input
                                                    id="source"
                                                    value={formData.source || ''}
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

                                            <div className="space-y-2">
                                                <Label htmlFor="assigned_to">Assigned To</Label>
                                                <Select
                                                    value={formData.assignedTo || 'unassigned'}
                                                    onValueChange={(value) =>
                                                        setFormData({ ...formData, assignedTo: value === 'unassigned' ? null : value })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Unassigned" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                                        {users.map((u) => (
                                                            <SelectItem key={u.id} value={u.id}>
                                                                {u.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="followUpDate">Follow-up Date</Label>
                                                <Input
                                                    id="followUpDate"
                                                    type="datetime-local"
                                                    value={formData.followUpDate ? new Date(formData.followUpDate).toISOString().slice(0, 16) : ''}
                                                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Notes</Label>
                                            <Textarea
                                                id="notes"
                                                value={formData.notes || ''}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                rows={4}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center space-x-3">
                                                <Mail className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Email</p>
                                                    <p className="font-medium">{lead.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Phone className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Phone</p>
                                                    <p className="font-medium">{lead.phone || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Building2 className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Company</p>
                                                    <p className="font-medium">{lead.company || 'N/A'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <FileText className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Source</p>
                                                    <p className="font-medium">{lead.source}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <User className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Assigned To</p>
                                                    <p className="font-medium">
                                                        {users.find((u) => u.id === lead.assignedTo)?.name || 'Unassigned'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Calendar className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Follow-up</p>
                                                    <p className="font-medium">
                                                        {lead.followUpDate ? new Date(lead.followUpDate).toLocaleString() : 'Not set'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {lead.notes && (
                                            <>
                                                <Separator />
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-2">Notes</p>
                                                    <p className="text-gray-900 whitespace-pre-wrap">{lead.notes}</p>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Activity Timeline */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Activity Timeline</CardTitle>
                                    <Button size="sm" onClick={() => setShowNoteDialog(true)}>
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Add Note
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {activities.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No activities yet</p>
                                    ) : (
                                        activities.map((activity) => {
                                            const Icon = ACTIVITY_ICONS[activity.type] || MessageSquare;
                                            return (
                                                <div key={activity.id} className="flex space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                                                            <Icon className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-900">{activity.description}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {formatDate(activity.createdAt)}
                                                            {activity.userEmail && ` by ${activity.userEmail}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Badge className={`${STATUS_COLORS[lead.status]} text-sm px-3 py-1`}>
                                    {lead.status}
                                </Badge>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Created</p>
                                        <p className="text-sm font-medium">
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Updated</p>
                                        <p className="text-sm font-medium">
                                            {new Date(lead.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Created By</p>
                                        <p className="text-sm font-medium">{lead.createdBy}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Lead</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this lead? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Note Dialog */}
            <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Activity</DialogTitle>
                        <DialogDescription>Add a note or activity to this lead</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select value={noteType} onValueChange={setNoteType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="note">Note</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="call">Call</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="note">Description</Label>
                            <Textarea
                                id="note"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                rows={4}
                                placeholder="Enter your note or activity description..."
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input 
                                type="file" 
                                id="note-attachment" 
                                style={{display: 'none'}} 
                                onChange={(e) => setNoteAttachment(e.target.files?.[0] || null)} 
                            />
                            <Button variant="outline" size="sm" onClick={() => document.getElementById('note-attachment')?.click()}>
                                <Paperclip className="h-4 w-4 mr-2" />
                                {noteAttachment ? noteAttachment.name : 'Attach File'}
                            </Button>
                            {noteAttachment && (
                                <Button variant="ghost" size="sm" onClick={() => setNoteAttachment(null)}>
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowNoteDialog(false);
                            setNoteAttachment(null);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddNote}>Add Activity</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
