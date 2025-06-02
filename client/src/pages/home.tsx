import { LocationSearch } from "@/components/locations/location-search";
import { SelfDeposit } from "@/components/home/self-deposit";

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
        <div className="container mx-auto px-4 py-16">
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
        
        <SelfDeposit />
      </div>
    </>
  );
}
