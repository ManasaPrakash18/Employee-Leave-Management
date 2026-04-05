import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

class LeaveDonation extends Model {
  static async donateLeave(fromEmployeeId, toEmployeeId, leaveType, days) {
    return await LeaveDonation.create({
      fromEmployeeId,
      toEmployeeId,
      leaveType,
      days,
      donationDate: new Date()
    });
  }
}

LeaveDonation.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fromEmployeeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  toEmployeeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  leaveType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  days: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  donationDate: {
    type: DataTypes.DATE,
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'LeaveDonation',
  tableName: 'leave_donations',
  timestamps: false,
});

export default LeaveDonation;
