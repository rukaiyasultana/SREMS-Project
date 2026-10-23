import { useCallback, useEffect, useState } from 'react'
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Building2,
  UserRound,
  AlertCircle,
  LoaderCircle,
} from 'lucide-react'

function displayDate(value) {
  if (!value) return 'Not specified'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString()
}

function statusStyle(status) {
  const styles = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
    cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
  }
  return styles[String(status || '').toLowerCase()] ||
    'bg-slate-100 text-slate-600 ring-slate-200'
}

export default function BookingManagement({ apiRequest, isManager }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('all')

  const loadBookings = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await apiRequest('/bookings')
      const rows = data?.data?.data || data?.data ||
        data?.bookings || data?.results || []
      setBookings(Array.isArray(rows) ? rows : [])
    } catch (err) {
      setError(err.message || 'Unable to load booking requests.')
    } finally {
      setLoading(false)
    }
  }, [apiRequest])

  useEffect(() => {
    // Fetch bookings when the API loader changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBookings()
  }, [loadBookings])

  async function reviewBooking(booking, status) {
    const action = status === 'approved' ? 'approve' : 'reject'

    if (!window.confirm(`Are you sure you want to ${action} this booking request?`)) {
      return
    }

    setBusyId(booking.id)
    setError('')
    setMessage('')

    try {
      const result = await apiRequest(`/bookings/${booking.id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          admin_note: status === 'approved'
            ? 'Booking approved by Admin/Authority.'
            : 'Booking request rejected by Admin/Authority.',
        }),
      })

      setMessage(result?.message || `Booking ${status} successfully.`)
      await loadBookings()
    } catch (err) {
      setError(err.message || `Unable to ${action} this booking.`)
    } finally {
      setBusyId(null)
    }
  }

  const visibleBookings = bookings.filter((booking) =>
    filter === 'all' ? true : booking.status === filter
  )

  const pendingCount = bookings.filter((booking) =>
    booking.status === 'pending'
  ).length

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isManager ? 'Booking Management' : 'My Bookings'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isManager
              ? 'Review customer requests and manage property reservations.'
              : 'Track your property booking requests and their approval status.'}
          </p>
        </div>
        <button
          type="button"
          onClick={loadBookings}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {isManager && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white p-3 text-amber-700">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">
                Pending approval
              </p>
              <p className="text-2xl font-bold text-amber-950">
                {pendingCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'approved', 'rejected', 'cancelled'].map((status) => (
          <button
            type="button"
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${
              filter === status
                ? 'bg-blue-700 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {status === 'all' ? 'All requests' : status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500">
          <LoaderCircle size={22} className="animate-spin text-blue-700" />
          Loading booking requests...
        </div>
      ) : visibleBookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Building2 size={34} className="mx-auto text-slate-300" />
          <h2 className="mt-4 text-lg font-bold text-slate-800">
            No booking requests found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Requests will appear here when available.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleBookings.map((booking) => {
            const property = booking.property || {}
            const customer = booking.customer || {}

            return (
              <article
                key={booking.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Booking #{booking.id}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      {property.property_name || 'Property'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {property.property_code || 'No property code'}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ring-inset ${statusStyle(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {isManager && (
                    <div className="flex items-start gap-3">
                      <UserRound size={18} className="mt-0.5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-400">Customer</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {customer.name || 'Customer'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {customer.email || ''}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <CalendarDays size={18} className="mt-0.5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-400">Requested date</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {displayDate(booking.requested_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 size={18} className="mt-0.5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-400">Location</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {property.location || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {property.price != null && (
                    <div>
                      <p className="text-xs text-slate-400">Property price</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {Number(property.price).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {booking.message && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500">Customer message</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                      {booking.message}
                    </p>
                  </div>
                )}

                {booking.admin_note && (
                  <div className="mt-3 rounded-xl bg-blue-50 p-4">
                    <p className="text-xs font-semibold text-blue-700">Admin note</p>
                    <p className="mt-1 text-sm text-blue-900">{booking.admin_note}</p>
                  </div>
                )}

                {isManager && booking.status === 'pending' && (
                  <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      disabled={busyId === booking.id}
                      onClick={() => reviewBooking(booking, 'approved')}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 size={17} />
                      {busyId === booking.id ? 'Processing...' : 'Approve request'}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === booking.id}
                      onClick={() => reviewBooking(booking, 'rejected')}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      <XCircle size={17} />
                      Reject request
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
