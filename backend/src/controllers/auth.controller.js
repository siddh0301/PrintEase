import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
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
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({ message: 'Email and purpose are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if there's an existing unused OTP for this purpose
    const existingOtp = await Otp.findOne({
      user_id: user._id,
      purpose: purpose,
      is_used: false,
      expires_at: { $gt: new Date() }
    });

    if (existingOtp) {
      return res.status(400).json({ message: 'OTP already sent. Please wait before requesting again.' });
    }

    const code = generateOtp();
    const bcrypt = (await import('bcryptjs')).default;
    const hashedOtp = await bcrypt.hash(code, 12);

    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';

    const otpRecord = new Otp({
      user_id: user._id,
      otp_code: hashedOtp,
      purpose: purpose,
      expires_at: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
      ip_address: clientIp,
    });

    await otpRecord.save();

    if (process.env.NODE_ENV === "production") {
      // Send OTP via email
      await transporter.sendMail({
        from: config.EMAIL_USER,
        to: email,
        subject: `Your ${purpose} OTP`,
        text: `Your ${purpose} code is: ${code}. It expires in 5 minutes.`,
        html: `<p>Your ${purpose} code is: <strong>${code}</strong>.</p><p>It expires in 5 minutes.</p>`,
      });
      console.log(`OTP sent to ${email}: ${code}`);
    } else {
      console.log(`Otp for ${email} : ${code}`);
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
    const { email, code, purpose } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Find OTP record
    const otpRecord = await Otp.findOne({
      user_id: user._id,
      purpose: purpose || 'mobile_login',
      is_used: false,
      expires_at: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      return res.status(400).json({ message: 'Too many attempts. Try after some time.' });
    }

    // Check IP address
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    if (otpRecord.ip_address !== clientIp) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: 'Invalid IP address' });
    }

    // Verify OTP hash
    const bcrypt = (await import('bcryptjs')).default;
    const isValidOtp = await bcrypt.compare(code, otpRecord.otp_code);
    
    if (!isValidOtp) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: 'Invalid code' });
    }

    // Mark OTP as used
    otpRecord.is_used = true;
    await otpRecord.save();

    if (purpose === 'email_verification') {
      user.emailVerified = true;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Verification successful',
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

// Register Customer
export const registerCustomer = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    console.log('Customer registration attempt for:', email);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      name,
      email,
      phone,
      emailVerified: false,
      role: 'customer',
    });

    await user.save();

    console.log('Customer registered successfully:', email);

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Customer registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Register Shop Owner
export const registerShopOwner = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    console.log('Shop owner registration attempt for:', email);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // const bcrypt = (await import('bcryptjs')).default;
    // const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email,
      password: password,
      phone,
      emailVerified: false,
      role: 'shop_owner',
    });

    await user.save();
    
    console.log('Shop owner registered successfully:', email);

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Shop owner registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Shop owner registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login Customer
export const loginCustomer = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('Customer login attempt for:', email);

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'User not found' });
    }

    // Find OTP record
    const otpRecord = await Otp.findOne({
      user_id: user._id,
      purpose: 'mobile_login',
      is_used: false,
      expires_at: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      return res.status(400).json({ message: 'Too many attempts' });
    }

    // Check IP address
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    if (otpRecord.ip_address !== clientIp) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: 'Invalid IP address' });
    }

    // Verify OTP hash
    const bcrypt = (await import('bcryptjs')).default;
    const isValidOtp = await bcrypt.compare(otp, otpRecord.otp_code);
    
    if (!isValidOtp) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();
      console.log('Invalid OTP');
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark OTP as used
    otpRecord.is_used = true;
    await otpRecord.save();

    // Update user emailVerified
    if(user.emailVerified === false) {
      user.emailVerified = true;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Customer login successful for:', email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login Shop Owner
export const loginShopOwner = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Shop owner login attempt for:', email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const bcrypt = (await import('bcryptjs')).default;
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Shop owner login successful for:', email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerified,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Shop owner login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP code, and new password are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Find OTP record
    const otpRecord = await Otp.findOne({
      user_id: user._id,
      purpose: 'password_reset',
      is_used: false,
      expires_at: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      return res.status(400).json({ message: 'Too many attempts. Try after some time.' });
    }

    // Check IP address
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    if (otpRecord.ip_address !== clientIp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: 'Invalid IP address' });
    }

    // Verify OTP hash
    const bcrypt = (await import('bcryptjs')).default;
    const isValidOtp = await bcrypt.compare(code, otpRecord.otp_code);
    
    if (!isValidOtp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: 'Invalid code' });
    }

    // Mark OTP as used
    otpRecord.is_used = true;
    await otpRecord.save();

    // Update password
    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset Password error:', error);
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
