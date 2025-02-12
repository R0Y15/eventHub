import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add request interceptor to handle errors
api.interceptors.request.use(
  (config) => {
    // Log the request for debugging
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Log the response for debugging
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const register = async (data: { name: string; email: string; password: string }) => {
  const response = await api.post('/api/auth/register', data);
  return response.data;
};

export const login = async (data: { email: string; password: string }) => {
  const response = await api.post('/api/auth/login', data);
  return response.data;
};

export const guestLogin = async () => {
  const response = await api.post('/api/auth/guest-login');
  return response.data;
};

// Event API
export const createEvent = async (data: any, token: string) => {
  const response = await api.post('/api/events', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getEvents = async (params?: any, token?: string) => {
  const response = await api.get('/api/events', {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
};

export const getEvent = async (id: string, token?: string) => {
  const response = await api.get(`/api/events/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
};

export const registerForEvent = async (eventId: string, token: string) => {
  try {
    console.log('Registering for event:', eventId);
    const response = await api.post(`/api/events/${eventId}/register`, {}, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    console.log('Registration response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in registerForEvent:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw error;
  }
};

export const unregisterFromEvent = async (eventId: string, token: string, attendeeEmail?: string) => {
  try {
    console.log('Unregistering from event:', eventId, 'Attendee:', attendeeEmail);
    const response = await api.post(`/api/events/${eventId}/unregister`, 
      attendeeEmail ? { attendeeEmail } : {}, 
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );
    console.log('Unregistration response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in unregisterFromEvent:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw error;
  }
};

// Admin API functions
export const deleteEvent = async (eventId: string, token: string) => {
  const response = await api.delete(`/api/events/${eventId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateEvent = async (eventId: string, data: any, token: string) => {
  try {
    console.log('Updating event:', eventId, 'with data:', data);
    const response = await api.put(`/api/events/${eventId}`, data, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    console.log('Event update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in updateEvent:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw error;
  }
};

export const approveEvent = async (eventId: string, token: string) => {
  try {
    console.log('Approving event:', eventId);
    const response = await api.post(`/api/events/${eventId}/approve`, {}, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    console.log('Event approval response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in approveEvent:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw error;
  }
};

export const toggleEventStatus = async (eventId: string, token: string) => {
  try {
    console.log('Toggling event status:', eventId);
    const response = await api.post(`/api/events/${eventId}/toggle-status`, {}, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    console.log('Event status toggle response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in toggleEventStatus:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw error;
  }
};

export const getEventAttendees = async (eventId: string, token: string) => {
  const response = await api.get(`/api/events/${eventId}/attendees`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Update user API to include role
export const getCurrentUser = async (token: string) => {
  const response = await api.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}; 