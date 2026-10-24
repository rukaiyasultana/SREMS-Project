// Person 1: Main Application, Navigation & Property Management Integration
import { useEffect, useState } from 'react'
import BookingManagement from './BookingManagement'
import AppointmentManagement from './AppointmentManagement'
import PaymentManagement from './PaymentManagement'
import ReportsManagement from './ReportsManagement'
import {
  Building2,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  LogOut,

  Users,
  CalendarCheck,
  CreditCard,
  BarChart3,
  LoaderCircle,
  UserPlus,
  UserRound,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  MapPin,
  Ruler,
  DollarSign,
  RefreshCw,
  LayoutDashboard,
  Building,
  ImagePlus,
  Images,
  Eye as ViewIcon,
  Upload,

  FileText,
  KeyRound,
  ChevronRight,
} from 'lucide-react'

const SERVER_URL = 'http://127.0.0.1:8000'
const API_URL = `${SERVER_URL}/api`

const EMPTY_PROPERTY = {
  property_code: '',
  property_name: '',
  project_name: '',
  property_type: 'apartment',
  location: '',
  size_sqft: '',
  price: '',
  status: 'available',
  description: '',
}

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'flat', label: 'Flat' },
  { value: 'house', label: 'House' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'office', label: 'Office' },
  { value: 'shop', label: 'Shop' },
  { value: 'other', label: 'Other' },
]

const PROPERTY_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
  { value: 'rented', label: 'Rented' },
]

const MODULES = [
  {
    title: 'Properties',
    description: 'Manage property records, images, pricing and availability.',
    icon: Building2,
    page: 'properties',
    color: 'blue',
  },
  {
    title: 'User Management',
    description: 'Create accounts and manage system access.',
    icon: Users,
    page: 'users',
    color: 'violet',
    adminOnly: true,
  },
  {
    title: 'Appointments',
    description: 'Appointment management module.',
    icon: CalendarCheck,
    page: 'appointments',
    color: 'emerald',
  },
  {
    title: 'Payments',
    description: 'Payment records and transaction management.',
    icon: CreditCard,
    page: 'payments',
    color: 'amber',
  },
  {
    title: 'Reports',
    description: 'Property statistics and management reports.',
    icon: BarChart3,
    page: 'reports',
    color: 'rose',
  },
]

function getToken() {
  return (
    localStorage.getItem('srems_token') ||
    sessionStorage.getItem('srems_token') ||
    ''
  )
}

function getSavedUser() {
  try {
    const raw =
      localStorage.getItem('srems_user') ||
      sessionStorage.getItem('srems_user')

    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function getUserRole(user) {
  return String(user?.role?.name || user?.role || user?.user_role || '')
    .toLowerCase()
    .replace(/\s+/g, '')
}

function isManager(user) {
  return ['admin', 'authority'].includes(getUserRole(user))
}

function formatLabel(value) {
  if (!value) return 'Ã¢â‚¬â€'

  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatMoney(value) {
  const amount = Number(value || 0)

  return `\u09F3 ${amount.toLocaleString('en-BD', {
    maximumFractionDigits: 2,
  })}`
}

function getImageUrl(image) {
  const raw =
    typeof image === 'string'
      ? image
      : image?.url ||
        image?.image_url ||
        image?.image_path ||
        image?.path ||
        image?.filename

  if (!raw) return ''

  if (/^https?:\/\//i.test(raw)) return raw

  const normalized = String(raw).replace(/^\/+/, '')

  if (normalized.startsWith('storage/')) {
    return `${SERVER_URL}/${normalized}`
  }

  return `${SERVER_URL}/storage/${normalized}`
}

function getPropertyImages(property) {
  if (!property) return []

  const images = property.images || property.property_images || []

  return Array.isArray(images) ? images : []
}

function getErrorMessage(data, fallback = 'Something went wrong.') {
  if (data?.message) return data.message

  if (data?.errors) {
    const firstError = Object.values(data.errors).flat()[0]
    if (firstError) return String(firstError)
  }

  return fallback
}

async function apiRequest(path, options = {}) {
  const token = getToken()
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData

  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData && options.body
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (options.responseType === 'blob') {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      if (response.status === 401) {
        throw new Error(
          getErrorMessage(errorData, 'Your session has expired. Please log in again.')
        )
      }
      throw new Error(getErrorMessage(errorData))
    }
    return await response.blob()
  }
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        getErrorMessage(data, 'Your session has expired. Please log in again.')
      )
    }

    throw new Error(getErrorMessage(data))
  }

  return data
}

