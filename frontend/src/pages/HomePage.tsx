import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { Lock, Shield, Clock, Calendar } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <img src="/prep.svg" alt="Prep Doctors" width={121} height={48} />
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-white py-16">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Secure Locker Rentals
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Reserve a personal locker for your medical education materials.
              Simple weekly rentals starting at $50/week.
            </p>
            <Link to="/lockers">
              <Button size="lg" className="px-8">
                Check Locker Availability
              </Button>
            </Link>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
              Why Rent With Us
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#E8F4FC] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-[#0660B2]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Simple Pricing</h3>
                <p className="text-gray-600 text-sm">
                  Flat $50/week rate for all lockers. No hidden fees or surprises.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#E8F4FC] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-[#0660B2]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Secure Storage</h3>
                <p className="text-gray-600 text-sm">
                  Personal key access with secure facility monitoring.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#E8F4FC] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-[#0660B2]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">24/7 Access</h3>
                <p className="text-gray-600 text-sm">
                  Access your belongings anytime, day or night.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#E8F4FC] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-[#0660B2]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Flexible Dates</h3>
                <p className="text-gray-600 text-sm">
                  Choose your own start and end dates. Rent for as long as you need.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-[#0660B2] py-16">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-blue-100 mb-8">
              Check availability and reserve your locker in minutes.
            </p>
            <Link to="/lockers">
              <Button variant="outline" size="lg" className="bg-white text-[#0660B2] hover:bg-gray-100 border-white">
                Reserve a Locker Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Prep Doctors - Medical Education Center</p>
        </div>
      </footer>
    </div>
  )
}
