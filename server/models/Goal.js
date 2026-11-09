import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    goalType: {
      type: String,
      default: 'General Savings',
    },
    category: {
      type: String,
      default: 'General',
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currentSavedAmount: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    currentAmount: {
      type: Number,
      default: 0.0,
      min: 0,
    },
    targetDate: {
      type: Date,
    },
    monthlyContributionTarget: {
      type: Number,
      default: 0.0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['In Progress', 'Completed', 'On Hold', 'Behind Schedule'],
      default: 'In Progress',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

goalSchema.pre('save', function (next) {
  if (!this.title && this.name) this.title = this.name;
  if (!this.name && this.title) this.name = this.title;
  if (this.currentAmount !== undefined && this.currentSavedAmount === 0) {
    this.currentSavedAmount = this.currentAmount;
  } else if (this.currentSavedAmount !== undefined && this.currentAmount === 0) {
    this.currentAmount = this.currentSavedAmount;
  }
  next();
});

goalSchema.index({ workspaceId: 1, targetDate: 1 });

export default mongoose.model('Goal', goalSchema);
