'use client';

import { useState, useEffect, useRef } from 'react';
import { Map, Marker, MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '../lib/supabase';

type AlertType = 'Trail' | 'LEO' | 'Citation';
type AlertStatus = 'Active' | 'Resolved';
type DateFilterPreset = 'today' | 'last 7d' | 'last 14d' | 'last 30d' | 'custom';

interface UserProfile {
  name: string;
  email: string;
  location: string;
}

interface BillingInfo {
  cardNumber: string;
  expiryDate: string;
  cardholderName: string;
  billingAddress: string;
}

interface DateRange {
  start: Date;
  end: Date;
}

interface Alert {
  id: string;
  type: AlertType;
  status?: AlertStatus;
  category: string;
  location: string;
  description: string;
  reportedBy: string;
  reportedAt: Date;
  latitude: number;
  longitude: number;
  photos?: string[];
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'Trail',
    status: 'Active',
    category: 'Downed Tree',
    location: 'Eldridge Road Trail',
    description: 'Large oak tree blocking the main trail near mile marker 3.2. The tree appears to have fallen during last night\'s storm and is completely blocking passage for both hikers and mountain bikers. The trunk is approximately 2 feet in diameter and extends across the entire width of the trail. Multiple smaller branches have also fallen in the immediate area, creating additional hazards.',
    reportedBy: 'TrailMaintainer',
    reportedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    latitude: 38.0293,
    longitude: -122.6814,
    photos: ['/api/placeholder/400/300', '/api/placeholder/400/300']
  },
  {
    id: '2',
    type: 'Trail',
    status: 'Active',
    category: 'Washout',
    location: 'Tamarancho Trail',
    description: 'Trail washed out after recent rains, impassable for bikes. The erosion has created a deep channel approximately 4 feet wide and 3 feet deep that cuts directly across the trail surface. The surrounding area is extremely muddy and unstable. Water continues to flow through this section, making it dangerous for all trail users. Temporary barriers have been placed to warn approaching riders and hikers.',
    reportedBy: 'WeatherWatcher',
    reportedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    latitude: 37.9735,
    longitude: -122.5467,
    photos: ['/api/placeholder/400/300']
  },
  {
    id: '3',
    type: 'LEO',
    category: 'Law Enforcement',
    location: 'Pine Ridge Parking',
    description: 'Increased patrol presence in parking areas due to recent reports of vehicle break-ins and theft from cars. Officers will be conducting regular patrols throughout the day and evening hours. Visitors are reminded to lock vehicles and avoid leaving valuables visible.',
    reportedBy: 'ParkRanger',
    reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    latitude: 38.0522,
    longitude: -122.7258
  },
  {
    id: '4',
    type: 'Citation',
    category: 'Citation Issued',
    location: 'Bear Creek Trailhead',
    description: 'Vehicle cited for parking in no-parking zone, blocking emergency vehicle access. The vehicle was parked directly in front of the emergency gate, preventing potential access for fire trucks and ambulances.',
    reportedBy: 'ParkOfficer',
    reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    latitude: 37.9441,
    longitude: -122.5658
  },
  {
    id: '5',
    type: 'Trail',
    status: 'Resolved',
    category: 'Bridge Damage',
    location: 'Mill Creek Trail',
    description: 'Wooden bridge planks were loose and potentially dangerous for mountain bikers. Several planks had come loose from their supports and were creating a hazardous riding surface. Trail maintenance crew has secured all planks and replaced damaged hardware.',
    reportedBy: 'TrailPatrol',
    reportedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    latitude: 38.0100,
    longitude: -122.6200
  },
  {
    id: '6',
    type: 'Trail',
    status: 'Active',
    category: 'Bee Swarm',
    location: 'Sunset Ridge Fire Road',
    description: 'Large bee swarm has taken up residence in the oak tree overhanging the trail at mile marker 5.8. The swarm is actively defending the area and multiple trail users have reported being chased. The bees appear to be Africanized honey bees based on their aggressive behavior. Local beekeepers have been contacted but removal may take several days. Trail users should avoid this section or proceed with extreme caution and consider alternative routes.',
    reportedBy: 'HikerSafety',
    reportedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    latitude: 38.0400,
    longitude: -122.6000,
    photos: ['/api/placeholder/400/300', '/api/placeholder/400/300']
  },
  {
    id: '7',
    type: 'LEO',
    category: 'Search and Rescue',
    location: 'Devil\'s Gulch Trail',
    description: 'Search and rescue operation in progress for missing hiker last seen yesterday evening. Multiple agencies are coordinating the search including county sheriff, park rangers, and volunteer search teams. Trail access is temporarily restricted in the search area.',
    reportedBy: 'SARCoordinator',
    reportedAt: new Date(Date.now() - 30 * 60 * 1000),
    latitude: 38.0600,
    longitude: -122.5800
  },
  {
    id: '8',
    type: 'Trail',
    status: 'Active',
    category: 'Poison Oak Overgrowth',
    location: 'Deer Park Loop',
    description: 'Excessive poison oak growth has encroached onto the trail, particularly in the shaded sections between miles 2.1 and 2.7. The vegetation is touching the trail surface in multiple locations, making it impossible to pass without contact. Trail users with sensitivity to poison oak should avoid this section until maintenance crews can clear the overgrowth. Long pants and long sleeves are strongly recommended for anyone attempting passage.',
    reportedBy: 'NaturalistVolunteer',
    reportedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    latitude: 37.9900,
    longitude: -122.6400
  },
  {
    id: '9',
    type: 'Citation',
    category: 'Off-Trail Riding',
    location: 'Meadow Creek Preserve',
    description: 'Mountain biker cited for riding off designated trails in sensitive habitat area. Rider was observed creating new trail damage in protected wetland area.',
    reportedBy: 'EnvironmentalOfficer',
    reportedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    latitude: 38.0200,
    longitude: -122.5600
  },
  {
    id: '10',
    type: 'Trail',
    status: 'Active',
    category: 'Wild Animal Sighting',
    location: 'Bobcat Ridge Trail',
    description: 'Mountain lion sighting reported by multiple trail users near the water crossing at mile 4.2. A large adult mountain lion was observed drinking from the creek around 6:30 AM and showed no immediate fear of humans. The animal appeared healthy but was territorial around the water source. Hikers and bikers should make noise when approaching this area, travel in groups, and consider avoiding dawn and dusk hours when big cats are most active.',
    reportedBy: 'WildlifeObserver',
    reportedAt: new Date(Date.now() - 45 * 60 * 1000),
    latitude: 38.0350,
    longitude: -122.6100,
    photos: ['/api/placeholder/400/300']
  }
];

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 24) {
    return `about ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function getDateRange(preset: DateFilterPreset, customRange?: DateRange): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case 'today':
      return { start: today, end: now };
    case 'last 7d':
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      return { start: sevenDaysAgo, end: now };
    case 'last 14d':
      const fourteenDaysAgo = new Date(today);
      fourteenDaysAgo.setDate(today.getDate() - 14);
      return { start: fourteenDaysAgo, end: now };
    case 'last 30d':
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return { start: thirtyDaysAgo, end: now };
    case 'custom':
      if (customRange) return customRange;
      const defaultCustomFourteenDaysAgo = new Date(today);
      defaultCustomFourteenDaysAgo.setDate(today.getDate() - 14);
      return { start: defaultCustomFourteenDaysAgo, end: now };
    default:
      const defaultFourteenDaysAgo = new Date(today);
      defaultFourteenDaysAgo.setDate(today.getDate() - 14);
      return { start: defaultFourteenDaysAgo, end: now };
  }
}

export default function MHAZApp() {
  // Existing state
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [selectedAlertTypes, setSelectedAlertTypes] = useState<AlertType[]>(['Trail', 'LEO', 'Citation']);
  const [expandedAlert, setExpandedAlert] = useState<Alert | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [isResolvingAlert, setIsResolvingAlert] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [dateFilterPreset, setDateFilterPreset] = useState<DateFilterPreset>('last 14d');
  const [customDateRange, setCustomDateRange] = useState<DateRange | null>(null);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  
  // Map state
  const [selectedMapAlert, setSelectedMapAlert] = useState<Alert | null>(null);
  const [showMapPopup, setShowMapPopup] = useState(false);
  const [expandedFromMap, setExpandedFromMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ longitude: -122.5814, latitude: 38.0293, zoom: 10 });
  
  // Alert creation state
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  const [newAlertPin, setNewAlertPin] = useState<{ longitude: number; latitude: number } | null>(null);
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [newAlertData, setNewAlertData] = useState({
    type: '' as AlertType | '',
    category: '',
    location: '',
    description: '',
    agency: '',
    citationDate: '',
    citationTime: '',
    photos: [] as string[]
  });
  
  // User account state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [activeAccountTab, setActiveAccountTab] = useState<'profile' | 'billing'>('profile');
  
  // Auth screen state
  const [authScreen, setAuthScreen] = useState<'login' | 'forgot-password' | 'sign-up'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Sign up form state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpLocation, setSignUpLocation] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    location: ''
  });
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    cardNumber: '**** **** **** 1234',
    expiryDate: '12/25',
    cardholderName: '',
    billingAddress: '123 Main St, Marin County, CA 94941'
  });
  const [tempProfile, setTempProfile] = useState<UserProfile>(userProfile);
  const [tempBilling, setTempBilling] = useState<BillingInfo>(billingInfo);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  const customModalRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapRef | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const currentDateRange = getDateRange(dateFilterPreset, customDateRange || undefined);

  // Authentication state management
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error:', error);
          return;
        }
        
        setIsLoggedIn(!!session);
        if (session?.user) {
          // Load user profile
          await loadUserProfile(session.user.id);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      try {
        console.log('Auth state change:', event, session?.user?.email);
        setIsLoggedIn(!!session);
        if (session?.user) {
          // Don't await - schedule async work to avoid client lockup
          loadUserProfile(session.user.id).catch(err => 
            console.error('Profile load error after auth change:', err)
          );
        }
      } catch (err) {
        console.error('Auth state change error:', err);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user profile from database
  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, try to create one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating one...');
          await createMissingProfile(userId);
          return;
        }
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setUserProfile({
          name: data.username,
          email: data.email,
          location: data.location || ''
        });
      }
    } catch (err) {
      console.error('Profile load error:', err);
    }
  };

  const createMissingProfile = async (userId: string) => {
    try {
      // Get user info from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const username = user.user_metadata?.username || 
                      user.email?.split('@')[0] || 
                      'User';
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email,
          username: username,
          location: user.user_metadata?.location || ''
        })
        .select()
        .single();

      if (error) {
        // Ignore duplicate key errors - profile already exists
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          console.log('Profile already exists, trying to fetch it again...');
          // Try to fetch the existing profile directly
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (existingProfile) {
            setUserProfile({
              name: existingProfile.username,
              email: existingProfile.email,
              location: existingProfile.location || ''
            });
          }
          return;
        }
        console.error('Error creating profile:', error);
        return;
      }

      if (data) {
        setUserProfile({
          name: data.username,
          email: data.email,
          location: data.location || ''
        });
      }
    } catch (err) {
      console.error('Create profile error:', err);
    }
  };

  // Load alerts from database
  const loadAlerts = async () => {
    console.log('🔄 Loading alerts from database...');
    
    // Debug environment variables in production
    console.log('🔧 Environment Debug:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      keyPreview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
    });
    
    try {
      console.log('📡 Making Supabase query...');
      
      // Test simple connection first - this bypasses potential RLS issues
      console.log('🧪 Testing basic connectivity with count query...');
      const { count: testCount, error: testError } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true });
      
      console.log('🧪 Basic connectivity test result:', { count: testCount, error: testError });
      
      if (testError) {
        console.error('❌ Basic connectivity failed:', testError);
        throw testError;
      }

        const queryPromise = supabase
            .from('alerts')
            .select(`
      *,
      profiles!reported_by(username)
    `).order('reported_at', { ascending: false });


        const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout after 15 seconds')), 15000);
      });
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data, error } = result;

      console.log('📡 Supabase query completed');
      console.log('📊 Raw alerts data from DB:', data);
      console.log('❌ Alerts error (if any):', error);

      if (error) {
        console.error('Error loading alerts:', error);
        return;
      }

      if (data) {
        console.log(`📈 Found ${data.length} alerts in database`);
          const formattedAlerts: Alert[] = data.map(alert => ({
              id: alert.id,
              type: alert.type,
              status: alert.type === 'Trail' ? alert.status : undefined,
              category: alert.category,
              location: alert.location,
              description: alert.description,
              reportedBy: alert.profiles?.username || 'Unknown User',
              reportedAt: new Date(alert.reported_at),
              latitude: alert.latitude,
              longitude: alert.longitude,
              photos: alert.photos || undefined
          }));

        console.log('📋 Setting formatted alerts in state:', formattedAlerts);
        setAlerts(formattedAlerts);
        console.log('✅ Alerts loaded successfully!');
      }
    } catch (err) {
      console.error('❌ Alerts load error (catch block):', err);
      console.error('❌ Error details:', JSON.stringify(err, null, 2));
    }
  };

  // Load alerts when component mounts AND when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      console.log('🔑 User is logged in, loading alerts...');
      loadAlerts();
    } else {
      console.log('🚫 User not logged in, skipping alert loading');
    }
  }, [isLoggedIn]);

  // Handle click outside dropdown, custom modal, user menu, and map popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDateDropdown(false);
      }
      if (customModalRef.current && !customModalRef.current.contains(event.target as Node)) {
        setShowCustomDateModal(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showDateDropdown || showCustomDateModal || showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDateDropdown, showCustomDateModal, showUserMenu]);
  
  // Handle map click to close popup
  useEffect(() => {
    const handleMapClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Close popup if clicking on map background (not on markers or popup)
      if (showMapPopup && !target.closest('.mapboxgl-marker') && !target.closest('.absolute.inset-x-4.bottom-4')) {
        setShowMapPopup(false);
        setSelectedMapAlert(null);
      }
    };

    if (showMapPopup && viewMode === 'map') {
      document.addEventListener('click', handleMapClick);
    }

    return () => {
      document.removeEventListener('click', handleMapClick);
    };
  }, [showMapPopup, viewMode]);

  // Initialize custom date range when opening custom modal
  const openCustomDateModal = () => {
    if (!customDateRange) {
      const now = new Date();
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(now.getDate() - 14);
      setCustomDateRange({ start: fourteenDaysAgo, end: now });
    }
    setShowDateDropdown(false);
    setShowCustomDateModal(true);
  };
  
  const filteredAlerts = alerts
    .filter(alert => selectedAlertTypes.includes(alert.type))
    .filter(alert => {
      const alertDate = alert.reportedAt;
      return alertDate >= currentDateRange.start && alertDate <= currentDateRange.end;
    })
    .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
  
  const toggleAlertType = (type: AlertType) => {
    setSelectedAlertTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleResolveAlert = async () => {
    if (expandedAlert && expandedAlert.type === 'Trail') {
      setIsResolvingAlert(true);
      try {
        console.log('Current alert being resolved:', expandedAlert);
        console.log('Available alert fields:', Object.keys(expandedAlert));
        
        // Check if any resolved alerts exist at all
        const { data: existingResolved, error: queryError } = await supabase
          .from('alerts')
          .select('*')
          .eq('status', 'Resolved')
          .limit(5);
          
        console.log('Query error:', queryError);
        console.log('Existing resolved alerts:', existingResolved);
        console.log('Number of resolved alerts found:', existingResolved?.length || 0);
        
        // Also get the schema information
        const { data: schemaInfo, error: schemaError } = await supabase
          .from('alerts')
          .select('*')
          .limit(0);
          
        console.log('Schema query error:', schemaError);
        
        // The issue is that database column names might be different from JS field names
        // Let's get the raw database column names by doing a simple select first
        const { data: sampleAlert, error: sampleError } = await supabase
          .from('alerts')
          .select('*')
          .limit(1)
          .single();
          
        console.log('Sample alert from database (raw column names):', sampleAlert);
        console.log('Sample query error:', sampleError);
        
        // Get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        
        // Update in database with resolved fields
        const { error } = await supabase
          .from('alerts')
          .update({ 
            status: 'Resolved',
            resolved_at: new Date().toISOString(),
            resolved_by: user?.id || null
          })
          .eq('id', expandedAlert.id);

        if (error) {
          console.error('Error updating alert status:', error);
          alert(`Failed to resolve alert: ${error.message}`);
          return;
        }

        // Update local state only after successful database update
        setAlerts(prev => prev.map(alert => 
          alert.id === expandedAlert.id 
            ? { ...alert, status: 'Resolved' as AlertStatus }
            : alert
        ));
        setExpandedAlert(prev => prev ? { ...prev, status: 'Resolved' as AlertStatus } : null);
        setShowResolveDialog(false);
      } catch (err) {
        console.error('Error resolving alert:', err);
        alert('Failed to resolve alert. Please try again.');
      } finally {
        setIsResolvingAlert(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
        return;
      }
      
      // Clear user state
      setUserProfile({
        name: '',
        email: '',
        location: ''
      });
      setIsLoggedIn(false);
      setShowUserMenu(false);
    } catch (err) {
      console.error('Logout error:', err);
      alert('Error logging out. Please try again.');
    }
  };

  const handleLogin = async () => {
    // Basic validation
    if (!loginEmail || !loginPassword) {
      alert('Please enter both email/username and password');
      return;
    }
    
    console.log('Attempting login for:', loginEmail);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });

      console.log('Login response:', { data, error });

      if (error) {
        console.error('Login error:', error);
        
        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          alert('Please check your email and click the confirmation link before signing in.');
        } else if (error.message.includes('Invalid login credentials')) {
          alert('Invalid email or password. Please check your credentials and try again.');
        } else {
          alert(`Login failed: ${error.message}`);
        }
        return;
      }

      if (data.session) {
        console.log('Successfully logged in:', data.user?.email);
        // Successfully logged in
        setLoginEmail('');
        setLoginPassword('');
      } else {
        console.log('No session created');
        alert('Login failed - no session created. Please try again.');
      }
      
    } catch (err) {
      console.error('Login exception:', err);
      alert('An error occurred during login. Please try again.');
    }
  };

  const handleForgotPassword = () => {
    setAuthScreen('forgot-password');
  };

  const handleSendPasswordReset = () => {
    if (!loginEmail) {
      alert('Please enter your email address');
      return;
    }
    // In a real app, this would send a password reset email
    alert(`Password reset link sent to ${loginEmail}`);
    setAuthScreen('login');
  };

  const handleSignUp = async () => {
    // Validate sign up form
    if (!signUpEmail || !signUpUsername || !signUpPassword || !signUpLocation) {
      alert('Please fill in all fields');
      return;
    }
    
    if (signUpPassword !== signUpConfirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (signUpPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    try {
      console.log('Attempting signup with:', signUpEmail, signUpUsername);
      
      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            username: signUpUsername,
            location: signUpLocation
          }
        }
      });

      console.log('Signup response:', { data, error });

      if (error) {
        console.error('Signup error:', error);
        alert(`Sign up failed: ${error.message}`);
        return;
      }

      if (data.user && !data.session) {
        // Email confirmation required
        alert('Please check your email and click the confirmation link to complete your account setup.');
      } else if (data.session && data.user) {
        // User is immediately logged in (if email confirmation is disabled)
        // Create profile as fallback in case trigger didn't work
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: signUpEmail,
            username: signUpUsername,
            location: signUpLocation
          });
        
        if (profileError && !profileError.message.includes('duplicate key')) {
          console.error('Profile creation error:', profileError);
        }
        
        alert('Account created successfully!');
      }
      
      // Clear form
      setSignUpEmail('');
      setSignUpUsername('');
      setSignUpPassword('');
      setSignUpConfirmPassword('');
      setSignUpLocation('');
      setAuthScreen('login');
      
    } catch (err) {
      console.error('Sign up error:', err);
      alert('An error occurred during sign up. Please try again.');
    }
  };

  const openAccountModal = (tab: 'profile' | 'billing' = 'profile') => {
    setActiveAccountTab(tab);
    setTempProfile(userProfile);
    setTempBilling(billingInfo);
    setNewPassword('');
    setConfirmPassword('');
    setShowUserMenu(false);
    setShowAccountModal(true);
  };

  const handleSaveProfile = () => {
    // Validate password if provided
    if (newPassword && newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (newPassword && newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    setUserProfile(tempProfile);
    
    // In a real app, you would send the password change request to your backend
    
    setNewPassword('');
    setConfirmPassword('');
    setShowAccountModal(false);
  };

  const handleSaveBilling = () => {
    setBillingInfo(tempBilling);
    setShowAccountModal(false);
  };

  const handleCancelAccount = () => {
    setTempProfile(userProfile);
    setTempBilling(billingInfo);
    setNewPassword('');
    setConfirmPassword('');
    setShowAccountModal(false);
  };

  const handleShowOnMap = (alert: Alert) => {
    // Switch to map view
    setViewMode('map');
    // Center map on the alert location and zoom in
    const newCenter = { 
      longitude: alert.longitude, 
      latitude: alert.latitude, 
      zoom: 14 
    };
    setMapCenter(newCenter);
    
    // Use setTimeout to ensure map is rendered before flying to location
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [alert.longitude, alert.latitude],
          zoom: 14,
          duration: 1000
        });
      }
    }, 100);
    
    // Set the alert as selected and show popup
    setSelectedMapAlert(alert);
    setShowMapPopup(true);
  };

  // Alert creation handlers
  const handleStartAddingAlert = () => {
    if (viewMode !== 'map') {
      setViewMode('map');
    }
    setIsAddingAlert(true);
    setNewAlertPin(null);
    setShowLocationConfirm(false);
    setShowAlertForm(false);
    setShowMapPopup(false);
    setSelectedMapAlert(null);
  };

  const handleCancelAddingAlert = () => {
    setIsAddingAlert(false);
    setNewAlertPin(null);
    setShowLocationConfirm(false);
    setShowAlertForm(false);
    setNewAlertData({
      type: '',
      category: '',
      location: '',
      description: '',
      agency: '',
      citationDate: '',
      citationTime: '',
      photos: []
    });
  };

  // Photo upload handlers
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const maxPhotos = 2;
    const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    // Check if adding these files would exceed the limit
    const currentPhotoCount = newAlertData.photos.length;
    const filesToProcess = Array.from(files).slice(0, maxPhotos - currentPhotoCount);

    if (filesToProcess.length === 0) {
      alert('You can only upload up to 2 photos');
      return;
    }

    filesToProcess.forEach(file => {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload only PNG or JPG files');
        return;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        alert('File size must be less than 10MB');
        return;
      }

      // Convert to base64 data URL for preview (in a real app, you'd upload to storage)
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setNewAlertData(prev => ({
          ...prev,
          photos: [...prev.photos, dataUrl]
        }));
      };
      reader.readAsDataURL(file);
    });

    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setNewAlertData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleMapClick = (event: { lngLat: { lng: number; lat: number } }) => {
    if (isAddingAlert) {
      const { lng, lat } = event.lngLat;
      
      if (!newAlertPin) {
        // First click - place the pin
        setNewAlertPin({ longitude: lng, latitude: lat });
      } else {
        // Subsequent clicks - show confirmation dialog
        setShowLocationConfirm(true);
      }
    }
  };

  const handleConfirmLocation = () => {
    if (!newAlertPin) return;
    
    // Check if location is within allowed bounds (Marin County + 2 mile buffer)
    if (!isWithinMarinCounty(newAlertPin.longitude, newAlertPin.latitude)) {
      alert('Alert location must be within Marin County. Please select a location within Marin County to create your alert.');
      return;
    }
    
    setShowLocationConfirm(false);
    setShowAlertForm(true);
  };

  // Marin County boundary check (simplified bounds with buffer)
  const isWithinMarinCounty = (longitude: number, latitude: number): boolean => {
    // Marin County approximate bounds with ~2 mile buffer
    const marinBounds = {
      north: 38.35,   // Northern boundary with buffer
      south: 37.85,   // Southern boundary with buffer  
      east: -122.35,  // Eastern boundary with buffer
      west: -122.95   // Western boundary with buffer
    };
    
    return latitude >= marinBounds.south && 
           latitude <= marinBounds.north && 
           longitude >= marinBounds.west && 
           longitude <= marinBounds.east;
  };

  const handleSubmitAlert = async () => {
    console.log('🚀 Starting alert submission...');
    console.log('📋 Alert data:', { newAlertPin, newAlertData });
    
    if (!newAlertPin || !newAlertData.type || !newAlertData.location || !newAlertData.description) {
      console.log('❌ Validation failed - missing required fields');
      console.log('Missing:', {
        pin: !newAlertPin,
        type: !newAlertData.type,
        location: !newAlertData.location,
        description: !newAlertData.description
      });
      return;
    }

    console.log('✅ Validation passed, proceeding with submission');

    try {
      // Get current user
      console.log('👤 Getting current user...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to create alerts');
        return;
      }

      // Ensure user profile exists
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            username: user.email?.split('@')[0] || 'user'
          });

        if (createError) {
          console.error('Error creating profile:', createError);
          alert('Unable to create user profile. Please try again.');
          return;
        }
      } else if (profileError) {
        console.error('Error checking profile:', profileError);
        alert('Unable to verify user profile. Please try again.');
        return;
      }

      // Check rate limiting - user can only submit 1 alert per 90 seconds
      console.log('🔍 Checking rate limiting for user:', user.id);
      const ninetySecondsAgo = new Date(Date.now() - 90 * 1000).toISOString();
      console.log('⏰ Looking for alerts since:', ninetySecondsAgo);
      
      const { data: recentAlerts, error: rateLimitError } = await supabase
        .from('alerts')
        .select('reported_at')
        .eq('reported_by', user.id)
        .gte('reported_at', ninetySecondsAgo)
        .limit(1);

      console.log('📊 Rate limit query result:', { recentAlerts, rateLimitError });

      if (rateLimitError) {
        console.error('Error checking rate limit:', rateLimitError);
        alert('Unable to verify submission rate. Please try again.');
        return;
      }

      if (recentAlerts && recentAlerts.length > 0) {
        const lastSubmission = new Date(recentAlerts[0].reported_at);
        const timeSinceLastSubmission = Math.ceil((Date.now() - lastSubmission.getTime()) / 1000);
        const timeRemaining = 90 - timeSinceLastSubmission;
        console.log('🚫 Rate limit triggered!', { lastSubmission, timeSinceLastSubmission, timeRemaining });
        alert(`Please wait ${timeRemaining} more seconds before submitting another alert.`);
        return;
      }

      console.log('✅ Rate limit check passed, proceeding with alert creation');

      // Prepare alert data for database
      const alertData = {
        type: newAlertData.type as AlertType,
        status: newAlertData.type === 'Trail' ? 'Active' as AlertStatus : undefined,
        category: newAlertData.category,
        location: newAlertData.location,
        description: newAlertData.description,
        reported_by: user.id,
        latitude: newAlertPin.latitude,
        longitude: newAlertPin.longitude,
        photos: newAlertData.photos.length > 0 ? newAlertData.photos : null,
        citation_date: newAlertData.type === 'Citation' ? newAlertData.citationDate : null,
        citation_time: newAlertData.type === 'Citation' ? newAlertData.citationTime : null,
        agency: newAlertData.type === 'Citation' ? newAlertData.agency : null
      };

      // Insert into database
      const { data, error } = await supabase
        .from('alerts')
        .insert(alertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating alert:', error);
        alert(`Failed to create alert: ${error.message}`);
        return;
      }

      if (data) {
        // Convert database format to app format and add to local state
        const newAlert: Alert = {
          id: data.id,
          type: data.type,
          status: data.status,
          category: data.category,
          location: data.location,
          description: data.description,
          reportedBy: userProfile?.name || 'Trail User',
          reportedAt: new Date(data.reported_at),
          latitude: data.latitude,
          longitude: data.longitude,
          photos: data.photos || undefined
        };

        setAlerts(prev => [newAlert, ...prev]);
        alert('Alert created successfully!');
      }

      handleCancelAddingAlert();
      
    } catch (err) {
      console.error('Alert creation error:', err);
      alert('An error occurred while creating the alert. Please try again.');
    }
  };
  
  // Show authentication screens if not logged in
  if (!isLoggedIn) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center app-container">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6">
          {/* Logo */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-orange-500 mb-2">MHAZ</h1>
            <p className="text-gray-600 text-sm">Marin County Trail Alerts</p>
          </div>

          {/* Login Screen */}
          {authScreen === 'login' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email or Profile Name
                </label>
                <input
                  type="text"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="Enter email or profile name"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="Enter password"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>

              <button
                onClick={handleLogin}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Sign In
              </button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <button
                  onClick={handleForgotPassword}
                  className="text-sm text-orange-500 hover:text-orange-600 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Sign Up Link */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => setAuthScreen('sign-up')}
                    className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Forgot Password Screen */}
          {authScreen === 'forgot-password' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Reset Password</h2>
                <p className="text-sm text-gray-600">Enter your email address and we&apos;ll send you a link to reset your password.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="Enter your email address"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendPasswordReset()}
                />
              </div>

              <button
                onClick={handleSendPasswordReset}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Send Reset Link
              </button>

              {/* Back to Login */}
              <div className="text-center">
                <button
                  onClick={() => setAuthScreen('login')}
                  className="text-sm text-orange-500 hover:text-orange-600 transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* Sign Up Screen */}
          {authScreen === 'sign-up' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Create Account</h2>
                <p className="text-sm text-gray-600">Join the MHAZ community to report and view trail alerts.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={signUpUsername}
                  onChange={(e) => setSignUpUsername(e.target.value)}
                  className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="Choose a username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 mb-3"
                  placeholder="Create a password"
                />
                <input
                  type="password"
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="Confirm password"
                />
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={signUpLocation}
                  onChange={(e) => setSignUpLocation(e.target.value)}
                  className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="Enter your location"
                />
              </div>

              <button
                onClick={handleSignUp}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Create Account
              </button>

              {/* Back to Login */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    onClick={() => setAuthScreen('login')}
                    className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container h-screen bg-gray-50 flex flex-col relative">
      {/* Orange Header Bar */}
      <header className="fixed-header bg-orange-500 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">MHAZ</h1>
        </div>
        <div className="flex items-center gap-3">
          {viewMode === 'map' && (
            <button 
              onClick={handleStartAddingAlert}
              className="p-1 hover:bg-orange-600 rounded"
              disabled={isAddingAlert}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </button>
          )}
          <button 
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="p-1 hover:bg-orange-600 rounded relative"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Alert Type Toggles and View Toggle */}
      <div className="fixed-secondary-nav bg-white px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {(['Trail', 'LEO', 'Citation'] as AlertType[]).map((type) => {
              const isSelected = selectedAlertTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleAlertType(type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? type === 'Trail'
                        ? 'bg-orange-100 text-orange-800 border border-orange-300'
                        : type === 'LEO'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {type === 'Trail' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l10 20H2L12 2z"/>
                      <path d="M8 12l4-6 4 6H8z" fill="white" opacity="0.3"/>
                    </svg>
                  )}
                  {type === 'LEO' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    </svg>
                  )}
                  {type === 'Citation' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                  )}
                  {type}
                </button>
              );
            })}
          </div>
          
          {/* View Toggle - Show appropriate button based on current view */}
          {viewMode === 'map' ? (
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
              Feed
            </button>
          ) : (
            <button
              onClick={() => setViewMode('map')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM10 5.47l4 1.4v11.66l-4-1.4V5.47zm-5 .99l3-1.01v11.7l-3 1.01V6.46zm14 11.08l-3 1.01V6.86l3-1.01v11.69z"/>
              </svg>
              Map
            </button>
          )}
        </div>
      </div>

      {/* Content Area - Map or List */}
      <div className="main-content flex-1 flex flex-col min-h-0">
        {viewMode === 'map' ? (
          <div className="flex-1 relative">
          <Map
            ref={mapRef}
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''}
            initialViewState={{
              longitude: mapCenter.longitude,
              latitude: mapCenter.latitude,
              zoom: mapCenter.zoom
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/outdoors-v12"
            onClick={handleMapClick}
          >
            {filteredAlerts.map((alert) => (
              <Marker
                key={alert.id}
                longitude={alert.longitude}
                latitude={alert.latitude}
              >
                <button
                  onClick={(e) => {
                    if (!isAddingAlert) {
                      e.stopPropagation();
                      setSelectedMapAlert(alert);
                      setShowMapPopup(true);
                    }
                  }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md hover:scale-110 transition-transform cursor-pointer ${
                    alert.type === 'Trail' 
                      ? 'bg-orange-500 hover:bg-orange-600' 
                      : alert.type === 'LEO'
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </button>
              </Marker>
            ))}
            
            {/* New Alert Pin - Draggable */}
            {newAlertPin && (
              <Marker
                longitude={newAlertPin.longitude}
                latitude={newAlertPin.latitude}
                draggable={true}
                onDragEnd={(event) => {
                  setNewAlertPin({
                    longitude: event.lngLat.lng,
                    latitude: event.lngLat.lat
                  });
                }}
              >
                <div className="relative flex items-center justify-center cursor-move">
                  {/* Pin Shadow */}
                  <div className="absolute top-1 left-1 w-6 h-10 bg-black opacity-20 rounded-full blur-sm"></div>
                  
                  {/* Main Pin - Like the location icon */}
                  <div className="relative flex flex-col items-center">
                    <svg className="w-8 h-8 text-red-500 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                  
                  {/* Pulsing Animation for Better Visibility */}
                  <div className="absolute top-1 left-1 w-6 h-6 bg-red-500 rounded-full animate-pulse opacity-30"></div>
                </div>
              </Marker>
            )}
          </Map>
          
          {/* Alert Adding Instructions */}
          {isAddingAlert && !newAlertPin && (
            <div className="absolute top-4 left-4 right-4 bg-orange-500 text-white p-3 rounded-lg shadow-lg z-10">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <div className="text-sm">
                    <div className="font-medium">Tap the map to place your alert</div>
                    <div className="opacity-90">Choose the exact location of the incident</div>
                  </div>
                </div>
                <button
                  onClick={handleCancelAddingAlert}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 p-1 rounded transition-colors flex-shrink-0 text-gray-700"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Pin Adjustment Instructions */}
          {isAddingAlert && newAlertPin && !showLocationConfirm && (
            <div className="absolute top-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-10">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <svg className="w-5 h-5 flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <div className="text-sm">
                    <div className="font-medium">Drag pin to adjust location</div>
                    <div className="opacity-90">Tap map or button to confirm</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelAddingAlert}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 p-1 rounded transition-colors flex-shrink-0 text-gray-700"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowLocationConfirm(true)}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 px-3 py-1 rounded text-sm font-medium transition-colors flex-shrink-0 text-gray-700"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Map Popup */}
          {showMapPopup && selectedMapAlert && (
            <div className="absolute inset-x-4 bottom-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-10">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    selectedMapAlert.type === 'Trail' 
                      ? 'bg-orange-100' 
                      : selectedMapAlert.type === 'LEO'
                      ? 'bg-blue-100'
                      : 'bg-red-100'
                  }`}>
                    {selectedMapAlert.type === 'Trail' && (
                      <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 20.5c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        <path d="M19 20.5c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        <path d="M8.5 12.5l6-6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <path d="M14.5 6.5l4 4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <path d="M12 6.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5-.7 1.5-1.5 1.5-1.5-.7-1.5-1.5z"/>
                        <rect x="11" y="8" width="2" height="6" rx="1"/>
                      </svg>
                    )}
                    {selectedMapAlert.type === 'LEO' && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                      </svg>
                    )}
                    {selectedMapAlert.type === 'Citation' && (
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{selectedMapAlert.category}</h3>
                      {selectedMapAlert.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          selectedMapAlert.status === 'Active' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedMapAlert.status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <h4 className="font-medium text-gray-700 text-sm">{selectedMapAlert.location}</h4>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMapPopup(false);
                    setSelectedMapAlert(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700 ml-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-800 text-sm mb-3 line-clamp-2">
                {selectedMapAlert.description.length > 120 
                  ? selectedMapAlert.description.substring(0, 120) + '...' 
                  : selectedMapAlert.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <span>by {selectedMapAlert.reportedBy}</span>
                  <span className="mx-2">•</span>
                  <span>{getTimeAgo(selectedMapAlert.reportedAt)}</span>
                </div>
                <button
                  onClick={() => {
                    setExpandedAlert(selectedMapAlert);
                    setExpandedFromMap(true);
                    setShowMapPopup(false);
                    setSelectedMapAlert(null);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          )}
          </div>
        ) : (
          <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
          {filteredAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setExpandedAlert(alert);
                setExpandedFromMap(false);
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    alert.type === 'Trail' 
                      ? 'bg-orange-100' 
                      : alert.type === 'LEO'
                      ? 'bg-blue-100'
                      : 'bg-red-100'
                  }`}>
                    {alert.type === 'Trail' && (
                      <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 20.5c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        <path d="M19 20.5c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        <path d="M8.5 12.5l6-6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <path d="M14.5 6.5l4 4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <path d="M12 6.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5-.7 1.5-1.5 1.5-1.5-.7-1.5-1.5z"/>
                        <rect x="11" y="8" width="2" height="6" rx="1"/>
                      </svg>
                    )}
                    {alert.type === 'LEO' && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                      </svg>
                    )}
                    {alert.type === 'Citation' && (
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm">{alert.category}</h3>
                      {alert.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          alert.status === 'Active' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {alert.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{getTimeAgo(alert.reportedAt)}</span>
              </div>
              
              <div className="flex items-center gap-1 mb-2">
                <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <h4 className="font-bold text-gray-700 text-sm">{alert.location}</h4>
              </div>
              
              <p className="text-gray-800 text-sm mb-3 overflow-hidden text-ellipsis" style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>{alert.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>by {alert.reportedBy}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowOnMap(alert);
                  }}
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-medium flex items-center gap-1 text-xs px-2 py-1 rounded"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM10 5.47l4 1.4v11.66l-4-1.4V5.47zm-5 .99l3-1.01v11.7l-3 1.01V6.46zm14 11.08l-3 1.01V6.86l3-1.01v11.69z"/>
                  </svg>
                  Show on Map
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation - Static */}
      <nav className="fixed-footer bg-gray-100 border-t border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex justify-center relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="p-2 hover:bg-gray-200 rounded"
          >
            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* User Menu - Floating Centered */}
      {showUserMenu && (
        <div ref={userMenuRef} className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1055] bg-white rounded-lg shadow-xl border border-gray-200 w-64">
            <div className="p-4 space-y-2">
              <div className="text-center pb-3 border-b border-gray-200">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">{userProfile.name}</h3>
                <p className="text-sm text-gray-500">{userProfile.location}</p>
              </div>
              
              <button
                onClick={() => openAccountModal('profile')}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
                Account Settings
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
                Logout
              </button>
            </div>
        </div>
      )}

      {/* Expanded Alert View - Full Modal */}
      {expandedAlert && (
        <div className="fixed inset-0 bg-white z-50 modal-container app-container">
          {/* Header */}
          <header className="bg-orange-500 text-white px-4 py-3 flex items-center justify-between">
            <button 
              onClick={() => {
                setExpandedAlert(null);
                setExpandedFromMap(false);
              }} 
              className="p-2 hover:bg-orange-600 rounded-full transition-colors flex items-center justify-center min-w-[40px] min-h-[40px]"
              title="Back to map"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
            <h1 className="text-lg font-bold">Alert Details</h1>
            <div className="w-6"></div>
          </header>

          {/* Content */}
          <div className="modal-content p-4">
            <div className="space-y-4">
              {/* Alert Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    expandedAlert.type === 'Trail' 
                      ? 'bg-orange-100' 
                      : expandedAlert.type === 'LEO'
                      ? 'bg-blue-100'
                      : 'bg-red-100'
                  }`}>
                    {expandedAlert.type === 'Trail' && (
                      <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 20.5c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        <path d="M19 20.5c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        <path d="M8.5 12.5l6-6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <path d="M14.5 6.5l4 4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <path d="M12 6.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5-.7 1.5-1.5 1.5-1.5-.7-1.5-1.5z"/>
                        <rect x="11" y="8" width="2" height="6" rx="1"/>
                      </svg>
                    )}
                    {expandedAlert.type === 'LEO' && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                      </svg>
                    )}
                    {expandedAlert.type === 'Citation' && (
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-lg">{expandedAlert.category}</h3>
                      {expandedAlert.status && (
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          expandedAlert.status === 'Active' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {expandedAlert.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <h4 className="font-semibold text-gray-700">{expandedAlert.location}</h4>
              </div>

              {/* Issuing Agency - Only for Citation alerts */}
              {expandedAlert.type === 'Citation' && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                  <span className="font-medium text-gray-700">Issued by: {expandedAlert.reportedBy}</span>
                </div>
              )}

              {/* Photos - Only for Trail alerts and up to 2 */}
              {expandedAlert.type === 'Trail' && expandedAlert.photos && expandedAlert.photos.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-semibold text-gray-700">Photos</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {expandedAlert.photos.slice(0, 2).map((photo, index) => (
                      <div key={index} className="relative cursor-pointer" onClick={() => setExpandedPhoto(photo)}>
                        <img 
                          src={photo} 
                          alt={`Alert photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg bg-gray-200 hover:opacity-90 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-lg">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-4.18C14.4 2.84 13.3 2 12 2c-1.3 0-2.4.84-2.82 2H5c-.14 0-.27.01-.4.04-.39.08-.74.28-1.01.55-.18.18-.33.4-.43.64-.1.23-.16.49-.16.77v14c0 .27.06.54.16.78.1.23.25.45.43.64.27.27.62.47 1.01.55.13.03.26.04.4.04h14c.27 0 .54-.06.78-.16.23-.1.45-.25.64-.43.27-.27.47-.62.55-1.01.03-.13.04-.26.04-.4V6c0-.27-.06-.54-.16-.78-.1-.23-.25-.45-.43-.64-.27-.27-.62-.47-1.01-.55-.13-.03-.26-.04-.4-.04zM12 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 16H5V6h14v14z"/>
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <h5 className="font-semibold text-gray-700">Description</h5>
                <p className="text-gray-800 leading-relaxed">{expandedAlert.description}</p>
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium">Reported by:</span>
                  <span>{expandedAlert.reportedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Reported:</span>
                  <span>{getTimeAgo(expandedAlert.reportedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Type:</span>
                  <span>{expandedAlert.type}</span>
                </div>
              </div>

              {/* Show in Map View Button - Only when coming from feed view */}
              {!expandedFromMap && (
                <button
                  onClick={() => {
                    handleShowOnMap(expandedAlert);
                    setExpandedAlert(null);
                    setExpandedFromMap(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM10 5.47l4 1.4v11.66l-4-1.4V5.47zm-5 .99l3-1.01v11.7l-3 1.01V6.46zm14 11.08l-3 1.01V6.86l3-1.01v11.69z"/>
                  </svg>
                  Show in Map View
                </button>
              )}

              {/* Resolve Button - Only for Trail Alerts */}
              {expandedAlert.type === 'Trail' && expandedAlert.status === 'Active' && (
                <button
                  onClick={() => setShowResolveDialog(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Mark as Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolve Confirmation Dialog */}
      {showResolveDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-[1200] p-4 pointer-events-none">
          <div className="pointer-events-auto bg-white rounded-lg shadow-xl border p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Resolution</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to mark this trail alert as resolved? This action confirms that the issue has been taken care of.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResolveDialog(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveAlert}
                disabled={isResolvingAlert}
                className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  isResolvingAlert 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isResolvingAlert && (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {isResolvingAlert ? 'Resolving...' : 'Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Filter Dropdown */}
      {showDateDropdown && (
        <div ref={dropdownRef} className="absolute top-12 right-4 z-[1050] bg-white rounded-lg shadow-lg border border-gray-200 w-48">
          <div className="p-2 space-y-1">
            {[
              { value: 'today', label: 'Today' },
              { value: 'last 7d', label: 'Last 7d' },
              { value: 'last 14d', label: 'Last 14d' },
              { value: 'last 30d', label: 'Last 30d' }
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  setDateFilterPreset(preset.value as DateFilterPreset);
                  setCustomDateRange(null);
                  setShowDateDropdown(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  dateFilterPreset === preset.value && !customDateRange
                    ? 'bg-orange-50 text-orange-800'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
            <hr className="my-2 border-gray-200" />
            <button
              onClick={openCustomDateModal}
              className="w-full text-left px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Custom
            </button>
          </div>
        </div>
      )}

      {/* Custom Date Range Modal */}
      {showCustomDateModal && (
        <div ref={customModalRef} className="absolute top-16 right-4 z-[1060] bg-white rounded-lg shadow-xl border border-gray-200 w-80">
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Custom Date Range</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={customDateRange?.start.toISOString().split("T")[0] || ''}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    const newStart = new Date(e.target.value);
                    if (customDateRange) {
                      const endDate = newStart > customDateRange.end ? newStart : customDateRange.end;
                      setCustomDateRange({ start: newStart, end: endDate });
                    } else {
                      setCustomDateRange({ start: newStart, end: new Date() });
                    }
                  }}
                  className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={customDateRange?.end.toISOString().split("T")[0] || ''}
                  min={customDateRange?.start.toISOString().split("T")[0] || ''}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    const newEnd = new Date(e.target.value);
                    newEnd.setHours(23, 59, 59, 999);
                    if (customDateRange) {
                      setCustomDateRange({ start: customDateRange.start, end: newEnd });
                    }
                  }}
                  className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCustomDateModal(false);
                  setCustomDateRange(null);
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDateFilterPreset('custom');
                  setShowCustomDateModal(false);
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal - Full Screen with X close */}
      {expandedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[70] p-4">
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setExpandedPhoto(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all z-10"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
            <img 
              src={expandedPhoto} 
              alt="Expanded alert photo"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Location Confirmation Dialog */}
      {showLocationConfirm && newAlertPin && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 pointer-events-none">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-300 p-6 w-full max-w-sm pointer-events-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Alert Location</h3>
            <p className="text-gray-600 mb-4">
              Is this the correct location for your alert?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-6 text-sm">
              <div className="font-medium text-gray-700 mb-1">Coordinates:</div>
              <div className="text-gray-600">
                Lat: {newAlertPin.latitude.toFixed(6)}<br/>
                Lng: {newAlertPin.longitude.toFixed(6)}
              </div>
            </div>
            
            {/* Marin County validation */}
            {!isWithinMarinCounty(newAlertPin.longitude, newAlertPin.latitude) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                  </svg>
                  <span className="text-sm font-medium text-red-800">Invalid Location</span>
                </div>
                <p className="text-sm text-red-700">
                  This location is outside Marin County. Please select a location within Marin County to create your alert.
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelAddingAlert}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLocation}
                disabled={!isWithinMarinCounty(newAlertPin.longitude, newAlertPin.latitude)}
                className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors ${
                  isWithinMarinCounty(newAlertPin.longitude, newAlertPin.latitude)
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Form Modal */}
      {showAlertForm && (
        <div className="fixed inset-0 bg-white z-50 modal-container app-container">
          {/* Header */}
          <header className="bg-orange-500 text-white px-4 py-3 flex items-center justify-between">
            <button 
              onClick={handleCancelAddingAlert}
              className="p-2 hover:bg-orange-600 rounded-full transition-colors flex items-center justify-center min-w-[40px] min-h-[40px]"
              title="Cancel and go back"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
            <h1 className="text-lg font-bold">New Alert</h1>
            <div className="w-6"></div>
          </header>

          {/* Content */}
          <div className="modal-content p-4">
            <div className="space-y-4">
              {/* Alert Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type *</label>
                <div className="grid grid-cols-1 gap-2">
                  {(['Trail', 'LEO', 'Citation'] as AlertType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewAlertData(prev => ({ 
                        ...prev, 
                        type, 
                        category: '',
                        agency: '',
                        citationDate: '',
                        citationTime: ''
                      }))}
                      className={`p-3 text-left rounded-lg border transition-colors ${
                        newAlertData.type === type
                          ? type === 'Trail'
                            ? 'bg-orange-50 border-orange-300 text-orange-800'
                            : type === 'LEO'
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : 'bg-red-50 border-red-300 text-red-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          newAlertData.type === type
                            ? type === 'Trail'
                              ? 'bg-orange-100'
                              : type === 'LEO'
                              ? 'bg-blue-100'
                              : 'bg-red-100'
                            : 'bg-gray-100'
                        }`}>
                          {type === 'Trail' && (
                            <svg className={`w-4 h-4 ${newAlertData.type === type ? 'text-orange-600' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l10 20H2L12 2z"/>
                              <path d="M8 12l4-6 4 6H8z" fill="white" opacity="0.3"/>
                            </svg>
                          )}
                          {type === 'LEO' && (
                            <svg className={`w-4 h-4 ${newAlertData.type === type ? 'text-blue-600' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                            </svg>
                          )}
                          {type === 'Citation' && (
                            <svg className={`w-4 h-4 ${newAlertData.type === type ? 'text-red-600' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{type} Alert</div>
                          <div className="text-sm opacity-75">
                            {type === 'Trail' && 'Report trail conditions and hazards'}
                            {type === 'LEO' && 'Report law enforcement activity'}
                            {type === 'Citation' && 'Report citation incidents'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic form content based on alert type */}
              {newAlertData.type && (
                <div className="space-y-4">
                  {/* Trail Alert Form */}
                  {newAlertData.type === 'Trail' && (
                    <>
                      {/* Category Selection for Trail Alerts */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                        <select
                          value={newAlertData.category}
                          onChange={(e) => setNewAlertData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                        >
                          <option value="">Select type...</option>
                          <option value="Downed tree/object blocking trail">Downed tree/object blocking trail</option>
                          <option value="Maintenance/construction">Maintenance/construction</option>
                          <option value="Dangerous conditions">Dangerous conditions</option>
                          <option value="Wild animal">Wild animal</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* LEO Alert Form */}
                  {newAlertData.type === 'LEO' && (
                    <>
                      {/* Agency Selection for LEO Alerts */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Agency *</label>
                        <select
                          value={newAlertData.agency}
                          onChange={(e) => setNewAlertData(prev => ({ ...prev, agency: e.target.value, category: e.target.value }))}
                          className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Select agency...</option>
                          <option value="Sheriff">Sheriff</option>
                          <option value="Marin Water District">Marin Water District</option>
                          <option value="CA State Parks">CA State Parks</option>
                          <option value="National Park Service">National Park Service</option>
                          <option value="Marin Open Space">Marin Open Space</option>
                          <option value="Local PD">Local PD</option>
                          <option value="CHP">CHP</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Citation Alert Form */}
                  {newAlertData.type === 'Citation' && (
                    <>
                      {/* Agency Selection for Citation */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Agency *</label>
                        <select
                          value={newAlertData.agency}
                          onChange={(e) => setNewAlertData(prev => ({ ...prev, agency: e.target.value, category: 'Citation Issued' }))}
                          className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                        >
                          <option value="">Select agency...</option>
                          <option value="Sheriff">Sheriff</option>
                          <option value="Marin Water District">Marin Water District</option>
                          <option value="CA State Parks">CA State Parks</option>
                          <option value="National Park Service">National Park Service</option>
                          <option value="Marin Open Space">Marin Open Space</option>
                          <option value="Local PD">Local PD</option>
                          <option value="CHP">CHP</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Date and Time for Citation */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Date Issued *</label>
                          <input
                            type="date"
                            value={newAlertData.citationDate}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setNewAlertData(prev => ({ ...prev, citationDate: e.target.value }))}
                            className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Time Issued *</label>
                          <select
                            value={newAlertData.citationTime}
                            onChange={(e) => setNewAlertData(prev => ({ ...prev, citationTime: e.target.value }))}
                            className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                          >
                            <option value="">Select time...</option>
                            {Array.from({ length: 96 }, (_, i) => {
                              const hour = Math.floor(i / 4);
                              const minute = (i % 4) * 15;
                              const period = hour < 12 ? 'AM' : 'PM';
                              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                              const timeString = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
                              return (
                                <option key={i} value={timeString}>
                                  {timeString}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Common Fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trail or Location * <span className="text-gray-500">({newAlertData.location.length}/75)</span>
                    </label>
                    <input
                      type="text"
                      value={newAlertData.location}
                      onChange={(e) => {
                        if (e.target.value.length <= 75) {
                          setNewAlertData(prev => ({ ...prev, location: e.target.value }));
                        }
                      }}
                      className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                      placeholder="Enter trail or location name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description * <span className="text-gray-500">({newAlertData.description.length}/300)</span>
                    </label>
                    <textarea
                      value={newAlertData.description}
                      onChange={(e) => {
                        if (e.target.value.length <= 300) {
                          setNewAlertData(prev => ({ ...prev, description: e.target.value }));
                        }
                      }}
                      className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                      rows={4}
                      placeholder="Describe the alert in detail"
                    />
                  </div>

                  {/* Photo Upload - Only for Trail alerts */}
                  {newAlertData.type === 'Trail' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Photos (up to 2)
                      </label>
                      
                      {/* Hidden file input */}
                      <input
                        type="file"
                        ref={photoInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/png,image/jpeg,image/jpg"
                        multiple
                        className="hidden"
                      />
                      
                      {/* Upload area */}
                      {newAlertData.photos.length < 2 && (
                        <div 
                          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-orange-400 transition-colors"
                          onClick={() => photoInputRef.current?.click()}
                        >
                          <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                          </svg>
                          <p className="text-sm text-gray-600">Click to upload photos</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each</p>
                        </div>
                      )}
                      
                      {/* Photo previews */}
                      {newAlertData.photos.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {newAlertData.photos.map((photo, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={photo} 
                                alt={`Photo ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg bg-gray-200"
                              />
                              <button
                                onClick={() => handleRemovePhoto(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                type="button"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer p-4">
            <div className="flex gap-3">
              <button
                onClick={handleCancelAddingAlert}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAlert}
                disabled={!newAlertData.type || !newAlertData.location || !newAlertData.description || 
                         (newAlertData.type === 'Trail' && !newAlertData.category) ||
                         (newAlertData.type === 'LEO' && !newAlertData.agency) ||
                         (newAlertData.type === 'Citation' && (!newAlertData.agency || !newAlertData.citationDate || !newAlertData.citationTime))}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Submit Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {showAccountModal && (
        <div className="fixed top-8 left-4 right-4 bottom-8 z-[60] bg-white rounded-lg shadow-xl border border-gray-200 app-container flex flex-col">
          {/* Header */}
          <header className="bg-orange-500 text-white px-4 py-3 flex items-center justify-between rounded-t-lg">
            <button onClick={handleCancelAccount} className="p-2 hover:bg-orange-600 rounded-full transition-colors flex items-center justify-center min-w-[40px] min-h-[40px]" title="Close account settings">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
            <h1 className="text-lg font-bold">Account Settings</h1>
            <div className="w-6"></div>
          </header>

          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex">
              <button
                onClick={() => setActiveAccountTab('profile')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeAccountTab === 'profile'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveAccountTab('billing')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeAccountTab === 'billing'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Billing
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="modal-content p-4">
            {activeAccountTab === 'profile' ? (
              <div className="space-y-4">
                <div className="text-center pb-4">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-10 h-10 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Name</label>
                    <input
                      type="text"
                      value={tempProfile.name}
                      onChange={(e) => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                      placeholder="Enter your profile name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value="••••••••@••••••.com"
                      disabled
                      className="w-full p-3 text-sm text-gray-400 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email is hidden for privacy</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={tempProfile.location}
                      onChange={(e) => setTempProfile(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                      placeholder="Enter your location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Change Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 mb-3"
                      placeholder="Enter new password"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                      placeholder="Confirm new password"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCancelAccount}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Save Profile
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                    <input
                      type="text"
                      value={tempBilling.cardNumber}
                      onChange={(e) => setTempBilling(prev => ({ ...prev, cardNumber: e.target.value }))}
                      className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                      placeholder="**** **** **** ****"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                      <input
                        type="text"
                        value={tempBilling.expiryDate}
                        onChange={(e) => setTempBilling(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <input
                        type="text"
                        placeholder="***"
                        className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                    <input
                      type="text"
                      value={tempBilling.cardholderName}
                      onChange={(e) => setTempBilling(prev => ({ ...prev, cardholderName: e.target.value }))}
                      className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                      placeholder="Enter cardholder name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Billing Address</label>
                    <textarea
                      value={tempBilling.billingAddress}
                      onChange={(e) => setTempBilling(prev => ({ ...prev, billingAddress: e.target.value }))}
                      className="w-full p-3 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                      rows={3}
                      placeholder="Enter billing address"
                    />
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <span className="text-sm font-medium text-blue-800">Premium Plan</span>
                    </div>
                    <p className="text-sm text-blue-600">$9.99/month • Next billing: Jan 18, 2025</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCancelAccount}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBilling}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Save Billing
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}