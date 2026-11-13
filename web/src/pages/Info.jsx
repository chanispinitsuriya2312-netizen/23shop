import { useParams, useLocation, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PAGES from '../data/pages'
import { useSeo } from '../lib/seo'

export default function Info() {
  const { slug } = useParams()
  const { pathname } = useLocation()
  const key = slug || pathname.replace(/^\//, '')
  const page = PAGES[key] || PAGES.shipping

  useSeo({
    title: page.title,
    description: page.intro,
    canonical: pathname
  })

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="eyebrow">ShopHub</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900">{page.title}</h1>
        <p className="mt-3 text-ink-500">{page.intro}</p>

        <div className="mt-8 space-y-4">
          {page.sections.map((s) => (
            <section key={s.h} className="card-surface p-6">
              <h2 className="text-base font-bold text-ink-900">{s.h}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.p}</p>
            </section>
          ))}
        </div>

        <Link to="/" className="mt-8 inline-block text-sm font-semibold text-brand hover:underline">
          ← กลับหน้าร้าน
        </Link>
      </main>
      <Footer />
    </div>
  )
}
