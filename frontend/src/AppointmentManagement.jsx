import { useCallback, useEffect, useState } from 'react'
import { CalendarCheck, CheckCircle2, XCircle, RefreshCw, LoaderCircle } from 'lucide-react'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
}

function formatTime(value) {
  if (!value) return '—'
  const parts = String(value).split(':')
  if (parts.length < 2) return value
  const date = new Date()
  date.setHours(Number(parts[0]), Number(parts[1]), 0, 0)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function statusClass(status) {
  const value = String(status || '').toLowerCase()
  if (value === 'approved') return 'bg-emerald-100 text-emerald-800'
  if (value === 'rejected') return 'bg-rose-100 text-rose-800'
  if (value === 'cancelled') return 'bg-slate-100 text-slate-600'
  return 'bg-amber-100 text-amber-800'
}

export default function AppointmentManagement({ apiRequest, isManager }) {
  const [appointments, setAppointments] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [adminNotes, setAdminNotes] = useState({})
  const [reloadKey, setReloadKey] = useState(0)

  const loadAppointments = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const query = statusFilter
        ? `?status=${encodeURIComponent(statusFilter)}`
        : ''
      const result = await apiRequest(`/appointments${query}`)
      const rows = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.appointments)
            ? result.appointments
            : Array.isArray(result?.data?.data)
              ? result.data.data
              : []

      setAppointments(rows)
    } catch (err) {
      setError(err.message || 'Unable to load appointments.')
    } finally {
      setLoading(false)
    }
  }, [apiRequest, statusFilter])

  useEffect(() => {
    // Refresh is triggered by reloadKey; loading updates occur in the API loader.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAppointments()
  }, [loadAppointments, reloadKey])

  async function reviewAppointment(appointment, status) {
    const id = appointment?.id
    if (!id || busyId !== null) return

    setBusyId(id)
    setError('')
    setNotice('')

    try {
      const result = await apiRequest(`/appointments/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          admin_note: (adminNotes[id] || '').trim() || null,
        }),
      })

      setNotice(result?.message || `Appointment ${status} successfully.`)
      await loadAppointments()
    } catch (err) {
      setError(err.message || `Unable to ${status} appointment.`)
    } finally {
      setBusyId(null)
    }
  }

  async function cancelAppointment(appointment) {
    const id = appointment?.id
    if (!id || busyId !== null) return

    setBusyId(id)
    setError('')
    setNotice('')

    try {
      const result = await apiRequest(`/appointments/${id}/cancel`, {
        method: 'PATCH',
      })

      setNotice(result?.message || 'Appointment cancelled.')
      await loadAppointments()
    } catch (err) {
      setError(err.message || 'Unable to cancel appointment.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isManager ? 'Appointment Management' : 'My Appointments'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isManager
              ? 'Review property visit requests and record decisions.'
              : 'View your property visit requests and their current status.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            aria-label="Filter appointments by status"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {notice && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
          <LoaderCircle size={22} className="animate-spin text-blue-700" />
          Loading appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
          <CalendarCheck size={36} className="mx-auto text-slate-300" />
          <h2 className="mt-4 font-semibold text-slate-800">No appointments found</h2>
          <p className="mt-2 text-sm text-slate-500">
            {statusFilter
              ? 'Try another status filter.'
              : 'Appointment requests will appear here when submitted.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => {
            const property = appointment.property || {}
            const customer = appointment.customer || {}
            const status = String(appointment.status || 'pending').toLowerCase()
            const isBusy = busyId === appointment.id

            return (
              <article
                key={appointment.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Appointment #{appointment.id}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      {property.property_name || `Property #${appointment.property_id}`}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {property.property_code ? `${property.property_code} · ` : ''}
                      {property.location || 'Location not provided'}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${statusClass(status)}`}>
                    {status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {formatDate(appointment.appointment_date)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Time</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {formatTime(appointment.appointment_time)}
                    </p>
                  </div>
                  {isManager && (
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Customer</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {customer.name || `Customer #${appointment.user_id}`}
                      </p>
                      {customer.email && (
                        <p className="mt-1 break-all text-xs text-slate-500">{customer.email}</p>
                      )}
                    </div>
                  )}
                </div>

                {appointment.message && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500">Customer message</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {appointment.message}
                    </p>
                  </div>
                )}

                {appointment.admin_note && (
                  <div className="mt-3 rounded-xl bg-blue-50 p-3">
                    <p className="text-xs font-semibold text-blue-800">Admin note</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-blue-900">
                      {appointment.admin_note}
                    </p>
                  </div>
                )}

                {isManager && status === 'pending' && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <label className="block text-sm font-semibold text-slate-700">
                      Review note (optional)
                      <textarea
                        value={adminNotes[appointment.id] || ''}
                        onChange={(event) =>
                          setAdminNotes((current) => ({
                            ...current,
                            [appointment.id]: event.target.value,
                          }))
                        }
                        maxLength={2000}
                        rows={2}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        placeholder="Add a note for the customer..."
                      />
                    </label>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={isBusy || busyId !== null}
                        onClick={() => reviewAppointment(appointment, 'approved')}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />
                        {isBusy ? 'Saving...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy || busyId !== null}
                        onClick={() => reviewAppointment(appointment, 'rejected')}
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {!isManager && status === 'pending' && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      disabled={isBusy || busyId !== null}
                      onClick={() => cancelAppointment(appointment)}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      {isBusy ? 'Cancelling...' : 'Cancel Request'}
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
