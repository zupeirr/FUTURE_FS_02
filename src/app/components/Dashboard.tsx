import { useState } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LogOut, Plus } from 'lucide-react';
import type { Lead } from '../App';
import StatsCards from './StatsCards';
import LeadsTable from './LeadsTable';
import LeadDialog from './LeadDialog';

type DashboardProps = {
  onLogout: () => void;
};

// Mock data
const initialLeads: Lead[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    company: 'Tech Corp',
    status: 'new',
    source: 'website',
    assigned_to: 'user1',
    created_by: 'user1',
    created_at: '2026-04-20T10:30:00Z',
    updated_at: '2026-04-20T10:30:00Z',
    notes: 'Interested in enterprise plan',
    followUpDate: '2026-04-25',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '+1 (555) 234-5678',
    company: 'Startup Inc',
    status: 'contacted',
    source: 'referral',
    assigned_to: 'user2',
    created_by: 'user1',
    created_at: '2026-04-18T14:15:00Z',
    updated_at: '2026-04-22T09:00:00Z',
    notes: 'Called on 04/22. Interested but needs approval from manager.',
    followUpDate: '2026-04-26',
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'mbrown@company.com',
    phone: '+1 (555) 345-6789',
    company: 'Big Corp',
    status: 'converted',
    source: 'campaign',
    assigned_to: 'user3',
    created_by: 'user2',
    created_at: '2026-04-15T09:00:00Z',
    updated_at: '2026-04-20T14:00:00Z',
    notes: 'Signed contract for annual subscription. Payment processed.',
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@startup.io',
    company: 'New Startup',
    status: 'new',
    source: 'linkedin',
    assigned_to: 'user1',
    created_by: 'user1',
    created_at: '2026-04-22T16:45:00Z',
    updated_at: '2026-04-22T16:45:00Z',
    notes: 'Requested demo',
    followUpDate: '2026-04-24',
  },
  {
    id: '5',
    name: 'David Wilson',
    email: 'dwilson@tech.com',
    phone: '+1 (555) 456-7890',
    company: 'Tech Solutions',
    status: 'contacted',
    source: 'website',
    assigned_to: 'user2',
    created_by: 'user1',
    created_at: '2026-04-19T11:20:00Z',
    updated_at: '2026-04-21T10:00:00Z',
    notes: 'Email sent with pricing info. Waiting for response.',
  },
];

export default function Dashboard({ onLogout }: DashboardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const handleCreateLead = (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const newLead: Lead = {
      ...lead,
      id: Date.now().toString(),
      created_by: 'currentUser', // TODO: get from auth
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLeads([newLead, ...leads]);
    setIsDialogOpen(false);
  };

  const handleUpdateLead = (updatedLead: Lead) => {
    setLeads(leads.map(lead => lead.id === updatedLead.id ? { ...updatedLead, updated_at: new Date().toISOString() } : lead));
    setEditingLead(null);
  };

  const handleDeleteLead = (id: string) => {
    setLeads(leads.filter(lead => lead.id !== id));
  };

  const handleEditClick = (lead: Lead) => {
    setEditingLead(lead);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Lead Management</h1>
              <p className="text-sm text-gray-600 mt-1">Track and manage your sales leads</p>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="leads">All Leads</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <StatsCards leads={leads} />

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Leads</h2>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lead
                  </Button>
                </div>
              </div>
              <LeadsTable
                leads={leads.slice(0, 5)}
                onEdit={handleEditClick}
                onDelete={handleDeleteLead}
                onUpdateStatus={handleUpdateLead}
              />
            </div>
          </TabsContent>

          <TabsContent value="leads">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">All Leads</h2>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lead
                  </Button>
                </div>
              </div>
              <LeadsTable
                leads={leads}
                onEdit={handleEditClick}
                onDelete={handleDeleteLead}
                onUpdateStatus={handleUpdateLead}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Lead Dialog */}
      <LeadDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleCreateLead}
      />

      {/* Edit Lead Dialog */}
      {editingLead && (
        <LeadDialog
          open={!!editingLead}
          onOpenChange={(open) => !open && setEditingLead(null)}
          onSave={handleUpdateLead}
          lead={editingLead}
        />
      )}
    </div>
  );
}
