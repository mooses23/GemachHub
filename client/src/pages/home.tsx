import { Link } from "wouter";
import { LocationSearch } from "@/components/locations/location-search";

export default function Home() {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 to-white"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4 py-16">
            <div className="text-center max-w-4xl mx-auto mb-12">
              <div className="mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">BB</span>
                  </div>
                  <h1 className="text-5xl font-bold text-gray-900">
                    Baby Banz Earmuffs
                  </h1>
                </div>
                <h2 className="text-3xl font-semibold text-blue-700 mb-4">
                  Gemach Network
                </h2>
              </div>
              <p className="text-xl text-gray-600 mb-8">
                Protect your baby's hearing with our global gemach network. 
                Search by zip code, city, or location code to find the nearest location.
              </p>
            </div>
            
            {/* Continental Navigation */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <button 
                onClick={() => window.open('/locations?region=united-states', '_blank')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                USA
              </button>
              <button 
                onClick={() => window.open('/locations?region=europe', '_blank')}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Europe
              </button>
              <button 
                onClick={() => window.open('/locations?region=israel', '_blank')}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Israel
              </button>
              <button 
                onClick={() => window.open('/locations?region=australia', '_blank')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Australia
              </button>
            </div>

            <LocationSearch />

            {/* Popular Cities */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 max-w-4xl mx-auto mt-8">
              <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">
                Popular Cities
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                <button 
                  onClick={() => window.open('/locations?search=Brooklyn', '_blank')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
                >
                  Brooklyn
                </button>
                <button 
                  onClick={() => window.open('/locations?search=Lakewood', '_blank')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
                >
                  Lakewood
                </button>
                <button 
                  onClick={() => window.open('/locations?search=Monsey', '_blank')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
                >
                  Monsey
                </button>
                <button 
                  onClick={() => window.open('/locations?search=Los Angeles', '_blank')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
                >
                  Los Angeles
                </button>
                <button 
                  onClick={() => window.open('/locations?search=Jerusalem', '_blank')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
                >
                  Jerusalem
                </button>
                <button 
                  onClick={() => window.open('/locations?search=London', '_blank')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
                >
                  London
                </button>
                <button 
                  onClick={() => window.open('/locations?search=Melbourne', '_blank')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
                >
                  Melbourne
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* How It Works Section */}
        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Our gemach network makes it easy to protect your baby's hearing at events and gatherings.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Find a Location</h3>
                <p className="text-gray-600">
                  Search for the nearest gemach location using our search tool above.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📞</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Contact & Reserve</h3>
                <p className="text-gray-600">
                  Call or message the location coordinator to reserve earmuffs for your event.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👶</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Protect & Return</h3>
                <p className="text-gray-600">
                  Use the earmuffs to protect your baby's hearing and return them when done.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="bg-blue-900 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Want to Open a Location?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Help expand our network by opening a gemach location in your community.
            </p>
            <Link href="/apply">
              <button className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Apply to Open a Location
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}