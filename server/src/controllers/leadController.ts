import { Request, Response } from 'express';
import Lead from '../models/Lead';
import User from '../models/User';

export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const leads = await Lead.findAll({
      order: [['created_at', 'DESC']]
    });
    res.status(200).json({ leads });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

export const getLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findByPk(req.params.id as string);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    res.status(200).json({ lead });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
};

export const createLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadData = req.body;
    const user_id = (req as any).user?.id;
    
    let creator_id = user_id;
    if(!creator_id) {
       const anyAdmin = await User.findOne({ where: { role: 'admin' } });
       creator_id = anyAdmin ? anyAdmin.id : null;
    }

    if (!creator_id) {
        // Fallback or handle website form properly
        // For development purpose, if no admin exists, we'll try to find any user
        const anyUser = await User.findOne();
        creator_id = anyUser ? anyUser.id : null;
        if (!creator_id) {
          res.status(400).json({ error: 'No user to assign created_by. Please create a user first.' });
          return;
        }
    }

    const lead = await Lead.create({
      ...leadData,
      created_by: creator_id
    });
    
    res.status(201).json({ lead });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lead', details: error });
  }
};

export const updateLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findByPk(req.params.id as string);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    await lead.update(req.body);
    res.status(200).json({ lead });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
};

export const deleteLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findByPk(req.params.id as string);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    await lead.destroy(); 
    res.status(200).json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
};

export const bulkDeleteLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadIds } = req.body;
    if (!leadIds || !Array.isArray(leadIds)) {
      res.status(400).json({ error: 'leadIds array required' });
      return;
    }

    const deleted = await Lead.destroy({
      where: { id: leadIds }
    });

    res.status(200).json({ success: true, deleted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk delete leads' });
  }
};

export const bulkUpdateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadIds, status } = req.body;
    if (!leadIds || !Array.isArray(leadIds) || !status) {
      res.status(400).json({ error: 'leadIds array and status required' });
      return;
    }

    const [updated] = await Lead.update(
      { status },
      { where: { id: leadIds } }
    );

    res.status(200).json({ success: true, updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update status' });
  }
};
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const total = await Lead.count();
    const newLeads = await Lead.count({ where: { status: 'New' } });
    const contacted = await Lead.count({ where: { status: 'Contacted' } });
    const qualified = await Lead.count({ where: { status: 'Qualified' } });
    const inProgress = await Lead.count({ where: { status: 'In Progress' } });
    const converted = await Lead.count({ where: { status: 'Converted' } });
    const lost = await Lead.count({ where: { status: 'Lost' } });

    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    res.status(200).json({
      stats: {
        total,
        new: newLeads,
        contacted,
        qualified,
        inProgress,
        converted,
        lost,
        conversionRate
      }
    });
  } catch (error) {
    console.error('Failed to get stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};
