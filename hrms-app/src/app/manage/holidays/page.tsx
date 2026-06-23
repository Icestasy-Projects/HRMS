import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'

export default async function ManageHolidaysPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentEmployee } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (!currentEmployee || currentEmployee.role !== 'super_admin') redirect('/dashboard')

  const params = await searchParams
  const year = parseInt(params?.year ?? '') || new Date().getFullYear()

  const { data: holidays } = await supabase
    .from('holiday_calendar')
    .select('*')
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
    .order('date')

  async function addHoliday(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: currentEmployee } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (!currentEmployee || currentEmployee.role !== 'super_admin') return

    const date = formData.get('date') as string
    const name = (formData.get('name') as string).trim()
    if (!date || !name) return

    await supabase.from('holiday_calendar').insert({ date, name })
    revalidatePath('/manage/holidays')
  }

  async function deleteHoliday(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: currentEmployee } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (!currentEmployee || currentEmployee.role !== 'super_admin') return

    const holidayId = formData.get('holiday_id') as string
    if (!holidayId) return

    await supabase.from('holiday_calendar').delete().eq('id', holidayId)
    revalidatePath('/manage/holidays')
  }

  const prevYear = year - 1
  const nextYear = year + 1

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Holiday Calendar</h1>
        <p className="text-gray-500 text-sm mt-1">
          Add public holidays and company non-working days. These are excluded from leave calculations.
        </p>
      </div>

      {/* Year nav */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
        <a
          href={`/manage/holidays?year=${prevYear}`}
          className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2.5 font-semibold hover:bg-gray-200 text-sm min-h-[44px] flex items-center"
        >
          ← {prevYear}
        </a>
        <span className="font-semibold text-gray-900 text-lg">{year}</span>
        <a
          href={`/manage/holidays?year=${nextYear}`}
          className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2.5 font-semibold hover:bg-gray-200 text-sm min-h-[44px] flex items-center"
        >
          {nextYear} →
        </a>
      </div>

      {/* Add holiday form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Add Holiday</h2>
        <form action={addHoliday} className="flex flex-col sm:flex-row gap-3">
          <input type="hidden" name="year" value={year} />
          <input
            name="date"
            type="date"
            required
            min={`${year}-01-01`}
            max={`${year}-12-31`}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
          />
          <input
            name="name"
            type="text"
            required
            placeholder="Holiday name (e.g. New Year's Day)"
            className="flex-[2] border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
          />
          <button
            type="submit"
            className="bg-blue-700 text-white rounded-lg px-5 py-3 font-semibold hover:bg-blue-800 text-sm min-h-[44px] whitespace-nowrap"
          >
            Add
          </button>
        </form>
      </div>

      {/* Holiday list */}
      {(!holidays || holidays.length === 0) ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No holidays added for {year}.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Holiday</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {holidays.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {format(new Date(h.date), 'EEE, d MMM yyyy')}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{h.name}</td>
                  <td className="px-4 py-3">
                    <form action={deleteHoliday}>
                      <input type="hidden" name="holiday_id" value={h.id} />
                      <button
                        type="submit"
                        className="text-red-700 hover:underline text-sm font-medium"
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
