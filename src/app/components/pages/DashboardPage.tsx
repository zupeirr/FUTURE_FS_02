import React, { useEffect, useState } from 'react';
import { Layout } from '../Layout';
import { api, Stats } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/cards';
import {
    Users,
    UserPlus,
    PhoneCall,
    CheckCircle2,
    Clock,
    TrendingUp,
    XCircle,
    RefreshCw,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

const STATUS_COLORS = {
    New: '#3b82f6',
    Contacted: '#8b5cf6',
    Qualified: '#10b981',
    'In Progress': '#f59e0b',
    Converted: '#22c55e',
    Lost: '#ef4444',
};

export function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats(isRefresh = false) {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const { stats } = await api.getStats();
            setStats(stats);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
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

    const statusCards = [
        {
            title: 'New Leads',
            value: stats?.new || 0,
            icon: UserPlus,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Contacted',
            value: stats?.contacted || 0,
            icon: PhoneCall,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            title: 'Qualified',
            value: stats?.qualified || 0,
            icon: CheckCircle2,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: 'In Progress',
            value: stats?.inProgress || 0,
            icon: Clock,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
        {
            title: 'Converted',
            value: stats?.converted || 0,
            icon: TrendingUp,
            color: 'text-green-700',
            bgColor: 'bg-green-100',
        },
        {
            title: 'Lost',
            value: stats?.lost || 0,
            icon: XCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
    ];

    const chartData = [
        { name: 'New', value: stats?.new || 0, color: STATUS_COLORS.New },
        { name: 'Contacted', value: stats?.contacted || 0, color: STATUS_COLORS.Contacted },
        { name: 'Qualified', value: stats?.qualified || 0, color: STATUS_COLORS.Qualified },
        { name: 'In Progress', value: stats?.inProgress || 0, color: STATUS_COLORS['In Progress'] },
        { name: 'Converted', value: stats?.converted || 0, color: STATUS_COLORS.Converted },
        { name: 'Lost', value: stats?.lost || 0, color: STATUS_COLORS.Lost },
    ];

    return (
        <Layout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-500 mt-1">Overview of your leads and performance</p>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={() => loadStats(true)} 
                        disabled={refreshing}
                        className="bg-white"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {statusCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <Card key={card.title}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">{card.title}</p>
                                            <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                                        </div>
                                        <div className={`${card.bgColor} ${card.color} p-3 rounded-lg`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</p>
                                </div>
                                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                                    <Users className="h-8 w-8" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">
                                        {stats?.conversionRate || 0}%
                                    </p>
                                </div>
                                <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                                    <TrendingUp className="h-8 w-8" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Leads</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">
                                        {(stats?.new || 0) +
                                            (stats?.contacted || 0) +
                                            (stats?.qualified || 0) +
                                            (stats?.inProgress || 0)}
                                    </p>
                                </div>
                                <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
                                    <Clock className="h-8 w-8" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bar Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Leads by Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" fontSize={12} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" name="Leads">
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Lead Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) =>
                                            percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                                        }
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
