import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  // Expect employeeId and resetToken to be passed via state from Login page
  const employeeId = location.state?.employeeId;
  const resetToken = location.state?.resetToken;
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [redirect, setRedirect] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`,
        {
          employeeId,
          resetToken,
          newPassword: form.newPassword,
        },
        { withCredentials: true }
      );
      setLoading(false);
      if (
        res.data?.message &&
        res.data.message.toLowerCase().includes('successful')
      ) {
        toast.success('Password reset successful! Please login again.');
        navigate('/login');
      } else {
        toast.error(res.data?.message || 'Failed to reset password');
      }
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  // Redirect to login if required data is missing (useEffect to avoid calling on render)
  useEffect(() => {
    if (!employeeId || !resetToken) {
      setRedirect(true);
    }
  }, [employeeId, resetToken]);
  if (redirect) return <Navigate to='/login' replace />;

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <form
        onSubmit={handleSubmit}
        className='bg-white p-8 rounded-2xl w-full max-w-sm space-y-6 border border-gray-100'
      >
        <h2 className='text-2xl font-extrabold text-gray-800 text-center'>
          Reset Password
        </h2>
        <div>
          <label
            htmlFor='newPassword'
            className='block text-sm font-semibold text-gray-700 mb-1'
          >
            New Password
          </label>
          <input
            type='password'
            name='newPassword'
            id='newPassword'
            autoComplete='new-password'
            required
            value={form.newPassword}
            onChange={handleChange}
            className='mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-gray-50 focus:bg-white outline-none transition'
            placeholder='Enter new password'
          />
        </div>
        <div>
          <label
            htmlFor='confirmPassword'
            className='block text-sm font-semibold text-gray-700 mb-1'
          >
            Confirm Password
          </label>
          <input
            type='password'
            name='confirmPassword'
            id='confirmPassword'
            autoComplete='new-password'
            required
            value={form.confirmPassword}
            onChange={handleChange}
            className='mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-gray-50 focus:bg-white outline-none transition'
            placeholder='Confirm new password'
          />
        </div>
        <button
          type='submit'
          className='w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60'
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
