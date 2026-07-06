import { connectDB } from '@/lib/db';
import User, { type IUser } from '@/models/User';

/** Data-access layer for User. Keeps Mongoose specifics out of the service layer. */
export const userRepository = {
  async findByEmail(email: string, withPassword = false) {
    await connectDB();
    const query = User.findOne({ email: email.toLowerCase() });
    return withPassword ? query.select('+password') : query;
  },

  async findById(id: string) {
    await connectDB();
    return User.findById(id);
  },

  async create(data: Pick<IUser, 'name' | 'email' | 'password'>) {
    await connectDB();
    return User.create(data);
  },

  async updateById(id: string, data: Partial<IUser>) {
    await connectDB();
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  async deleteById(id: string) {
    await connectDB();
    return User.findByIdAndDelete(id);
  },
};
