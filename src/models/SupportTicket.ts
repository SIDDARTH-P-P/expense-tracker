import mongoose, { Schema, model, models, type Document } from 'mongoose';

export interface ISupportTicket extends Document {
  ticketId: string;
  userId: mongoose.Types.ObjectId;
  status: 'open' | 'assigned' | 'resolved' | 'closed';
  assignedAgent?: string;
  subject?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['open', 'assigned', 'resolved', 'closed'], default: 'open' },
    assignedAgent: { type: String, default: 'Expense Desk' },
    subject: { type: String, default: 'General Inquiry' },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === 'development' && models.SupportTicket) {
  delete (models as any).SupportTicket;
}

export default models.SupportTicket || model<ISupportTicket>('SupportTicket', SupportTicketSchema);
