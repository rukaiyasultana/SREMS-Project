import { useCallback, useEffect, useState } from 'react'
import {
  RefreshCw,
  Download,
  Building2,
  CalendarCheck,
  CreditCard,
  Wallet,
  AlertTriangle,
  FileBarChart,
} from 'lucide-react'

function money(value) {
  const amount = Number(value || 0)
  return `৳${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function MetricCard({ title, value, detail, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 break-words text-2xl font-bold text-slate-900">{value}</p>
          {detail && <p className="mt-2 text-xs text-slate-500">{detail}</p>}
        </div>
        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
          <Icon size={22} />
        </div>
      </div>
    </article>
  )
}

function StatusRows({ title, values }) {
  const entries = Object.entries(values || {})

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No records available.</p>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {entries.map(([status, value]) => (
            <div key={status} className="flex items-center justify-between gap-3 py-3">
              <span className="capitalize text-sm text-slate-600">
                {String(status).replaceAll('_', ' ')}
              </span>
              <span className="font-semibold tabular-nums text-slate-900">
                {typeof value === 'object' ? value.count : value}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function ReportsManagement({ apiRequest }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await apiRequest('/reports/summary')
      setReport(result?.report || null)
    } catch (err) {
      setError(err.message || 'Unable to load reports.')
    } finally {
      setLoading(false)
    }
  }, [apiRequest])

  useEffect(() => {
    // Load the report when its memoized loader changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReport()
  }, [loadReport])

  async function exportCsv() {
    setExporting(true)
    setError('')

    try {
      const blob = await apiRequest('/reports/summary?format=csv', {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'srems_report.csv'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message || 'CSV export failed.')
    } finally {
      setExporting(false)
    }
  }

  if (loading && !report) {
    return (
      <section className="flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <RefreshCw className="animate-spin" size={18} />
          Loading financial reports...
        </div>
      </section>
    )
  }

  const properties = report?.properties || {}
  const bookings = report?.bookings || {}
  const payments = report?.payments || {}
  const installments = report?.installments || {}

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
              <FileBarChart size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Reports & Financial Analytics</h1>
              <p className="mt-1 text-sm text-slate-500">
                Property inventory, bookings, verified payments and installment balances.
              </p>
            </div>
          </div>
          {report?.generated_at && (
            <p className="mt-3 text-xs text-slate-400">
              Last updated: {new Date(report.generated_at).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadReport}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting || !report}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {report && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              title="Total Properties"
              value={Number(properties.total || 0).toLocaleString()}
              detail={`Inventory value: ${money(properties.inventory_value)}`}
              icon={Building2}
            />
            <MetricCard
              title="Total Booking Requests"
              value={Number(bookings.total || 0).toLocaleString()}
              detail={`${bookings.by_status?.pending || 0} pending review`}
              icon={CalendarCheck}
            />
            <MetricCard
              title="Approved Payments"
              value={money(payments.approved_amount)}
              detail={`${payments.approved_count || 0} approved payment records`}
              icon={CreditCard}
            />
            <MetricCard
              title="Pending Verification"
              value={money(payments.pending_amount)}
              detail={`${payments.pending_count || 0} payments awaiting review`}
              icon={Wallet}
            />
            <MetricCard
              title="Remaining Installment Balance"
              value={money(installments.remaining_total)}
              detail={`${installments.total || 0} installment records`}
              icon={Wallet}
            />
            <MetricCard
              title="Overdue Installments"
              value={money(installments.overdue_amount)}
              detail={`${installments.overdue_count || 0} overdue installments`}
              icon={AlertTriangle}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <StatusRows title="Properties by Status" values={properties.by_status} />
            <StatusRows title="Bookings by Status" values={bookings.by_status} />
            <StatusRows title="Payments by Status" values={payments.by_status} />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Installment Collection Summary</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Scheduled Total</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{money(installments.due_total)}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">Recorded Paid</p>
                <p className="mt-2 text-lg font-bold text-emerald-800">{money(installments.paid_total)}</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-sm text-amber-700">Remaining Balance</p>
                <p className="mt-2 text-lg font-bold text-amber-800">{money(installments.remaining_total)}</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Payment figures reflect payment verification status. Installment totals use the recorded
              amount_due and amount_paid fields; overdue is calculated from past due dates and unpaid
              balances. These are operational summaries, not audited financial statements.
            </p>
          </section>
        </>
      )}
    </div>
  )
}