function saveSession(token, user, rememberMe) {
  localStorage.removeItem('srems_token')
  localStorage.removeItem('srems_user')
  sessionStorage.removeItem('srems_token')
  sessionStorage.removeItem('srems_user')

  const storage = rememberMe ? localStorage : sessionStorage

  if (token) storage.setItem('srems_token', token)
  if (user) storage.setItem('srems_user', JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem('srems_token')
  localStorage.removeItem('srems_user')
  sessionStorage.removeItem('srems_token')
  sessionStorage.removeItem('srems_user')
}

function getResponseUser(data) {
  return data?.user || data?.data?.user || data?.data || null
}

function getResponseToken(data) {
  return (
    data?.token ||
    data?.access_token ||
    data?.data?.token ||
    data?.data?.access_token ||
    ''
  )
}

function StatusBadge({ status }) {
  const normalized = String(status || '').toLowerCase()

  const colors = {
    available: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    reserved: 'bg-amber-50 text-amber-700 ring-amber-200',
    sold: 'bg-rose-50 text-rose-700 ring-rose-200',
    rented: 'bg-blue-50 text-blue-700 ring-blue-200',
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
        colors[normalized] || 'bg-slate-100 text-slate-700 ring-slate-200'
      }`}
    >
      {formatLabel(status)}
    </span>
  )
}

function MessageBox({ message, type = 'success', onClose }) {
  if (!message) return null

  const success = type === 'success'
  const Icon = success ? CheckCircle2 : AlertCircle

  return (
    <div
      className={`mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${
        success
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-rose-200 bg-rose-50 text-rose-800'
      }`}
      role="status"
    >
      <Icon size={19} className="mt-0.5 shrink-0" />
      <p className="flex-1">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 hover:bg-black/5"
          aria-label="Dismiss message"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

function Field({ label, icon: Icon, children, required = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>

      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}

        {children}
      </div>
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'

const iconInputClass = `${inputClass} pl-10`

function App() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authUser, setAuthUser] = useState(() => getSavedUser())
  const [activePage, setActivePage] = useState('dashboard')

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
  })
  const [creatingUser, setCreatingUser] = useState(false)
  const [userMessage, setUserMessage] = useState('')
  const [userError, setUserError] = useState('')
  const [createdUser, setCreatedUser] = useState(null)
  const [showCreatePassword, setShowCreatePassword] = useState(false)

  const [properties, setProperties] = useState([])
  const [propertiesLoading, setPropertiesLoading] = useState(false)
  const [propertyError, setPropertyError] = useState('')
  const [propertyMessage, setPropertyMessage] = useState('')
  const [propertySearch, setPropertySearch] = useState('')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('')
  const [propertyStatusFilter, setPropertyStatusFilter] = useState('')
  const [propertyPagination, setPropertyPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null,
    to: null,
  })
  const [propertyForm, setPropertyForm] = useState(EMPTY_PROPERTY)
  const [editingProperty, setEditingProperty] = useState(null)
  const [savingProperty, setSavingProperty] = useState(false)
  const [showPropertyForm, setShowPropertyForm] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [filePreviews, setFilePreviews] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)

  const [viewingProperty, setViewingProperty] = useState(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingMessage, setBookingMessage] = useState('')
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState(null)
  const [expandedImage, setExpandedImage] = useState('')

  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [appointmentMessage, setAppointmentMessage] = useState('')
  const [appointmentSubmitting, setAppointmentSubmitting] = useState(false)
  const [appointmentError, setAppointmentError] = useState('')
  const [appointmentSuccess, setAppointmentSuccess] = useState('')

  const userRole = getUserRole(authUser)
  const canManageProperties = isManager(authUser)
  const canManageUsers = isManager(authUser)
  const isAdmin = userRole === 'admin'

  useEffect(() => {
    if (!getToken() || !authUser) return

    apiRequest('/user')
      .then((data) => {
        const user = getResponseUser(data) || authUser
        setAuthUser(user)

        const storage = localStorage.getItem('srems_token')
          ? localStorage
          : sessionStorage

        storage.setItem('srems_user', JSON.stringify(user))
      })
      .catch((err) => {
        console.error('Session verification:', err.message)
      })
  // Session verification intentionally runs once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (authUser && getToken()) {
      loadProperties()
    }
  // Property loading is intentionally triggered by authentication changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser])

  useEffect(() => {
    const previews = selectedFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }))

    // Keep previews synchronized with the selected image files.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilePreviews(previews)

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [selectedFiles])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const token = getResponseToken(data)
      let user = getResponseUser(data)

      if (!user && token) {
        const previousToken = getToken()
        saveSession(token, null, rememberMe)

        try {
          const userData = await apiRequest('/user')
          user = getResponseUser(userData)
        } finally {
          if (!user && !previousToken) clearSession()
        }
      }

      if (!token) {
        throw new Error(
          'Login response did not include an access token. Please check the backend login API.'
        )
      }

      if (!user) {
        throw new Error(
          'Login succeeded but user details were not returned. Please check the backend /api/user endpoint.'
        )
      }

      saveSession(token, user, rememberMe)
      setAuthUser(user)
      setActivePage('dashboard')
      setPassword('')
    } catch (err) {
      clearSession()
      setError(err.message || 'Unable to log in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      if (getToken()) {
        await apiRequest('/logout', { method: 'POST' })
      }
    } catch (err) {
      console.warn('Logout API:', err.message)
    } finally {
      clearSession()
      setAuthUser(null)
      setActivePage('dashboard')
      setProperties([])
      setViewingProperty(null)
      setShowPropertyForm(false)
    }
  }

  async function handleCreateUser(event) {
    event.preventDefault()
    setUserMessage('')
    setUserError('')
    setCreatedUser(null)

    if (!canManageUsers) {
      setUserError('Only Admin or Authority can create user accounts.')
      return
    }

    setCreatingUser(true)

    try {
      const data = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(userForm),
      })

      setCreatedUser(data?.user || data?.data || null)
      setUserMessage(data?.message || 'User account created successfully.')

      setUserForm({
        name: '',
        email: '',
        password: '',
        role: isAdmin ? 'staff' : 'staff',
      })
    } catch (err) {
      setUserError(err.message || 'Unable to create user account.')
    } finally {
      setCreatingUser(false)
    }
  }

  async function loadProperties(
    search = propertySearch,
    type = propertyTypeFilter,
    status = propertyStatusFilter,
    page = 1
  ) {
    setPropertiesLoading(true)
    setPropertyError('')

    try {
      const params = new URLSearchParams()

      if (search.trim()) params.set('search', search.trim())
      if (type) params.set('property_type', type)
      if (status) params.set('status', status)
      params.set('page', String(page))

      const query = params.toString()
      const response = await apiRequest(
        `/properties${query ? `?${query}` : ''}`
      )

      const pagination =
        response?.current_page
          ? response
          : response?.data?.current_page
            ? response.data
            : null

      const list =
        pagination?.data ||
        response?.data?.data ||
        response?.data ||
        response?.properties ||
        response?.results ||
        []

      setProperties(Array.isArray(list) ? list : [])

      if (pagination) {
        setPropertyPagination({
          current_page: Number(pagination.current_page || 1),
          last_page: Number(pagination.last_page || 1),
          per_page: Number(pagination.per_page || 10),
          total: Number(pagination.total || 0),
          from: pagination.from ?? null,
          to: pagination.to ?? null,
        })
      } else {
        setPropertyPagination({
          current_page: 1,
          last_page: 1,
          per_page: Array.isArray(list) ? list.length || 10 : 10,
          total: Array.isArray(list) ? list.length : 0,
          from: Array.isArray(list) && list.length ? 1 : null,
          to: Array.isArray(list) && list.length ? list.length : null,
        })
      }
    } catch (err) {
      setPropertyError(err.message || 'Unable to load properties.')
    } finally {
      setPropertiesLoading(false)
    }
  }

  function resetPropertyForm() {
    setPropertyForm(EMPTY_PROPERTY)
    setEditingProperty(null)
    setSelectedFiles([])
    setShowPropertyForm(false)
  }

  function startNewProperty() {
    if (!canManageProperties) {
      setPropertyError('Only Admin or Authority can manage properties.')
      return
    }

    setPropertyError('')
    setPropertyMessage('')
    setPropertyForm(EMPTY_PROPERTY)
    setEditingProperty(null)
    setSelectedFiles([])
    setShowPropertyForm(true)
  }

  function startEditingProperty(property) {
    if (!canManageProperties) return

    setPropertyError('')
    setPropertyMessage('')
    setEditingProperty(property)

    setPropertyForm({
      property_code: property.property_code || '',
      property_name: property.property_name || '',
      project_name: property.project_name || '',
      property_type: String(property.property_type || 'apartment').toLowerCase(),
      location: property.location || '',
      size_sqft: property.size_sqft ?? '',
      price: property.price ?? '',
      status: String(property.status || 'available').toLowerCase(),
      description: property.description || '',
    })

    setSelectedFiles([])
    setShowPropertyForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function uploadPropertyImages(propertyId, files) {
    if (!files.length) return

    const formData = new FormData()

    files.forEach((file) => {
      formData.append('images[]', file)
    })

    setUploadingImages(true)

    try {
      await apiRequest(`/properties/${propertyId}/images`, {
        method: 'POST',
        body: formData,
      })
    } finally {
      setUploadingImages(false)
    }
  }

  async function handleSaveProperty(event) {
    event.preventDefault()
    setPropertyError('')
    setPropertyMessage('')

    if (!canManageProperties) {
      setPropertyError('Only Admin or Authority can manage properties.')
      return
    }

    setSavingProperty(true)

    try {
      const payload = {
        ...propertyForm,
        size_sqft:
          propertyForm.size_sqft === '' ? null : Number(propertyForm.size_sqft),
        price: propertyForm.price === '' ? null : Number(propertyForm.price),
      }

      const isEditing = Boolean(editingProperty)
      const path = isEditing
        ? `/properties/${editingProperty.id}`
        : '/properties'

      const data = await apiRequest(path, {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })

      const savedProperty =
        data?.property ||
        data?.data?.property ||
        (data?.data && !Array.isArray(data.data) ? data.data : null) ||
        (data?.id ? data : null) ||
        editingProperty

      const propertyId = savedProperty?.id || editingProperty?.id

      if (selectedFiles.length && propertyId) {
        try {
          await uploadPropertyImages(propertyId, selectedFiles)
        } catch (imageErr) {
          setPropertyMessage(
            `Property saved, but image upload failed: ${imageErr.message}`
          )
          await loadProperties()
          resetPropertyForm()
          return
        }
      } else if (selectedFiles.length && !propertyId) {
        setPropertyMessage(
          'Property saved, but its ID was not returned. Please edit the property and upload images again.'
        )
        await loadProperties()
        resetPropertyForm()
        return
      }

      setPropertyMessage(
        data?.message ||
          (isEditing
            ? 'Property updated successfully.'
            : 'Property created successfully.')
      )

      resetPropertyForm()
      await loadProperties()
    } catch (err) {
      setPropertyError(err.message || 'Unable to save property.')
    } finally {
      setSavingProperty(false)
    }
  }

  async function handleDeleteProperty(property) {
    if (!canManageProperties) return

    const confirmed = window.confirm(
      `Are you sure you want to delete "${property.property_name}"? This action cannot be undone.`
    )

    if (!confirmed) return

    setPropertyError('')
    setPropertyMessage('')

    try {
      await apiRequest(`/properties/${property.id}`, {
        method: 'DELETE',
      })

      setPropertyMessage('Property deleted successfully.')

      if (viewingProperty?.id === property.id) {
        setViewingProperty(null)
      }

      await loadProperties()
    } catch (err) {
      setPropertyError(err.message || 'Unable to delete property.')
    }
  }

  async function handleSubmitBooking(event) {
    event.preventDefault()
    setBookingError('')
    setBookingSuccess('')

    if (getUserRole(authUser) !== 'user') {
      setBookingError('Only customer accounts can submit booking requests.')
      return
    }

    if (
      !viewingProperty ||
      String(viewingProperty.status).toLowerCase() !== 'available'
    ) {
      setBookingError('This property is no longer available for booking.')
      return
    }

    setBookingSubmitting(true)

    try {
      const result = await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          property_id: viewingProperty.id,
          requested_date: bookingDate || null,
          message: bookingMessage.trim() || null,
        }),
      })

      setBookingSuccess(
        result?.message ||
        'Booking request submitted successfully. Please wait for Admin approval.'
      )
      setBookingDate('')
      setBookingMessage('')
    } catch (err) {
      setBookingError(err.message || 'Unable to submit the booking request.')
    } finally {
      setBookingSubmitting(false)
    }
  }
  async function handleSubmitAppointment(event) {
    event.preventDefault()
    setAppointmentError('')
    setAppointmentSuccess('')

    if (getUserRole(authUser) !== 'user') {
      setAppointmentError('Only customer accounts can request appointments.')
      return
    }

    if (!viewingProperty?.id) {
      setAppointmentError('Please open a property before requesting an appointment.')
      return
    }

    if (!appointmentDate || !appointmentTime) {
      setAppointmentError('Please select an appointment date and time.')
      return
    }

    setAppointmentSubmitting(true)

    try {
      const result = await apiRequest('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          property_id: viewingProperty.id,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          message: appointmentMessage.trim() || null,
        }),
      })

      setAppointmentSuccess(
        result?.message ||
        'Appointment request submitted. Please wait for Admin or Authority review.'
      )
      setAppointmentDate('')
      setAppointmentTime('')
      setAppointmentMessage('')
    } catch (err) {
      setAppointmentError(err.message || 'Unable to submit the appointment request.')
    } finally {
      setAppointmentSubmitting(false)
    }
  }
  async function handleViewProperty(property) {
    setViewingProperty(property)
    setLoadingDetails(true)
    setPropertyError('')
    setExpandedImage('')

    try {
      const data = await apiRequest(`/properties/${property.id}`)
      const detailedProperty =
        data?.property ||
        data?.data?.property ||
        data?.data ||
        property

      setViewingProperty(detailedProperty)
    } catch (err) {
      setViewingProperty(property)
      console.warn('Property details:', err.message)
    } finally {
      setLoadingDetails(false)
    }
  }

  async function handleDeleteImage(image) {
    if (!viewingProperty || !canManageProperties || !image?.id) return

    const confirmed = window.confirm('Delete this property image?')
    if (!confirmed) return

    setDeletingImageId(image.id)

    try {
      await apiRequest(
        `/properties/${viewingProperty.id}/images/${image.id}`,
        { method: 'DELETE' }
      )

      const updatedImages = getPropertyImages(viewingProperty).filter(
        (item) => item.id !== image.id
      )

      setViewingProperty({
        ...viewingProperty,
        images: updatedImages,
        property_images: updatedImages,
      })

      setPropertyMessage('Image deleted successfully.')
      await loadProperties()
    } catch (err) {
      setPropertyError(err.message || 'Unable to delete image.')
    } finally {
      setDeletingImageId(null)
    }
  }

  if (!authUser || !getToken()) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="grid min-h-screen lg:grid-cols-2">
          <section className="relative hidden overflow-hidden bg-linear-to-br from-slate-950 via-blue-950 to-blue-800 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                <Building2 size={27} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wide">SREMS</h1>
                <p className="text-xs text-blue-200">
                  Smart Real Estate Management
                </p>
              </div>
            </div>

            <div className="relative z-10 max-w-xl">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-blue-100">
                <ShieldCheck size={15} />
                SECURE MANAGEMENT PORTAL
              </span>

              <h2 className="text-4xl font-bold leading-tight xl:text-5xl">
                Manage properties.
                <br />
                Build trust.
                <br />
                Work smarter.
              </h2>

              <p className="mt-6 max-w-md text-base leading-7 text-blue-100/80">
                One centralized platform for property records, images,
                availability, user access and real estate operations.
              </p>

              <div className="mt-9 grid grid-cols-2 gap-3">
                {[
                  'Property management',
                  'Secure user access',
                  'Image galleries',
                  'Centralized records',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-blue-50"
                  >
                    <CheckCircle2 size={16} className="text-emerald-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <p className="relative z-10 text-xs text-blue-200/70">
              SREMS Ã‚Â· Smart Real Estate Management System
            </p>
          </section>

          <section className="flex items-center justify-center px-5 py-10 sm:px-10">
            <div className="w-full max-w-md">
              <div className="mb-9 flex items-center gap-3 lg:hidden">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white">
                  <Building2 size={26} />
                </div>
                <div>
                  <h1 className="text-xl font-bold">SREMS</h1>
                  <p className="text-xs text-slate-500">
                    Smart Real Estate Management
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                  Welcome back
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Sign in to your account
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Enter your authorized account credentials to access the
                  management dashboard.
                </p>
              </div>

              <MessageBox message={error} type="error" onClose={() => setError('')} />

              <form onSubmit={handleSubmit} className="space-y-5">
                <Field label="Email address" icon={Mail} required>
                  <input
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className={iconInputClass}
                  />
                </Field>

                <Field label="Password" icon={LockKeyhole} required>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className={`${iconInputClass} pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </Field>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-blue-700"
                  />
                  Remember me on this device
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in securely
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-7 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={19} className="mt-0.5 text-blue-700" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Authorized access only
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      New accounts must be created by an Admin or Authority.
                      Public registration is disabled.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-8 text-center text-xs text-slate-400">
                Ã‚Â© {new Date().getFullYear()} SREMS. All rights reserved.
              </p>
            </div>
          </section>
        </div>
      </div>
    )
  }

  const visibleModules = MODULES.filter(
    (module) => !module.adminOnly || canManageUsers
  )

  const stats = [
    {
      title: 'Total Properties',
      value: properties.length,
      icon: Building2,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Available',
      value: properties.filter((p) => p.status === 'available').length,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'Reserved',
      value: properties.filter((p) => p.status === 'reserved').length,
      icon: CalendarCheck,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Sold / Rented',
      value: properties.filter((p) =>
        ['sold', 'rented'].includes(String(p.status).toLowerCase())
      ).length,
      icon: CreditCard,
      color: 'bg-violet-50 text-violet-700',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white shadow-md shadow-blue-700/20">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">SREMS</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Management system
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Main menu
          </p>

          <nav className="space-y-1">
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              active={activePage === 'dashboard'}
              onClick={() => setActivePage('dashboard')}
            />
            <SidebarItem
              icon={Building2}
              label="Properties"
              active={activePage === 'properties'}
              onClick={() => setActivePage('properties')}
            />
            {canManageUsers && (
              <SidebarItem
                icon={Users}
                label="User Management"
                active={activePage === 'users'}
                onClick={() => setActivePage('users')}
              />
            )}
          </nav>

          <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Operations
          </p>

          <nav className="space-y-1">
            <SidebarItem
              icon={CalendarCheck}
              label={isManager(authUser) ? "Bookings" : "My Bookings"}
              active={activePage === 'bookings'}
              onClick={() => setActivePage('bookings')}
            />
            <SidebarItem
              icon={CalendarCheck}
              label="Appointments"
              active={activePage === 'appointments'}
              onClick={() => setActivePage('appointments')}
            />
            <SidebarItem
              icon={CreditCard}
              label="Payments"
              active={activePage === 'payments'}
              onClick={() => setActivePage('payments')}
            />
            {canManageUsers && (
              <SidebarItem
                icon={BarChart3}
                label="Reports"
                active={activePage === 'reports'}
                onClick={() => setActivePage('reports')}
              />
            )}
          </nav>
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-800">
              {(authUser.name || authUser.email || 'U')
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {authUser.name || 'System User'}
              </p>
              <p className="truncate text-xs text-slate-500">
                {formatLabel(userRole)}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 lg:hidden">
              <Building2 size={21} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {pageTitle(activePage)}
              </p>
              <p className="hidden text-xs text-slate-400 sm:block">
                Smart Real Estate Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex">
              <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              System online
            </span>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
              {(authUser.name || authUser.email || 'U')
                .charAt(0)
                .toUpperCase()}
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 lg:hidden"
              aria-label="Sign out"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 sm:p-8">
          <MessageBox
            message={propertyMessage}
            type="success"
            onClose={() => setPropertyMessage('')}
          />

          <MessageBox
            message={propertyError}
            type="error"
            onClose={() => setPropertyError('')}
          />

          {activePage === 'dashboard' && (
            <>
              <section className="relative mb-8 overflow-hidden rounded-2xl bg-linear-to-r from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-xl sm:p-9">
                <div className="absolute -right-16 -top-28 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="absolute bottom-0 right-1/4 h-24 w-48 rounded-full bg-indigo-400/20 blur-3xl" />

                <div className="relative z-10 flex flex-col justify-between gap-7 md:flex-row md:items-center">
                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
                      <ShieldCheck size={14} />
                      {formatLabel(userRole)} access
                    </div>

                    <h1 className="text-2xl font-bold sm:text-3xl">
                      Welcome back, {authUser.name || 'User'}!
                    </h1>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/80">
                      Manage property information, review availability and
                      keep your real estate records organized in one place.
                    </p>
                  </div>

                  <button
                    onClick={() => setActivePage('properties')}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-900 shadow-lg transition hover:bg-blue-50"
                  >
                    <Building2 size={18} />
                    View Properties
                    <ArrowRight size={16} />
                  </button>
                </div>
              </section>

              <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-500">
                        {stat.title}
                      </p>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
                      >
                        <stat.icon size={20} />
                      </div>
                    </div>
                    <p className="mt-4 text-3xl font-bold tracking-tight">
                      {propertiesLoading ? 'Ã¢â‚¬â€' : stat.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Based on property records
                    </p>
                  </div>
                ))}
              </section>

              <section>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Management modules
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Choose a module to continue working.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleModules.map((module) => (
                    <button
                      key={module.page}
                      onClick={() => setActivePage(module.page)}
                      className="group flex min-h-44 flex-col rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                    >
                      <div className="flex w-full items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                          <module.icon size={23} />
                        </div>
                        <ChevronRight
                          size={19}
                          className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-700"
                        />
                      </div>

                      <h3 className="mt-5 font-bold text-slate-900">
                        {module.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {module.description}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {activePage === 'properties' && (
            <section>
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <h1 className="text-2xl font-bold">Property Management</h1>
                  <p className="mt-2 text-sm text-slate-500">
                    Manage property details, photos, prices and availability.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => loadProperties()}
                    disabled={propertiesLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                  >
                    <RefreshCw
                      size={17}
                      className={propertiesLoading ? 'animate-spin' : ''}
                    />
                    Refresh
                  </button>

                  {canManageProperties && (
                    <button
                      onClick={startNewProperty}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-800"
                    >
                      <Plus size={18} />
                      Add Property
                    </button>
                  )}
                </div>
              </div>

              {!canManageProperties && (
                <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                  You can view property records. Only Admin or Authority can
                  add, edit or delete properties.
                </div>
              )}

              {showPropertyForm && canManageProperties && (
                <div className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        {editingProperty ? (
                          <Pencil size={20} />
                        ) : (
                          <Plus size={21} />
                        )}
                      </div>
                      <div>
                        <h2 className="font-bold">
                          {editingProperty ? 'Edit Property' : 'Add New Property'}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                          Enter the property information below.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={resetPropertyForm}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Close form"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveProperty} className="p-5 sm:p-7">
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      <Field label="Property Code" required>
                        <input
                          required
                          value={propertyForm.property_code}
                          onChange={(e) =>
                            setPropertyForm({
                              ...propertyForm,
                              property_code: e.target.value,
                            })
                          }
                          placeholder="SREMS-P002"
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Property Name" required>
                        <input
                          required
                          value={propertyForm.property_name}
                          onChange={(e) =>
                            setPropertyForm({
                              ...propertyForm,
                              property_name: e.target.value,
                            })
                          }
                          placeholder="Green Valley Apartment"
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Project Name">
                        <input
                          value={propertyForm.project_name}
                          onChange={(e) =>
                            setPropertyForm({
                              ...propertyForm,
                              project_name: e.target.value,
                            })
                          }
                          placeholder="Project or development name"
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Property Type" required>
                        <select
                          required
                          value={propertyForm.property_type}
                          onChange={(e) =>
                            setPropertyForm({
                              ...propertyForm,
                              property_type: e.target.value,
                            })
                          }
                          className={inputClass}
                        >
                          {PROPERTY_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Location" icon={MapPin} required>
                        <input
                          required
                          value={propertyForm.location}
                          onChange={(e) =>
                            setPropertyForm({
                              ...propertyForm,
                              location: e.target.value,
                            })
                          }
                          placeholder="Uttara, Dhaka"
                          className={iconInputClass}
                        />
                      </Field>

                      <Field label="Size (sq ft)" icon={Ruler}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={propertyForm.size_sqft}
                          onChange={(e) =>
                            setPropertyForm({
                              ...propertyForm,
                              size_sqft: e.target.value,
                            })
                          }
                          placeholder="1450"
                          className={iconInputClass}
                        />
                      </Field>

                      <Field label="Price (BDT)" icon={DollarSign} required>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={propertyForm.price}
                          onChange={(e) =>
                            setPropertyForm({
                              ...propertyForm,
                              price: e.target.value,
                            })
                          }
                          placeholder="8500000"
                          className={iconInputClass}
                        />
                      </Field>

                      <Field label="Status" required>
                        <select
                          required
                          value={propertyForm.status}
                          onChange={(e) =>
                            setPropertyForm({
                              ...propertyForm,
                              status: e.target.value,
                            })
                          }
                          className={inputClass}
                        >
                          {PROPERTY_STATUSES.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <div className="md:col-span-2 xl:col-span-3">
                        <Field label="Description">
                          <textarea
                            rows={4}
                            value={propertyForm.description}
                            onChange={(e) =>
                              setPropertyForm({
                                ...propertyForm,
                                description: e.target.value,
                              })
                            }
                            placeholder="Describe the property, facilities, floor, parking, amenities and other important information..."
                            className={`${inputClass} resize-y`}
                          />
                        </Field>
                      </div>
                    </div>

                    <div className="mt-7 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-5">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                            <ImagePlus size={20} className="text-blue-700" />
                            Property Images
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Select multiple images. JPG, PNG and WebP are
                            recommended.
                          </p>
                        </div>

                        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-50">
                          <Upload size={17} />
                          Choose Images
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || [])
                              setSelectedFiles((previous) => [
                                ...previous,
                                ...files,
                              ])
                              e.target.value = ''
                            }}
                          />
                        </label>
                      </div>

                      {filePreviews.length > 0 && (
                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                          {filePreviews.map((file, index) => (
                            <div
                              key={`${file.name}-${index}`}
                              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
                            >
                              <img
                                src={file.url}
                                alt={file.name}
                                className="h-32 w-full object-cover"
                              />
                              <div className="flex items-center justify-between gap-2 p-2">
                                <p className="truncate text-xs text-slate-600">
                                  {file.name}
                                </p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedFiles((previous) =>
                                      previous.filter((_, i) => i !== index)
                                    )
                                  }
                                  className="shrink-0 rounded-md p-1 text-rose-600 hover:bg-rose-50"
                                  aria-label={`Remove ${file.name}`}
                                >
                                  <X size={15} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedFiles.length > 0 && (
                        <p className="mt-3 text-xs font-medium text-blue-800">
                          {selectedFiles.length} image(s) selected for upload.
                        </p>
                      )}
                    </div>

                    <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                      <button
                        type="button"
                        onClick={resetPropertyForm}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={savingProperty || uploadingImages}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingProperty || uploadingImages ? (
                          <>
                            <LoaderCircle size={18} className="animate-spin" />
                            {uploadingImages ? 'Uploading images...' : 'Saving...'}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={18} />
                            {editingProperty ? 'Update Property' : 'Save Property'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-bold">
                      {canManageProperties ? 'Property Records' : 'Browse Properties'}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {propertyPagination.total} total property record(s)
                    </p>
                  </div>

                  <form
                    className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
                    onSubmit={(e) => {
                      e.preventDefault()
                      loadProperties(propertySearch, propertyTypeFilter, propertyStatusFilter, 1)
                    }}
                  >
                    <div className="relative sm:col-span-2 xl:col-span-1">
                      <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={propertySearch}
                        onChange={(e) => setPropertySearch(e.target.value)}
                        placeholder="Search name, code, project, location..."
                        className={`${inputClass} pl-10`}
                      />
                    </div>

                    <select
                      value={propertyTypeFilter}
                      onChange={(e) => {
                        const value = e.target.value
                        setPropertyTypeFilter(value)
                        loadProperties(propertySearch, value, propertyStatusFilter, 1)
                      }}
                      className={inputClass}
                      aria-label="Filter by property type"
                    >
                      <option value="">All property types</option>
                      {PROPERTY_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>

                    <select
                      value={propertyStatusFilter}
                      onChange={(e) => {
                        const value = e.target.value
                        setPropertyStatusFilter(value)
                        loadProperties(propertySearch, propertyTypeFilter, value, 1)
                      }}
                      className={inputClass}
                      aria-label="Filter by property status"
                    >
                      <option value="">All statuses</option>
                      {PROPERTY_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
                        Search
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPropertySearch('')
                          setPropertyTypeFilter('')
                          setPropertyStatusFilter('')
                          loadProperties('', '', '', 1)
                        }}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Reset
                      </button>
                    </div>
                  </form>
                </div>

                {propertiesLoading ? (
                  <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
                    <LoaderCircle size={22} className="animate-spin text-blue-700" />
                    Loading property records...
                  </div>
                ) : properties.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Building size={29} />
                    </div>
                    <h3 className="mt-4 font-bold">No properties found</h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Add a property or change your search to view available
                      records.
                    </p>
                    {canManageProperties && (
                      <button
                        onClick={startNewProperty}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                      >
                        <Plus size={17} />
                        Add your first property
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full min-w-225 text-left">
                        <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-5 py-4">Property</th>
                            <th className="px-5 py-4">Type / Project</th>
                            <th className="px-5 py-4">Location</th>
                            <th className="px-5 py-4">Size</th>
                            <th className="px-5 py-4">Price</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {properties.map((property) => {
                            const images = getPropertyImages(property)
                            const cover = images.length
                              ? getImageUrl(images[0])
                              : ''

                            return (
                              <tr
                                key={property.id}
                                className="transition hover:bg-slate-50/80"
                              >
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    {cover ? (
                                      <img
                                        src={cover}
                                        alt={property.property_name}
                                        className="h-12 w-14 rounded-lg border border-slate-200 object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-12 w-14 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                        <Building2 size={22} />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="max-w-52 truncate text-sm font-bold text-slate-800">
                                        {property.property_name}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-400">
                                        {property.property_code}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-5 py-4">
                                  <p className="text-sm font-medium">
                                    {formatLabel(property.property_type)}
                                  </p>
                                  <p className="mt-1 max-w-40 truncate text-xs text-slate-400">
                                    {property.project_name || 'No project'}
                                  </p>
                                </td>

                                <td className="px-5 py-4">
                                  <div className="flex max-w-48 items-center gap-1.5 text-sm text-slate-600">
                                    <MapPin
                                      size={15}
                                      className="shrink-0 text-slate-400"
                                    />
                                    <span className="truncate">
                                      {property.location}
                                    </span>
                                  </div>
                                </td>

                                <td className="px-5 py-4 text-sm text-slate-600">
                                  {property.size_sqft
                                    ? `${Number(property.size_sqft).toLocaleString()} sq ft`
                                    : 'Ã¢â‚¬â€'}
                                </td>

                                <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-800">
                                  {formatMoney(property.price)}
                                </td>

                                <td className="px-5 py-4">
                                  <StatusBadge status={property.status} />
                                </td>

                                <td className="px-5 py-4">
                                  <div className="flex items-center justify-end gap-1">
                                    <ActionButton
                                      label="View details"
                                      icon={ViewIcon}
                                      onClick={() => handleViewProperty(property)}
                                    />
                                    {canManageProperties && (
                                      <>
                                        <ActionButton
                                          label="Edit property"
                                          icon={Pencil}
                                          onClick={() =>
                                            startEditingProperty(property)
                                          }
                                        />
                                        <ActionButton
                                          label="Delete property"
                                          icon={Trash2}
                                          danger
                                          onClick={() =>
                                            handleDeleteProperty(property)
                                          }
                                        />
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid gap-4 p-4 md:hidden">
                      {properties.map((property) => {
                        const images = getPropertyImages(property)
                        const cover = images.length
                          ? getImageUrl(images[0])
                          : ''

                        return (
                          <article
                            key={property.id}
                            className="overflow-hidden rounded-xl border border-slate-200"
                          >
                            {cover ? (
                              <img
                                src={cover}
                                alt={property.property_name}
                                className="h-44 w-full object-cover transition-transform duration-300 hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-28 items-center justify-center bg-blue-50 text-blue-600">
                                <Building2 size={34} />
                              </div>
                            )}

                            <div className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="font-bold">
                                    {property.property_name}
                                  </h3>
                                  <p className="mt-1 text-xs text-slate-400">
                                    {property.property_code}
                                  </p>
                                </div>
                                <StatusBadge status={property.status} />
                              </div>

                              <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                                <MapPin size={15} />
                                {property.location}
                              </p>

                              <div className="mt-4 flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-slate-400">Price</p>
                                  <p className="mt-1 font-bold">
                                    {formatMoney(property.price)}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <ActionButton
                                    label="View details"
                                    icon={ViewIcon}
                                    onClick={() => handleViewProperty(property)}
                                  />
                                  {canManageProperties && (
                                    <>
                                      <ActionButton
                                        label="Edit property"
                                        icon={Pencil}
                                        onClick={() =>
                                          startEditingProperty(property)
                                        }
                                      />
                                      <ActionButton
                                        label="Delete property"
                                        icon={Trash2}
                                        danger
                                        onClick={() =>
                                          handleDeleteProperty(property)
                                        }
                                      />
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </>
                )}

                {propertyPagination.last_page > 1 && (
                  <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Showing {propertyPagination.from ?? 0}â€“{propertyPagination.to ?? 0}
                      {' '}of {propertyPagination.total} properties
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={propertiesLoading || propertyPagination.current_page <= 1}
                        onClick={() => loadProperties(
                          propertySearch,
                          propertyTypeFilter,
                          propertyStatusFilter,
                          propertyPagination.current_page - 1
                        )}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Previous page"
                      >
                        Previous
                      </button>

                      <span className="px-2 text-sm font-semibold text-slate-700">
                        Page {propertyPagination.current_page} of {propertyPagination.last_page}
                      </span>

                      <button
                        type="button"
                        disabled={propertiesLoading || propertyPagination.current_page >= propertyPagination.last_page}
                        onClick={() => loadProperties(
                          propertySearch,
                          propertyTypeFilter,
                          propertyStatusFilter,
                          propertyPagination.current_page + 1
                        )}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Next page"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {activePage === 'users' && (
            <section>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">User Management</h1>
                <p className="mt-2 text-sm text-slate-500">
                  Create authorized accounts for your organization.
                </p>
              </div>

              {!canManageUsers ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
                  Only Admin or Authority can create accounts.
                </div>
              ) : (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <UserPlus size={22} />
                      </div>
                      <div>
                        <h2 className="font-bold">Create Account</h2>
                        <p className="mt-1 text-xs text-slate-500">
                          Fill in the new user's information.
                        </p>
                      </div>
                    </div>

                    <MessageBox
                      message={userMessage}
                      type="success"
                      onClose={() => setUserMessage('')}
                    />
                    <MessageBox
                      message={userError}
                      type="error"
                      onClose={() => setUserError('')}
                    />

                    <form onSubmit={handleCreateUser} className="space-y-5">
                      <Field label="Full Name" icon={UserRound} required>
                        <input
                          required
                          value={userForm.name}
                          onChange={(e) =>
                            setUserForm({ ...userForm, name: e.target.value })
                          }
                          placeholder="Enter full name"
                          className={iconInputClass}
                        />
                      </Field>

                      <Field label="Email Address" icon={Mail} required>
                        <input
                          required
                          type="email"
                          value={userForm.email}
                          onChange={(e) =>
                            setUserForm({ ...userForm, email: e.target.value })
                          }
                          placeholder="user@example.com"
                          className={iconInputClass}
                        />
                      </Field>

                      <Field label="Password" icon={LockKeyhole} required>
                        <input
                          required
                          minLength={8}
                          type={showCreatePassword ? 'text' : 'password'}
                          value={userForm.password}
                          onChange={(e) =>
                            setUserForm({
                              ...userForm,
                              password: e.target.value,
                            })
                          }
                          placeholder="At least 8 characters"
                          className={`${iconInputClass} pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowCreatePassword(!showCreatePassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                          aria-label="Toggle password visibility"
                        >
                          {showCreatePassword ? (
                            <EyeOff size={17} />
                          ) : (
                            <Eye size={17} />
                          )}
                        </button>
                      </Field>

                      <Field label="User Role" required>
                        <select
                          required
                          value={userForm.role}
                          onChange={(e) =>
                            setUserForm({ ...userForm, role: e.target.value })
                          }
                          className={inputClass}
                        >
                          <option value="staff">Staff</option>
                          <option value="user">User</option>
                          {isAdmin && (
                            <option value="authority">Authority</option>
                          )}
                          {isAdmin && <option value="admin">Admin</option>}
                        </select>
                      </Field>

                      <button
                        type="submit"
                        disabled={creatingUser}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
                      >
                        {creatingUser ? (
                          <>
                            <LoaderCircle size={18} className="animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          <>
                            <UserPlus size={18} />
                            Create User Account
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={24} className="text-blue-700" />
                        <h3 className="font-bold text-blue-950">
                          Access Control
                        </h3>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-blue-900/75">
                        Account creation is restricted to Admin and Authority
                        users. Public self-registration is not available.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                      <h3 className="font-bold">Role permissions</h3>
                      <div className="mt-4 space-y-4">
                        {[
                          {
                            role: 'Admin',
                            description:
                              'Full administrative access, including account creation.',
                          },
                          {
                            role: 'Authority',
                            description:
                              'Manage properties and create Staff/User accounts.',
                          },
                          {
                            role: 'Staff',
                            description:
                              'Access system modules according to backend permissions.',
                          },
                          {
                            role: 'User',
                            description:
                              'Standard access according to backend permissions.',
                          },
                        ].map((item) => (
                          <div
                            key={item.role}
                            className="flex items-start gap-3"
                          >
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                              <KeyRound size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">
                                {item.role}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {createdUser && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <p className="font-bold text-emerald-900">
                          Account information
                        </p>
                        <p className="mt-2 text-sm text-emerald-800">
                          Name: {createdUser.name || 'Created successfully'}
                        </p>
                        {createdUser.email && (
                          <p className="mt-1 text-sm text-emerald-800">
                            Email: {createdUser.email}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {activePage === 'bookings' && (
            <BookingManagement
              apiRequest={apiRequest}
              isManager={isManager(authUser)}
            />
          )}

          {activePage === 'appointments' && (
            <AppointmentManagement
              apiRequest={apiRequest}
              isManager={isManager(authUser)}
            />
          )}

          {activePage === 'payments' && (
            <PaymentManagement
              apiRequest={apiRequest}
              isManager={isManager(authUser)}
            />
          )}

          {activePage === 'reports' && canManageUsers && (
            <ReportsManagement apiRequest={apiRequest} />
          )}
        </main>
      </div>

      {viewingProperty && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setViewingProperty(null)
              setExpandedImage('')
            }
          }}
        >
          <div className="my-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Property details
                </p>
                <h2 className="mt-1 truncate text-lg font-bold sm:text-xl">
                  {viewingProperty.property_name}
                </h2>
              </div>
              <button
                onClick={() => {
                  setViewingProperty(null)
                  setExpandedImage('')
                }}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close property details"
              >
                <X size={21} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
                <LoaderCircle size={22} className="animate-spin text-blue-700" />
                Loading property details...
              </div>
            ) : (
              <div className="max-h-[80vh] overflow-y-auto p-5 sm:p-7">
                <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">
                      Property code:{' '}
                      <span className="font-semibold text-slate-800">
                        {viewingProperty.property_code || 'Ã¢â‚¬â€'}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Project: {viewingProperty.project_name || 'Ã¢â‚¬â€'}
                    </p>
                  </div>
                  <StatusBadge status={viewingProperty.status} />
                </div>

                <div className="mb-7">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Images size={20} className="text-blue-700" />
                      <h3 className="font-bold">Property Image Gallery</h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      {getPropertyImages(viewingProperty).length} image(s)
                    </span>
                  </div>

                  {getPropertyImages(viewingProperty).length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {getPropertyImages(viewingProperty).map((image, index) => {
                        const src = getImageUrl(image)

                        if (!src) return null

                        return (
                          <div
                            key={image.id || `${src}-${index}`}
                            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedImage(src)}
                              className="block w-full"
                              title="View larger image"
                            >
                              <img
                                src={src}
                                alt={`${viewingProperty.property_name} ${index + 1}`}
                                className="h-36 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-44"
                                onError={(e) => {
                                  e.currentTarget.style.opacity = '0.35'
                                }}
                              />
                            </button>

                            {canManageProperties && image.id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteImage(image)}
                                disabled={deletingImageId === image.id}
                                className="absolute right-2 top-2 rounded-lg bg-white/95 p-2 text-rose-600 shadow transition hover:bg-rose-50 disabled:opacity-50"
                                aria-label="Delete image"
                                title="Delete image"
                              >
                                {deletingImageId === image.id ? (
                                  <LoaderCircle
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            )}

                            <p className="truncate px-3 py-2 text-xs text-slate-500">
                              {image.name || image.original_name || `Image ${index + 1}`}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                      <ImagePlus size={28} className="text-slate-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-600">
                        No images uploaded
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {canManageProperties
                          ? 'Close this window and edit the property to add images.'
                          : 'There are no images available for this property.'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem
                    icon={Building2}
                    label="Property Name"
                    value={viewingProperty.property_name}
                  />
                  <DetailItem
                    icon={KeyRound}
                    label="Property Code"
                    value={viewingProperty.property_code}
                  />
                  <DetailItem
                    icon={Building}
                    label="Property Type"
                    value={formatLabel(viewingProperty.property_type)}
                  />
                  <DetailItem
                    icon={MapPin}
                    label="Location"
                    value={viewingProperty.location}
                  />
                  <DetailItem
                    icon={Ruler}
                    label="Size"
                    value={
                      viewingProperty.size_sqft
                        ? `${Number(viewingProperty.size_sqft).toLocaleString()} sq ft`
                        : 'Ã¢â‚¬â€'
                    }
                  />
                  <DetailItem
                    icon={DollarSign}
                    label="Price"
                    value={formatMoney(viewingProperty.price)}
                  />
                  <DetailItem
                    icon={Building2}
                    label="Project Name"
                    value={viewingProperty.project_name || 'Ã¢â‚¬â€'}
                  />
                  <DetailItem
                    icon={UserRound}
                    label="Created By"
                    value={
                      viewingProperty.creator?.name ||
                      viewingProperty.created_by_name ||
                      'Ã¢â‚¬â€'
                    }
                  />
                  <DetailItem
                    icon={CheckCircle2}
                    label="Availability"
                    value={formatLabel(viewingProperty.status)}
                  />
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-blue-700" />
                    <h3 className="text-sm font-bold">Description</h3>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {viewingProperty.description || 'No description provided.'}
                  </p>
                </div>

                {!canManageProperties && getUserRole(authUser) === 'user' && (
                  <form
                    onSubmit={handleSubmitAppointment}
                    className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5"
                  >
                    <h3 className="text-lg font-bold text-slate-900">
                      Request Property Visit
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Choose a convenient date and time to visit this property.
                      Your request will remain pending until it is reviewed.
                    </p>

                    {appointmentError && (
                      <div role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                        {appointmentError}
                      </div>
                    )}

                    {appointmentSuccess && (
                      <div role="status" className="mt-4 rounded-xl bg-emerald-100 p-3 text-sm text-emerald-800">
                        {appointmentSuccess}
                      </div>
                    )}

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Field label="Appointment Date" required>
                        <input
                          type="date"
                          required
                          min={new Date().toLocaleDateString('en-CA')}
                          value={appointmentDate}
                          onChange={(event) => setAppointmentDate(event.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Appointment Time" required>
                        <input
                          type="time"
                          required
                          value={appointmentTime}
                          onChange={(event) => setAppointmentTime(event.target.value)}
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    <div className="mt-4">
                      <Field label="Message (Optional)">
                        <textarea
                          value={appointmentMessage}
                          onChange={(event) => setAppointmentMessage(event.target.value)}
                          maxLength={2000}
                          rows={3}
                          placeholder="Add any details about your visit..."
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    <button
                      type="submit"
                      disabled={appointmentSubmitting}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {appointmentSubmitting && (
                        <LoaderCircle size={17} className="animate-spin" />
                      )}
                      {appointmentSubmitting ? 'Submitting...' : 'Request Appointment'}
                    </button>
                  </form>
                )}
                {!canManageProperties &&
                  getUserRole(authUser) === 'user' &&
                  String(viewingProperty.status).toLowerCase() === 'available' && (
                    <form
                      onSubmit={handleSubmitBooking}
                      className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-5"
                    >
                      <h3 className="text-lg font-bold text-slate-900">
                        Request Booking
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Submit your request. Your booking will remain pending
                        until Admin or Authority reviews it.
                      </p>

                      {bookingError && (
                        <div role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                          {bookingError}
                        </div>
                      )}

                      {bookingSuccess && (
                        <div role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                          {bookingSuccess}
                        </div>
                      )}

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field label="Requested Date">
                          <input
                            type="date"
                            min={new Date().toISOString().slice(0, 10)}
                            value={bookingDate}
                            onChange={(event) => setBookingDate(event.target.value)}
                            className={inputClass}
                          />
                        </Field>

                        <Field label="Message to Admin">
                          <textarea
                            value={bookingMessage}
                            onChange={(event) => setBookingMessage(event.target.value)}
                            maxLength={2000}
                            rows={3}
                            placeholder="Tell us about your booking request..."
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      <button
                        type="submit"
                        disabled={bookingSubmitting}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {bookingSubmitting && (
                          <LoaderCircle size={17} className="animate-spin" />
                        )}
                        {bookingSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                      </button>
                    </form>
                  )}
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  {canManageProperties && (
                    <button
                      onClick={() => {
                        const property = viewingProperty
                        setViewingProperty(null)
                        startEditingProperty(property)
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                    >
                      <Pencil size={16} />
                      Edit Property
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setViewingProperty(null)
                      setExpandedImage('')
                    }}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {expandedImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setExpandedImage('')}
        >
          <button
            onClick={() => setExpandedImage('')}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            aria-label="Close image preview"
          >
            <X size={23} />
          </button>
          <img
            src={expandedImage}
            alt="Full-size property"
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
        active
          ? 'bg-blue-50 text-blue-800'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon size={19} className={active ? 'text-blue-700' : 'text-slate-400'} />
      <span className="flex-1 text-left">{label}</span>
      {active && <span className="h-5 w-1 rounded-full bg-blue-700" />}
    </button>
  )
}

function ActionButton({ label, icon: Icon, onClick, danger = false }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`rounded-lg p-2 transition ${
        danger
          ? 'text-rose-500 hover:bg-rose-50 hover:text-rose-700'
          : 'text-slate-500 hover:bg-blue-50 hover:text-blue-700'
      }`}
    >
      <Icon size={17} />
    </button>
  )
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={16} />
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="mt-2 wrap-break-word text-sm font-semibold text-slate-800">
        {value || 'Ã¢â‚¬â€'}
      </p>
    </div>
  )
}

function pageTitle(page) {
  const titles = {
    dashboard: 'Dashboard',
    properties: 'Property Management',
    users: 'User Management',
    bookings: 'Booking Management',
    appointments: 'Appointments',
    payments: 'Payments',
    reports: 'Reports',
  }

  return titles[page] || 'Dashboard'
}

export default App


