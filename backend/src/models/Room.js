import mongoose from "mongoose";

const { Schema } = mongoose;

const RoomSchema = new Schema(
  {
    roomId: { type: String, required: true, unique: true },
    snapshot: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.models.Room || mongoose.model("Room", RoomSchema);
