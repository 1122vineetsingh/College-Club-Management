import mongoose from 'mongoose';

export async function connectDb(uri?: string) {
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb+srv://ashwanisingh3:ZeN0WXg5lf5vtwRT@cluster0.wnsvo5g.mongodb.net/ClubSphere?appName=Cluster0';
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  return mongoose.connect(mongoUri, {
    // Mongoose 7 has sensible defaults; options left minimal
  });
}

export default mongoose;
