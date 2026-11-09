import mongoose from 'mongoose';

const categorizationRuleSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    ruleName: {
      type: String,
      required: true,
      trim: true,
    },
    matchingConditions: [
      {
        field: {
          type: String,
          enum: ['description', 'referenceNumber', 'amount', 'merchant'],
          default: 'description',
        },
        operator: {
          type: String,
          enum: ['contains', 'equals', 'startsWith', 'regex', 'greaterThan', 'lessThan'],
          default: 'contains',
        },
        value: {
          type: String,
          required: true,
        },
      },
    ],
    targetCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    targetCategoryName: {
      type: String,
    },
    priority: {
      type: Number,
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

categorizationRuleSchema.index({ workspaceId: 1, priority: -1 });

export default mongoose.model('CategorizationRule', categorizationRuleSchema);

