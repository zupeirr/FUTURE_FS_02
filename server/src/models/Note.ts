import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';
import Lead from './Lead';
import User from './User';

class Note extends Model {
  public id!: string;
  public lead_id!: string;
  public content!: string;
  public created_by!: string;
  public attachments!: string; // store as JSON string array of paths
}

Note.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lead_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Lead, key: 'id' }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: User, key: 'id' }
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Note',
    tableName: 'notes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

// Define associations
Lead.hasMany(Note, { foreignKey: 'lead_id', as: 'notes' });
Note.belongsTo(Lead, { foreignKey: 'lead_id' });

User.hasMany(Lead, { foreignKey: 'assigned_to', as: 'assigned_leads' });
Lead.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

User.hasMany(Lead, { foreignKey: 'created_by', as: 'created_leads' });
Lead.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(Note, { foreignKey: 'created_by', as: 'notes' });
Note.belongsTo(User, { foreignKey: 'created_by', as: 'author' });

export default Note;

