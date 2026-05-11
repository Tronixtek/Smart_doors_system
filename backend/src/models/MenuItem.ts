import mongoose, { Document, Schema } from 'mongoose';

export enum MenuCategory {
  BREAKFAST = 'BREAKFAST',
  STARTER = 'STARTER',
  MAIN_COURSE = 'MAIN_COURSE',
  SIDE = 'SIDE',
  DESSERT = 'DESSERT',
  HOT_BEVERAGE = 'HOT_BEVERAGE',
  COLD_BEVERAGE = 'COLD_BEVERAGE',
  ALCOHOLIC = 'ALCOHOLIC',
  OTHER = 'OTHER',
}

export interface IMenuItem extends Document {
  name: string;
  category: MenuCategory;
  price: number;
  preparationStation?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(MenuCategory),
      default: MenuCategory.OTHER,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    preparationStation: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
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

MenuItemSchema.index({ name: 1 });
MenuItemSchema.index({ category: 1, isActive: 1 });

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
