import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';
import User from './User';

class Lead extends Model {
  public id!: string;
  public name!: string;
  public email!: string;
  public phone!: string | null;
  public company!: string | null;
  public status!: 'new' | 'contacted' | 'qualified' | 'inprogress' | 'converted' | 'lost';
  public source!: string;
  public assigned_to!: string | null;
  public created_by!: string;
  public followUpDate!: Date | null;
}

Lead.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('new', 'contacted', 'qualified', 'inprogress', 'converted', 'lost'),
      allowNull: false,
      defaultValue: 'new',
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    assigned_to: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: User, key: 'id' }
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: User, key: 'id' }
    },
    followUpDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Lead',
    tableName: 'leads',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Lead;
