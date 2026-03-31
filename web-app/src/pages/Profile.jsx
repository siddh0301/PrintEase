import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Save, CheckCircle, XCircle, Shield } from 'lucide-react';

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  React.useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('email', user.email);
      setValue('phone', user.phone);
      setValue('emailVerified', user.emailVerified);
    }
  }, [user, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await updateProfile(data);
    if (!result.success) {
      setLoading(false);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('name', { required: 'Name is required' })}
                className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter your full name"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="mt-1 relative rounded-md shadow-sm mt-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className="w-full pl-10 pr-20 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter your email"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center mb-4">
                {user?.emailVerified ? (
                  <div className="mt-1">
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-1" title="Email verified" />
                      Email verified
                    </p>
                  </div>
                ) : (
                  <div className="mt-1">
                    <button
                      type='button'
                      onClick={() => navigate('/verify-email', { state: { email: user.email } })}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <Shield className="h-5 w-5 mr-1" />
                      <p className='sm:text-sm'>Verify Email</p>
                    </button>
                    {/* <p className="text-sm text-red-600 flex items-center mb-2">
                    <XCircle className="h-5 w-5 text-red-500" title="Email not verified" />
                      Email not verified
                    </p> */}
                  </div>
                )}
              </div>
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('phone', { required: 'Phone is required' })}
                type="tel"
                className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter your phone number"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={logout}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Logout
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Account Details</h3>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Account Type</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">
                {user?.role?.replace('_', ' ')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Member Since</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Profile;

