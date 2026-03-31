import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    const { name, email, phone } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
      user.emailVerified = false; // Reset verification if email changed
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Profile updated successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};