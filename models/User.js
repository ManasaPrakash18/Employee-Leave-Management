import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/db.js';

class User extends Model {
  async validPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  static async updateLeaveBalance(userId, leaveType, days, isAdd) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let field;
    switch (leaveType) {
      case 'annual':
        field = 'leaveBalanceAnnual';
        break;
      case 'sick':
        field = 'leaveBalanceSick';
        break;
      case 'casual':
        field = 'leaveBalanceCasual';
        break;
      case 'compensatory':
        field = 'leaveBalanceCompensatory';
        break;
      default:
        throw new Error('Invalid leave type');
    }

    if (isAdd) {
      user[field] += days;
    } else {
      if (user[field] < days) {
        throw new Error(`Insufficient ${leaveType} leave balance`);
      }
      user[field] -= days;
    }

    await user.save();
    return user;
  }

  static async getEmployeesByDepartment(department) {
    return await User.findAll({
      where: {
        role: 'employee',
        department: department
      }
    });
  }

  static async getManagersByDepartment(department) {
    return await User.findAll({
      where: {
        role: 'manager',
        department: department
      }
    });
  }
}

User.init({
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
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('employee', 'manager'),
    defaultValue: 'employee',
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  leaveBalanceAnnual: {
    type: DataTypes.INTEGER,
    defaultValue: 20,
  },
  leaveBalanceSick: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  leaveBalanceCasual: {
    type: DataTypes.INTEGER,
    defaultValue: 7,
  },
  leaveBalanceCompensatory: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

export default User;
