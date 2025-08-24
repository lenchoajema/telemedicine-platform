import mongoose from 'mongoose';

const userDeviceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceToken: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['iOS', 'Android'],
    required: true
  }
}, {
  timestamps: true
});

const UserDevice = mongoose.model('UserDevice', userDeviceSchema);
export default UserDevice;
