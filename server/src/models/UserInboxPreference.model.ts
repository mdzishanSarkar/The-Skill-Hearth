import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IUserInboxPreferenceDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  connectionId: Types.ObjectId;
  isPinned: boolean;
  isMuted: boolean;
  mutedUntil?: Date;
  isArchived: boolean;
  archivedAt?: Date;
  lastReadAt?: Date;
}

export interface IUserInboxPreferenceModel extends Model<IUserInboxPreferenceDocument> {
  setPreference(userId: string, connectionId: string, patch: Partial<IUserInboxPreferenceDocument>): Promise<IUserInboxPreferenceDocument | null>;
}

const userInboxPreferenceSchema = new Schema<IUserInboxPreferenceDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    connectionId: { type: Schema.Types.ObjectId, ref: 'Connection', required: true },
    isPinned: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
    mutedUntil: { type: Date },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
    lastReadAt: { type: Date },
  },
  { timestamps: true }
);

userInboxPreferenceSchema.index({ userId: 1, connectionId: 1 }, { unique: true });

userInboxPreferenceSchema.statics.setPreference = async function (
  userId: string,
  connectionId: string,
  patch: Partial<IUserInboxPreferenceDocument>
) {
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(connectionId)) {
    return null;
  }

  return this.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId), connectionId: new mongoose.Types.ObjectId(connectionId) },
    { $set: { ...patch } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
};

const UserInboxPreference = mongoose.model<IUserInboxPreferenceDocument, IUserInboxPreferenceModel>('UserInboxPreference', userInboxPreferenceSchema);
export default UserInboxPreference;
