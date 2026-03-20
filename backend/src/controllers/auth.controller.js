import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import config from '../config/config.js';
import { generateOtp } from '../utils/otp.js';

const transporter = nodemailer.createTransport({
  service: config.EMAIL_SERVICE,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
});

// Request OTP
export const requestOtp = async (req, res) => {
  try {
    const { email, name, phone } = req.body;

    // Support older clients still sending phone, but prefer email.
    const effectiveEmail = email || (phone ? `${phone}@phone.local` : null);

    if (!effectiveEmail) {
      console.log('requestOtp missing email/phone, body:', req.body);
      return res.status(400).json({
        message: 'Email or phone is required',
        received: process.env.NODE_ENV !== 'production' ? req.body : undefined,
      });
    }

    let user = await User.findOne({ email: effectiveEmail });

    if (!user) {
      user = new User({
        name: name || 'Customer',
        email: effectiveEmail,
        password: crypto.randomBytes(12).toString('hex'),
        role: 'customer',
      });
    } else if (name) {
      user.name = name;
    }

    const code = generateOtp();
    user.otpCode = code;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await user.save();

    // Send OTP via email (if we have a real email)
    if (email) {
      await transporter.sendMail({
        from: config.EMAIL_USER,
        to: email,
        subject: 'Your login OTP',
        text: `Your login code is: ${code}. It expires in 5 minutes.`,
        html: `<p>Your login code is: <strong>${code}</strong>.</p><p>It expires in 5 minutes.</p>`,
      });
      console.log(`OTP sent to ${email}: ${code}`);
    } else {
      console.log(`OTP generated for phone user ${phone || '[unknown]'}: ${code}`);
    }

    return res.json({
      message: 'OTP sent',
      devOtp: process.env.NODE_ENV !== 'production' ? code : undefined,
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, phone, code } = req.body;

    // Support older clients that only send phone
    const effectiveEmail = email || (phone ? `${phone}@phone.local` : null);

    if (!effectiveEmail || !code) {
      return res.status(400).json({ message: 'Email/phone and code are required' });
    }

    const user = await User.findOne({ email: effectiveEmail });

    if (!user || !user.otpCode || !user.otpExpiresAt) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    if (new Date() > user.otpExpiresAt || user.otpCode !== code) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    user.emailVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    console.log('Registration attempt for:', email);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      name,
      email,
      password,
      phone,
      role: role || 'customer',
    });

    await user.save();

    console.log('User registered successfully:', email);

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for:', email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Login successful for:', email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user
export const getMe = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
