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
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Find Baby Earmuffs Near You
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Protect your baby's hearing with our global gemach network. 
                Search by zip code, city, or location code to find the nearest location.
              </p>
            </div>
            
            <LocationSearch />
          </div>
        </div>
        
        {/* Location Categories */}
        <div className="container mx-auto px-4">
          <div className="mt-16 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              All Locations Coded
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/locations?region=united-states">
                <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <MapPin className="h-8 w-8 text-blue-600" />
                    <span className="text-sm font-medium text-gray-500">#1-#50</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">United States</h3>
                  <p className="text-gray-600">50 locations across all major cities</p>
                </div>
              </Link>
              
              <Link href="/locations?region=canada">
                <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <MapPin className="h-8 w-8 text-red-600" />
                    <span className="text-sm font-medium text-gray-500">#51-#70</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Canada</h3>
                  <p className="text-gray-600">20 locations in major provinces</p>
                </div>
              </Link>
              
              <Link href="/locations?region=australia">
                <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <MapPin className="h-8 w-8 text-green-600" />
                    <span className="text-sm font-medium text-gray-500">#71-#80</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Australia</h3>
                  <p className="text-gray-600">10 locations in key cities</p>
                </div>
              </Link>
              
              <Link href="/locations?region=europe">
                <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <MapPin className="h-8 w-8 text-purple-600" />
                    <span className="text-sm font-medium text-gray-500">#81-#90</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Europe</h3>
                  <p className="text-gray-600">10 locations across Europe</p>
                </div>
              </Link>
              
              <Link href="/locations?region=israel">
                <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <MapPin className="h-8 w-8 text-orange-600" />
                    <span className="text-sm font-medium text-gray-500">#91-#130</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Israel</h3>
                  <p className="text-gray-600">40 locations nationwide</p>
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
              <h3 className="text-xl font-semibent text-gray-900 mb-2">130 Locations</h3>
              <p className="text-gray-600">Worldwide coverage</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}