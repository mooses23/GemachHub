import { LocationSearch } from "@/components/locations/location-search";
import { Link } from "wouter";
import { MapPin, Users, Clock, Shield } from "lucide-react";
import heroImage from "@assets/IMG_9646.jpeg";

export default function Home() {
  return (
    <>
      {/* Meta tags */}
      <head>
        <title>Baby Banz Earmuffs Gemach - Find Locations Near You</title>
        <meta name="description" content="Find Baby Banz Earmuffs near you. Search by zip code to locate the nearest gemach for protecting your baby's hearing at celebrations with a $20 refundable deposit." />
        <meta property="og:title" content="Baby Banz Earmuffs Gemach - Find Locations" />
        <meta property="og:description" content="Search by zip code to find Baby Banz Earmuffs near you. Protect your baby's hearing with our global gemach network." />
        <meta property="og:url" content="https://earmuffsgemach.com" />
        <meta property="og:type" content="website" />
      </head>
      
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Header Banner */}
        <div className="bg-blue-900 text-white py-3">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-wide">
              BabyBanz Gemach
            </h1>
          </div>
        </div>

        {/* Hero Section with Image */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={heroImage} 
              alt="Baby wearing protective earmuffs"
              className="w-full h-96 object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 to-white"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4 py-16">
            <div className="text-center max-w-4xl mx-auto mb-12">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Find Baby Earmuffs Near You
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Protect your baby's hearing with our global gemach network. 
                Search by zip code, city, or location code to find the nearest location.
              </p>
            </div>
            
            <LocationSearch />
            
            {/* Quick Region Navigation */}
            <div className="mt-12 max-w-4xl mx-auto">
              <h3 className="text-2xl font-semibold text-center text-gray-900 mb-8">
                Browse by Region
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Link href="/locations?region=united-states">
                  <div className="bg-white/90 backdrop-blur rounded-lg p-4 text-center hover:bg-white hover:shadow-md transition-all cursor-pointer border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-1">USA</h4>
                    <p className="text-sm text-gray-600">50 locations</p>
                  </div>
                </Link>
                <Link href="/locations?region=europe">
                  <div className="bg-white/90 backdrop-blur rounded-lg p-4 text-center hover:bg-white hover:shadow-md transition-all cursor-pointer border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-1">Europe</h4>
                    <p className="text-sm text-gray-600">10 locations</p>
                  </div>
                </Link>
                <Link href="/locations?region=israel">
                  <div className="bg-white/90 backdrop-blur rounded-lg p-4 text-center hover:bg-white hover:shadow-md transition-all cursor-pointer border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-1">Israel</h4>
                    <p className="text-sm text-gray-600">40 locations</p>
                  </div>
                </Link>
                <Link href="/locations?region=australia">
                  <div className="bg-white/90 backdrop-blur rounded-lg p-4 text-center hover:bg-white hover:shadow-md transition-all cursor-pointer border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-1">Australia</h4>
                    <p className="text-sm text-gray-600">10 locations</p>
                  </div>
                </Link>
              </div>
              
              {/* Large Communities */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-center text-gray-800">
                  Large Communities
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Link href="/locations?search=Brooklyn">
                    <div className="bg-blue-100/80 backdrop-blur rounded-full py-2 px-4 text-center hover:bg-blue-200 transition-colors cursor-pointer">
                      <span className="text-sm font-medium text-blue-900">Brooklyn</span>
                    </div>
                  </Link>
                  <Link href="/locations?search=Lakewood">
                    <div className="bg-blue-100/80 backdrop-blur rounded-full py-2 px-4 text-center hover:bg-blue-200 transition-colors cursor-pointer">
                      <span className="text-sm font-medium text-blue-900">Lakewood</span>
                    </div>
                  </Link>
                  <Link href="/locations?search=Monsey">
                    <div className="bg-blue-100/80 backdrop-blur rounded-full py-2 px-4 text-center hover:bg-blue-200 transition-colors cursor-pointer">
                      <span className="text-sm font-medium text-blue-900">Monsey</span>
                    </div>
                  </Link>
                  <Link href="/locations?search=Los Angeles">
                    <div className="bg-blue-100/80 backdrop-blur rounded-full py-2 px-4 text-center hover:bg-blue-200 transition-colors cursor-pointer">
                      <span className="text-sm font-medium text-blue-900">Los Angeles</span>
                    </div>
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Link href="/locations?search=Jerusalem">
                    <div className="bg-green-100/80 backdrop-blur rounded-full py-2 px-4 text-center hover:bg-green-200 transition-colors cursor-pointer">
                      <span className="text-sm font-medium text-green-900">Jerusalem</span>
                    </div>
                  </Link>
                  <Link href="/locations?search=Bnei Brak">
                    <div className="bg-green-100/80 backdrop-blur rounded-full py-2 px-4 text-center hover:bg-green-200 transition-colors cursor-pointer">
                      <span className="text-sm font-medium text-green-900">Bnei Brak</span>
                    </div>
                  </Link>
                  <Link href="/locations?search=London">
                    <div className="bg-purple-100/80 backdrop-blur rounded-full py-2 px-4 text-center hover:bg-purple-200 transition-colors cursor-pointer">
                      <span className="text-sm font-medium text-purple-900">London</span>
                    </div>
                  </Link>
                  <Link href="/locations?search=Melbourne">
                    <div className="bg-orange-100/80 backdrop-blur rounded-full py-2 px-4 text-center hover:bg-orange-200 transition-colors cursor-pointer">
                      <span className="text-sm font-medium text-orange-900">Melbourne</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Location Categories */}
        <div className="container mx-auto px-4">
          <div className="mt-16 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              All Locations Coded
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Link href="/locations?region=united-states">
                <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                  <div className="flex items-center justify-center mb-4">
                    <MapPin className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">United States</h3>
                  <p className="text-gray-600 text-center text-sm">50 locations across all major cities</p>
                  <div className="text-center mt-3">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">#1-#50</span>
                  </div>
                </div>
              </Link>
              
              <Link href="/locations?region=canada">
                <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                  <div className="flex items-center justify-center mb-4">
                    <MapPin className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">Canada</h3>
                  <p className="text-gray-600 text-center text-sm">20 locations in major provinces</p>
                  <div className="text-center mt-3">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">#51-#70</span>
                  </div>
                </div>
              </Link>
              
              <Link href="/locations?region=europe">
                <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                  <div className="flex items-center justify-center mb-4">
                    <MapPin className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">Europe</h3>
                  <p className="text-gray-600 text-center text-sm">10 locations across Europe</p>
                  <div className="text-center mt-3">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">#71-#80</span>
                  </div>
                </div>
              </Link>
              
              <Link href="/locations?region=australia">
                <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                  <div className="flex items-center justify-center mb-4">
                    <MapPin className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">Australia</h3>
                  <p className="text-gray-600 text-center text-sm">10 locations in key cities</p>
                  <div className="text-center mt-3">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">#81-#90</span>
                  </div>
                </div>
              </Link>
              
              <Link href="/locations?region=israel">
                <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                  <div className="flex items-center justify-center mb-4">
                    <MapPin className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">Israel</h3>
                  <p className="text-gray-600 text-center text-sm">40 locations nationwide</p>
                  <div className="text-center mt-3">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">#91-#130</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
          
          {/* Quick Info Cards */}
          <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">$20 Deposit</h3>
              <p className="text-gray-600">Fully refundable when returned</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">2 Week Loan</h3>
              <p className="text-gray-600">Standard borrowing period</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">130 Locations</h3>
              <p className="text-gray-600">Worldwide coverage</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}