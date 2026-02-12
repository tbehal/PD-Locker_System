import Link from 'next/link'
import Image from 'next/image'
import { CreditCard, Shield, Clock, Lock } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/">
          <Image src="/prep.svg" alt="Prep Doctors" width={121} height={48} priority />
        </Link>
        <Link
          href="/lockers"
          className="bg-[#0660B2] text-white px-4 py-2 rounded-md hover:bg-[#0550A0] transition-colors"
        >
          Rent a Locker
        </Link>
      </header>

      <main>
        <section className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Secure Storage for
            <br />
            <span className="text-[#0660B2]">Medical Professionals</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Rent a secure locker for just $50/week. Store your equipment, supplies, and personal items safely while you focus on patient care.
          </p>
          <Link
            href="/lockers"
            className="inline-block bg-[#0660B2] text-white px-8 py-4 rounded-md text-lg font-medium hover:bg-[#0550A0] transition-colors"
          >
            Check Locker Availability
          </Link>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Why Prep Doctors Lockers?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-md shadow-[0_0_2px_rgba(0,0,0,.12),0_2px_4px_rgba(0,0,0,.24)]">
                <CreditCard className="h-10 w-10 text-[#0660B2] mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Simple Pricing
                </h3>
                <p className="text-gray-600">
                  $50/week for all 20 lockers. No hidden fees, cancel anytime.
                </p>
              </div>
              <div className="bg-white p-6 rounded-md shadow-[0_0_2px_rgba(0,0,0,.12),0_2px_4px_rgba(0,0,0,.24)]">
                <Shield className="h-10 w-10 text-[#0660B2] mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Secure Storage
                </h3>
                <p className="text-gray-600">
                  24/7 surveillance and individual access codes for your equipment.
                </p>
              </div>
              <div className="bg-white p-6 rounded-md shadow-[0_0_2px_rgba(0,0,0,.12),0_2px_4px_rgba(0,0,0,.24)]">
                <Clock className="h-10 w-10 text-[#0660B2] mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  24/7 Access
                </h3>
                <p className="text-gray-600">
                  Access your locker anytime - perfect for shift workers.
                </p>
              </div>
              <div className="bg-white p-6 rounded-md shadow-[0_0_2px_rgba(0,0,0,.12),0_2px_4px_rgba(0,0,0,.24)]">
                <Lock className="h-10 w-10 text-[#0660B2] mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Flexible Dates
                </h3>
                <p className="text-gray-600">
                  Choose your start date and rent for as long as you need.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Select a date, choose your locker, and complete payment in minutes.
            </p>
            <Link
              href="/lockers"
              className="inline-block bg-[#0660B2] text-white px-8 py-4 rounded-md text-lg font-medium hover:bg-[#0550A0] transition-colors"
            >
              Find Your Locker
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>Prep Doctors Lockers - Secure Storage for Medical Professionals</p>
          <p className="text-sm mt-2">Powered by Stripe for secure payments</p>
        </div>
      </footer>
    </div>
  )
}
