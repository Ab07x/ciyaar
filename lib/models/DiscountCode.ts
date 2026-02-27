import mongoose, { Schema, Document } from "mongoose";

export interface IDiscountCode extends Document {
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    applicablePlans: string[];
    maxUses: number;
    usedCount: number;
    isActive: boolean;
    expiresAt: number | null;
    note: string;
    createdAt: number;
}

const DiscountCodeSchema = new Schema<IDiscountCode>(
    {
        code: { type: String, required: true, unique: true, uppercase: true, index: true },
        discountType: { type: String, required: true, enum: ["percentage", "fixed"] },
        discountValue: { type: Number, required: true },
        applicablePlans: [{ type: String }],
        maxUses: { type: Number, default: 0 },
        usedCount: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        expiresAt: { type: Number, default: null },
        note: { type: String, default: "" },
        createdAt: { type: Number, required: true },
    },
    { timestamps: false }
);

export const DiscountCode =
    mongoose.models.DiscountCode ||
    mongoose.model<IDiscountCode>("DiscountCode", DiscountCodeSchema, "discountcodes");
