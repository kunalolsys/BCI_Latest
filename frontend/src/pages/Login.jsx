import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
        form,
        { withCredentials: true }
      );
      setLoading(false);
      // Handle first login (reset password required)
      if (res.data?.message === 'Reset your password') {
        navigate('/reset-password', {
          state: {
            employeeId: res.data.employeeId,
            resetToken: res.data.resetToken,
          },
        });
      } else if (res.data?.message === 'Login successful') {
        toast.success('Login successful!');
        // Set login flag and user data in localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem(
          'permissions',
          JSON.stringify(res.data.user.permissions || [])
        );
        localStorage.setItem('role', JSON.stringify(res.data.user.role || {}));
        localStorage.setItem('userId', res.data.user._id);

        if (res.data.secondaryUser) {
          localStorage.setItem('isSecondaryLoggedIn', 'true');
          localStorage.setItem(
            'secondaryPermissions',
            JSON.stringify(res.data.secondaryUser.permissions || [])
          );
          localStorage.setItem(
            'secondaryRole',
            JSON.stringify(res.data.secondaryUser.role || {})
          );
          localStorage.setItem('secondaryUserId', res.data.secondaryUser._id);
        }
        // Force reload to re-initialize App and socket
        window.location.href = '/';
      }
    } catch (err) {
      setLoading(false);
      if (err.response) {
        if (
          err.response.status === 401 &&
          err.response.data.message === 'Invalid credentials'
        ) {
          toast.error('Invalid credentials');
        } else if (
          err.response.status === 403 &&
          err.response.data.message === 'Employee ID is inactive'
        ) {
          toast.error('Employee ID is inactive');
        } else {
          toast.error('Login failed');
        }
      } else {
        toast.error('Network error');
      }
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-200'>
      <form
        onSubmit={handleSubmit}
        className='bg-white p-8 rounded-2xl w-full max-w-sm space-y-7 border border-gray-100 relative'
      >
        {/* Welcoming Icon */}
        <div className='flex justify-center mb-2'>
          <div className='bg-indigo-100 text-indigo-600 rounded-full p-3 shadow'>
            <svg
              className='w-8 h-8'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M16 21v-2a4 4 0 00-8 0v2M12 11a4 4 0 100-8 4 4 0 000 8z'
              />
            </svg>
          </div>
        </div>
        <h2 className='text-3xl font-bold text-gray-800 text-center mb-3 tracking-tight'>
          Welcome Back
        </h2>
        <div>
          <label
            htmlFor='email'
            className='block text-sm font-semibold text-gray-700 mb-1'
          >
            User ID
          </label>
          <input
            type='email'
            name='email'
            id='email'
            autoComplete='email'
            required
            value={form.email}
            onChange={handleChange}
            className='mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 text-gray-900 bg-gray-50 focus:bg-white outline-none transition'
            placeholder='abc@xyz'
          />
        </div>
        <div>
          <label
            htmlFor='password'
            className='block text-sm font-semibold text-gray-700 mb-1'
          >
            Password
          </label>
          <input
            type='password'
            name='password'
            id='password'
            autoComplete='current-password'
            required
            value={form.password}
            onChange={handleChange}
            className='mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 text-gray-900 bg-gray-50 focus:bg-white outline-none transition'
            placeholder='Password'
          />
        </div>
        <button
          type='submit'
          className='cursor-pointer w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60'
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {/* Optional: subtle footer */}
        {/* <div className='text-xs text-gray-400 text-center mt-2 mb-2'>
          © {new Date().getFullYear()} BCI
        </div> */}
        <div className='text-xs text-gray-400 text-center mt-0'>
          Powered by{' '}
          <a href='https://www.openlogicsys.com' target='_blank' rel='noopener noreferrer' className='text-indigo-600 hover:text-indigo-700'>
            OpenLogic Systems
          </a>
        </div>
      </form>
    </div>
  );
}
