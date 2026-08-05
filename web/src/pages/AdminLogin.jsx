import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../lib/useAuth'
import { IS_EMULATOR } from '../firebase'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/admin')
    } catch (err) {
      const code = err?.code || ''
      if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
      } else {
        setError('เข้าสู่ระบบไม่สำเร็จ: ' + (err?.message || err))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-col items-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
            S
          </span>
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" strokeLinejoin="round" />
            </svg>
            สำหรับผู้ดูแลระบบ
          </span>
          <h1 className="mt-2 text-xl font-extrabold">เข้าสู่ระบบผู้ดูแล</h1>
          <p className="mt-1 text-sm text-slate-400">จัดการสินค้าและออเดอร์ของร้าน</p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">อีเมล</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="admin@shophub.com"
              autoComplete="username"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">รหัสผ่าน</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {IS_EMULATOR && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-center text-xs text-amber-700">
            โหมด Emulator — สร้างบัญชีทดสอบได้ที่หน้า Emulator UI (localhost:4000) หรือใช้
            admin@shophub.com / 123456 หากถูก seed ไว้
          </p>
        )}

        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">
          เป็นลูกค้าใช่ไหม? เข้าสู่ระบบสมาชิกที่{' '}
          <Link to="/account/login" className="font-semibold text-brand hover:underline">
            หน้าลูกค้า
          </Link>
        </p>

        <Link to="/" className="mt-3 block text-center text-sm text-slate-400 hover:text-brand">
          ← กลับหน้าร้าน
        </Link>
      </div>
    </div>
  )
}
