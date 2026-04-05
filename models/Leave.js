import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

class Leave extends Model {
  static calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include the start day
    return diffDays;
  }

  static async updateStatus(leaveId, status, reviewerId, comments = '') {
    const leave = await Leave.findByPk(leaveId);
    if (!leave) {
      throw new Error('Leave application not found');
    }

    leave.status = status;
    leave.reviewedBy = reviewerId;
    leave.reviewedDate = new Date();
    leave.comments = comments;

    await leave.save();
    return leave;
  }
}

Leave.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  leaveType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  appliedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  reviewedDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'Leave',
  tableName: 'leaves',
  timestamps: false,
});

export default Leave;
